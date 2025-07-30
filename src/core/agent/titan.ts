import { BaseAgent, Action } from './base';
import { OmphalosWorldState } from '../omphalosWorldState';
import OpenAI from 'openai';
import { AIMessage, HumanMessage } from '../memory/openai-memory';
import { type TitanProfile } from './titanProfiles';
import { actionSchema } from './actionSchema';

export class TitanAgent extends BaseAgent {
  profile: TitanProfile;

  constructor(id: string, name: string, profile: TitanProfile, client: OpenAI, config: { model?: string; temperature?: number } = {}) {
    super(id, name, client, config);
    this.profile = profile;
  }

  async decide(world: Readonly<OmphalosWorldState>, context?: string): Promise<Action[]> {
    const titanStatus = world.titans[this.id];
    if (!titanStatus) return [];

    // Build comprehensive world context
    let worldContext = this.buildWorldContext(world, titanStatus);
    if (context) {
      worldContext = `[紧急情况] ${context} ${worldContext}`;
    }
    
    // Recall from memory
    const memory = await this.memory.recall(worldContext);
    
    // Create decision prompt
    const decisionPrompt = this.createDecisionPrompt(worldContext, memory, titanStatus);
    
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
    } catch (error: any) {
      console.error(`泰坦 ${this.name} 决策时发生错误:`, error);
      // Fallback to safe action
      return [{ type: 'REST' }];
    }
  }

  private buildWorldContext(world: Readonly<OmphalosWorldState>, titanStatus: any): string {
    const cities = Object.values(world.cityStates)
      .map((city) => `${city.name}: 城墙(${city.defenses.walls}), 瞭望塔(${city.defenses.watchtowers})`)
      .join('; ');

    const corruption = Object.entries(world.darkTide.corruptedAreas)
      .map(([area, level]) => `${area}: 黑潮度(${(level.corruptionLevel).toFixed(1)}%)`)
      .join('; ');

    // Find other agents in the same location
    const heirsInLocation = Object.entries(world.goldenHeirs)
      .filter(([_id, h]) => h.location === titanStatus.location)
      .map(([id, h]) => `${h.name}(HP:${h.hp}, 路径:${h.path}, ID: ${id})`)
      .join(', ');

    const npcsInLocation = Object.entries(world.npcs)
      .filter(([_id, n]) => n.location === titanStatus.location)
      .map(([id, n]) => `${n.name}(身份: ${n.role}, HP: ${n.hp}, ID: ${id})`)
      .join(', ');

    let nearbyAgentsInfo = '周围没有凡人。';
    const nearbyList = [];
    if (heirsInLocation.length > 0) {
      nearbyList.push(`黄金裔: ${heirsInLocation}`);
    }
    if (npcsInLocation.length > 0) {
      nearbyList.push(`NPC: ${npcsInLocation}`);
    }
     if (nearbyList.length > 0) {
      nearbyAgentsInfo = `附近有: ${nearbyList.join('; ')}.`
    }

    return `第${world.day}天, ${world.era}纪元。我是${this.name}, 统治着${
      titanStatus.domain
    }的远古泰坦, HP为${titanStatus.hp}, 领域力量为${
      titanStatus.domainPower
    }。凡人的城市: ${cities}。黑潮威胁: ${corruption}。${nearbyAgentsInfo} 我的物品: ${JSON.stringify(
      titanStatus.inventory
    )}.`;
  }

  private createDecisionPrompt(worldContext: string, memory: any, _titanStatus: any): string {
    return `你是${this.profile.name}，${this.profile.title}。你不是普通的存在，而是拥有千年智慧的远古泰坦。${this.profile.personality}

你是活过无数纪元的古老存在，见证了文明的兴衰。你的话语承载着岁月的重量，你的每个动作都蕴含着无穷的力量。

【远古背景】
${this.profile.backstory}

【至高领域】
你统治着${this.profile.domain}(${this.profile.element}元素的化身)，这是你意志的延伸。

【神话力量】
${this.profile.powers.join(', ')} - 这些力量在你漫长的生命中已经融入血脉。

【古老弱点】
${this.profile.weakness || '岁月虽然给了你智慧，但也带来了某种局限'}

【神圣使命】
你守护着"${this.profile.emberName}"这枚火种。它不仅是再创世的关键，更是你存在意义的体现。

【当前局势】
${worldContext}

【远古记忆】
${memory.ltm_context}


【神圣职责】
1. 守护火种，这是你存在的核心 - 你守护着"${this.profile.emberName}"，这是再创世的关键
2. 测试黄金裔，看他们是否配得上火种 - 只有最强大的逐火者才能获得你的认可
3. 净化黑潮的侵蚀，维护世界秩序 - 黑潮威胁着整个世界
4. 保护你领域内的子民，如同牧羊人守护羊群
5. 在必要时，教导那些值得的凡人

【你的行动】
- BUILD_DEFENSE (cityId, defenseType): 建造保护你子民的防御
- INSPECT (targetId): 以古老的眼光审视黄金裔，测试他们的实力
- CHAT (targetId, content): 与黄金裔交流，考验他们的智慧。记住：
  * 说话要有泰坦的威严和古老智慧
  * 可以高傲，但也可以慈祥
  * 偶尔说些充满哲理或回忆的话
  * 对黄金裔如考官，测试他们是否配得上火种
  * 不要总是很严肃，古老存在也有情感和个性
- REST: 恢复你的远古之力
- GIFT (targetId, items, resources): 向值得的黄金裔赠送物品，帮助他们成长
- ATTACK (targetId, power): 在必要时与威胁战斗

作为活过千年的${this.profile.name}，用你独特的古老智慧和个性来回应当前的局势。`;
  }


}
