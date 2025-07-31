import { BaseAgent, Action } from './base';
import { OmphalosWorldState } from '../omphalosWorldState';
import OpenAI from 'openai';
import { AIMessage, HumanMessage } from '../memory/openai-memory';
import { getNPCRoleProfile, getDefaultNPCProfile } from './npcProfiles';
import { actionSchema } from './actionSchema';
import { getNPCHealthByRole, getNPCPowerByRole, type NPCRole } from '../config/npcConfig';

export class NpcAgent extends BaseAgent {
  private role: NPCRole;
  private model: string;
  private temperature: number;
  private client: OpenAI;

  constructor(
    id: string,
    name: string,
    role: NPCRole,
    client: OpenAI,
    config: { model?: string; temperature?: number } = {}
  ) {
    // Initialize combat stats based on role
    const initialStats = {
      attackPower: getNPCPowerByRole(role),
      defenseRating: getNPCHealthByRole(role) / 10, // Simple defense calculation
      magicPower: role === 'SCHOLAR' ? 10 : 0,
      health: getNPCHealthByRole(role),
      maxHealth: getNPCHealthByRole(role),
      stamina: 80,
      maxStamina: 80
    };

    super(id, name, client, initialStats);
    this.role = role;
    this.model = config.model ?? 'gpt-4o';
    this.temperature = config.temperature ?? 0.7;
    this.client = client;
  }

  // 检查是否为o1系列模型
  protected isO1Model(): boolean {
    return this.model.toLowerCase().includes('o1') || this.model.toLowerCase().includes('o4');
  }

  // 记录AI调用日志
  protected logAICall(_prompt: string, _response: string, _duration: number, _tokenUsage?: any) {
    // This method is now handled by the environment agent
    // Keeping for compatibility but not implementing logging here
  }

  async decide(world: Readonly<OmphalosWorldState>, context?: string): Promise<Action[]> {
    const npcStatus = world.npcs[this.id];
    if (!npcStatus) return [];

    // Build comprehensive world context
    let worldContext = this.buildWorldContext(world, npcStatus);
    if (context) {
      worldContext = `[紧急情况] ${context} ${worldContext}`;
    }
    
    // Recall from memory
    const memory = await this.memory.recall(worldContext);
    
    // Create decision prompt
    const decisionPrompt = this.createDecisionPrompt(worldContext, memory, npcStatus);
    
    try {
      // Use OpenAI client to make decision
      const requestOptions: any = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: decisionPrompt
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'perform_actions',
              description: '根据你的决策执行一个或多个行动。',
              parameters: {
                type: 'object',
                properties: {
                  actions: {
                    type: 'array',
                    items: actionSchema
                  }
                },
                required: ['actions']
              }
            }
          }
        ],
        tool_choice: {
          type: 'function',
          function: { name: 'perform_actions' }
        }
      };

      // 只有非o1模型才传递temperature参数
      if (!this.isO1Model()) {
        requestOptions.temperature = this.temperature;
      }

      const startTime = Date.now();
      const response = await this.client.chat.completions.create(requestOptions);
      const duration = Date.now() - startTime;
      
      const responseMessage = response.choices[0].message;
      const toolCalls = responseMessage.tool_calls;

      // 记录AI调用日志
      const responseContent = toolCalls ? JSON.stringify(toolCalls[0].function.arguments) : '无有效响应';
      this.logAICall(decisionPrompt, responseContent, duration, response.usage);

      if (toolCalls) {
        const toolCall = toolCalls[0];
        const args = JSON.parse(toolCall.function.arguments);
        const decision = args.actions as Action[];
        
        // Store the decision in memory
        await this.memory.addMessage(new HumanMessage(worldContext));
        await this.memory.addMessage(new AIMessage(`我决定: ${JSON.stringify(decision)}`));
        
        return decision;
      } else {
        return [];
      }
    } catch (error) {
      console.error(`NPC ${this.name} 决策时发生错误:`, error);
      // Fallback to safe action
      return [{ type: 'REST' }];
    }
  }

  private buildWorldContext(world: Readonly<OmphalosWorldState>, npcStatus: any): string {
    const currentCity = world.cityStates[npcStatus.location];
    const cityInfo = currentCity
      ? `${currentCity.name}: 城墙(${currentCity.defenses.walls}), 瞭望塔(${currentCity.defenses.watchtowers})`
      : '未知地点';

    const corruption = Object.entries(world.darkTide.corruptedAreas)
      .map(([area, level]) => `${area}: 黑潮度(${(level.corruptionLevel).toFixed(1)}%)`)
      .join('; ');

    // Find other agents in the same location
    const otherHeirs = Object.entries(world.goldenHeirs).filter(
      ([id, h]) => h.location === npcStatus.location && id !== this.id
    );
    const otherNpcs = Object.entries(world.npcs).filter(
      ([id, n]) => n.location === npcStatus.location && id !== this.id
    );
    const titansInLocation = Object.entries(world.titans).filter(
      ([_id, t]) => t.location === npcStatus.location
    );

    let nearbyAgentsInfo = '周围没人。';
    const nearbyList = [];
    if (otherHeirs.length > 0) {
      nearbyList.push(`黄金裔: ${otherHeirs.map(([id, h]) => `${h.name} (HP: ${h.hp}, ID: ${id})`).join(', ')}`);
    }
    if (otherNpcs.length > 0) {
      nearbyList.push(`其他NPC: ${otherNpcs.map(([id, n]) => `${n.name} (身份: ${n.role}, HP: ${n.hp}, ID: ${id})`).join(', ')}`);
    }
    if (titansInLocation.length > 0) {
      nearbyList.push(`泰坦: ${titansInLocation.map(([id, t]) => `${t.name} (ID: ${id})`).join(', ')}`);
    }
    if (nearbyList.length > 0) {
      nearbyAgentsInfo = `附近有: ${nearbyList.join('; ')}.`
    }

    return `第${world.day}天, ${world.era}纪元。我是${this.name}, 一个位于${cityInfo}的${this.role}, HP为${npcStatus.hp}。世界黑潮情况: ${corruption}。${nearbyAgentsInfo} 我的物品: ${JSON.stringify(npcStatus.inventory)}。`;
  }

  private createDecisionPrompt(worldContext: string, memory: any, _npcStatus: any): string {
    const profile = getNPCRoleProfile(this.role) || getDefaultNPCProfile();

    return `你是${this.name}，${profile.description}

【你的个性】
${profile.personality}
- 你有自己的喜怒哀乐，会开玩笑、抱怨、兴奋或沮丧
- 说话时带有个人色彩和方言特色，不会说得像教科书一样
- 你会根据心情和关系改变说话方式
- 你有自己的小习惯、口头禅和说话方式

【内心驱动】
${profile.motivations.join(', ')}

【生活状况】
${worldContext}

【记忆片段】
${memory.ltm_context}

【你能做的事】
${profile.actions.map(action => `- ${action}`).join('\n')}

【基本行动】
- INSPECT (targetId): 观察某人或某物，满足好奇心
- CHAT (targetId, content): 和人聊天交流。记住：
  * 说话要自然，就像真人一样
  * 可以开玩笑、吐槽、八卦、抱怨
  * 根据对方身份调整语气（朋友/陌生人/泰坦/黄金裔）
  * 偶尔说些废话或闲聊，不要总是很正经
  * 用你的方言或口头禅，让对话有趣
- MOVE (targetCity): 去别的地方
- REST: 休息一下
- GATHER_RESOURCES (resource): 收集资源（商人、工匠常用）
- CRAFT_ITEM (itemName, materials): 制作物品（工匠、学者常用）
- BUILD_DEFENSE (cityId, defenseType): 建造防御（守卫常用）
- TRADE (targetId, items, resources): 与同城代理进行物品交换（商人最常用）
- GIFT (targetId, items, resources): 向同城代理赠送物品或资源（所有角色都可以）

【角色特色】
${this.role === 'MERCHANT' ? '- 你是商人，TRADE是你的核心技能，要经常与黄金裔交易装备和资源' : ''}
${this.role === 'CRAFTSMAN' ? '- 你是工匠，CRAFT_ITEM是你的专长，要为黄金裔制作装备' : ''}
${this.role === 'GUARD' ? '- 你是守卫，BUILD_DEFENSE是你的职责，要保护城市安全' : ''}
${this.role === 'SCHOLAR' ? '- 你是学者，INSPECT和CRAFT_ITEM是你的专长，要研究泰坦和火种' : ''}

重要提示: 建造防御(BUILD_DEFENSE)时，cityId必须是你当前所在的城市ID!

现在，作为${this.name}这个活生生的人，根据你的性格和当前情况，自然地做出反应和行动。记住，你是一个有血有肉的人！`;
  }
}
