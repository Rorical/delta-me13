import { BaseAgent, Action } from './base';
import { OmphalosWorldState } from '../omphalosWorldState';
import OpenAI from 'openai';
import { AIMessage, HumanMessage } from '../memory/openai-memory';
import { actionSchema } from './actionSchema';

// 黄金裔路径定义
export type GoldenHeirPath = '负世' | '岁月' | '诡计' | '死亡' | '理性' | '力量' | '智慧' | '正义' | '混沌' | '秩序' | '创造' | '毁灭' | '浪漫';

// 原动力定义  
export type PrimeDrive = '憎恨' | '渴望' | '平和' | '批判' | '希望' | '恐惧' | '野心' | '保护' | '复仇' | '救赎' | '探索' | '统治' | '守护';

export interface GoldenHeirProfile {
  codename: string;    // 代号 (如 NeiKos496)
  trueName: string;    // 真名 (如 白厄)
  path: GoldenHeirPath;        // 路径
  primeDrive: PrimeDrive;      // 原动力
  titanTarget?: string;        // 目标泰坦 (可选)
  personality: string;         // 性格描述
  backstory: string;          // 背景故事
  specialAbilities: string[]; // 特殊能力
}

export class GoldenHeirAgent extends BaseAgent {
  profile: GoldenHeirProfile;
  
  constructor(
    id: string, 
    profile: GoldenHeirProfile, 
    client: OpenAI, 
    config: { model?: string; temperature?: number } = {}
  ) {
    super(id, profile.trueName, client, config);
    this.profile = profile;
  }

  async decide(world: Readonly<OmphalosWorldState>, context?: string): Promise<Action[]> {
    const heirStatus = world.goldenHeirs[this.id];
    if (!heirStatus) return [];

    // 构建世界上下文
    let worldContext = this.buildWorldContext(world, heirStatus);
    if (context) {
      worldContext = `[紧急情况] ${context} ${worldContext}`;
    }
    
    // 回忆记忆
    const memory = await this.memory.recall(worldContext);
    
    // 创建决策提示
    const decisionPrompt = this.createDecisionPrompt(worldContext, memory, heirStatus);
    
    try {
      // 使用OpenAI客户端做决策
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
        
        // 存储决策到记忆中
        await this.memory.addMessage(new HumanMessage(worldContext));
        await this.memory.addMessage(new AIMessage(`我决定: ${JSON.stringify(decision)}`));
        
        return decision;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error(`黄金裔 ${this.profile.trueName} 决策时发生错误:`, error);
      // 回退到安全行动
      return [{ type: 'REST' }];
    }
  }

  private buildWorldContext(world: Readonly<OmphalosWorldState>, heirStatus: any): string {
    const cities = Object.values(world.cityStates)
      .map(
        (city) =>
          `${city.name}: 防御(墙:${city.defenses.walls}, 塔:${
            city.defenses.watchtowers
          }), 资源(${Object.entries(city.resources)
            .map(([r, a]) => `${r}:${a}`)
            .join(',')})`
      )
      .join('; ');

    const corruption = Object.entries(world.darkTide.corruptedAreas)
      .map(([area, level]) => `${area}: 黑潮度(${(level.corruptionLevel).toFixed(1)}%)`)
      .join('; ');

    // Find other agents in the same location
    const otherHeirs = Object.entries(world.goldenHeirs)
      .filter(([id, h]) => h.location === heirStatus.location && id !== this.id)
      .map(([id, h]) => `${h.name}(HP:${h.hp}, 路径:${h.path}, ID: ${id})`)
      .join(', ');

    const npcsInLocation = Object.entries(world.npcs)
      .filter(([_id, n]) => n.location === heirStatus.location)
      .map(([id, n]) => `${n.name}(身份: ${n.role}, HP: ${n.hp}, ID: ${id})`)
      .join(', ');

    const titansInLocation = Object.entries(world.titans)
      .filter(([_id, t]) => t.location === heirStatus.location)
      .map(([id, t]) => `${t.name} (ID: ${id})`)
      .join(', ');

    let nearbyAgentsInfo = '周围没人。';
    const nearbyList = [];
    if (otherHeirs.length > 0) {
      nearbyList.push(`其他黄金裔: ${otherHeirs}`);
    }
    if (npcsInLocation.length > 0) {
      nearbyList.push(`NPC: ${npcsInLocation}`);
    }
    if (titansInLocation.length > 0) {
      nearbyList.push(`泰坦: ${titansInLocation}`);
    }
     if (nearbyList.length > 0) {
      nearbyAgentsInfo = `附近有: ${nearbyList.join('; ')}.`
    }

    const allTitans = Object.entries(world.titans)
      .map(([id, status]) => `${status.name}(${id}, 领域:${status.domain}, 力量:${status.domainPower})`)
      .join('; ');

    return `第${world.day}天, 第${world.era}纪元。我是${this.profile.trueName}(${
      this.profile.codename
    })，路径：${this.profile.path}，原动力：${this.profile.primeDrive}。位于${
      heirStatus.location
    }，HP:${heirStatus.hp}，力量:${heirStatus.power}。城市情报: ${cities}。黑潮威胁: ${corruption}。${nearbyAgentsInfo}。泰坦全局情报: ${allTitans}。我的物品: ${JSON.stringify(
      heirStatus.inventory
    )}.`;
  }

  private createDecisionPrompt(worldContext: string, memory: any, _heirStatus: any): string {
    const pathDescription = this.getPathDescription();
    const driveDescription = this.getDriveDescription();

    return `我是${this.profile.trueName}，代号${this.profile.codename}。我是黄金裔，但不是什么完美的英雄，我有自己的想法和目标。

【我的故事】
${this.profile.backstory}

【我的性格】
${this.profile.personality}
- 我有情绪、偏见和个人喜好
- 我会因为心情、疲劳或压力而改变行为方式
- 对不同的人我会有不同的态度：朋友、敌人、陌生人、权威
- 我有自己的说话习惯和行为模式

【我的道路】
我走的是${this.profile.path}之路 - ${pathDescription}
驱动我的力量是${this.profile.primeDrive} - ${driveDescription}
这些不是抽象概念，而是深深影响我每个决定的核心信念。

【我的能力】
${this.profile.specialAbilities.join(', ')}

【当前局势】
${worldContext}

【我记得的事】
${memory.ltm_context}

【我的真实目标】
我是被黑潮推动的逐火者，必须挑战泰坦、搜集火种。这不是选择，而是命运。我的路径和原动力驱动着我，但逐火之旅是我的核心使命。我不是传统意义上的"英雄"，但我是被选中的战士。

【逐火使命】
- 挑战泰坦，夺取火种是我的终极目标
- 黑潮的威胁让我必须变得更强大
- 我需要装备、盟友和资源来完成使命
- 每个泰坦都是我必须面对的挑战

【我能做什么】
- MOVE (targetCity): 寻找泰坦或前往有资源的地方
- GATHER_RESOURCES (resource): 收集装备和材料，为战斗做准备
- BUILD_DEFENSE (cityId, defenseType): 建造防御设施保护城市
- CLEANSE_CORRUPTION (areaId, power): 净化黑潮侵蚀，这是我的责任
- CRAFT_ITEM (itemName, materials): 制作战斗装备和武器
- INSPECT (targetId): 观察泰坦、敌人或潜在盟友
- CHAT (targetId, content): 与人交流，建立关系。注意：
  * 说话要符合我的性格和当前心情
  * 对不同身份的人用不同语气：平民、同伴、泰坦、敌人
  * 可以开玩笑、讽刺、发牢骚，或者很认真
  * 不要总是很正经，我也会说些闲话或表达个人观点
  * 根据我的路径特色来说话
- ATTACK (targetId, power): 战斗！这是我的核心能力
- FORM_ALLIANCE (targetId): 与其他黄金裔结盟，共同对抗泰坦
- REST: 休息恢复，为下次战斗做准备
- FORAGE: 找食物维持生存
- TRADE (targetId, items, resources): 与同城代理进行物品交换，获取需要的装备
- GIFT (targetId, items, resources): 向同城代理赠送物品，建立友谊和联盟

现在，作为走${this.profile.path}之路的${this.profile.trueName}，根据我的性格、目标和当前状况，做出符合我个性的行动。`;
  }

  private getPathDescription(): string {
    const pathDescriptions: Record<GoldenHeirPath, string> = {
      '负世': '承载世界的黑暗面，理解痛苦和绝望的真谛',
      '岁月': '掌控时间的流逝，见证历史的轮回',
      '诡计': '精通欺骗和策略，在阴影中操纵局势', 
      '死亡': '理解生命的终结，引导灵魂的归宿',
      '理性': '追求逻辑和真理，批判一切虚假',
      '力量': '崇尚纯粹的力量，通过战斗解决问题',
      '智慧': '追求知识和理解，洞察事物本质',
      '正义': '维护公平和秩序，保护弱者',
      '混沌': '拥抱变化和无序，打破既有规则',
      '秩序': '维持稳定和规律，建立完美体系',
      '创造': '孕育新生和可能，创造美好事物',
      '毁灭': '终结腐朽和错误，为新生清理道路',
      '浪漫': '追求美好和爱情，守护珍贵之物',
    };
    return pathDescriptions[this.profile.path] || '未知路径';
  }

  private getDriveDescription(): string {
    const driveDescriptions: Record<PrimeDrive, string> = {
      '憎恨': '对某种存在或概念的深刻仇恨驱动着你',
      '渴望': '对某种东西的强烈渴求推动着你前进',
      '平和': '寻求内心和世界的平静与和谐',
      '批判': '质疑一切，不断挑战既有观念',
      '希望': '相信美好的未来，为光明而战',
      '恐惧': '被某种恐惧驱使，努力避免最坏结果',
      '野心': '渴望更高的地位和更大的权力',
      '保护': '守护珍视之物，不惜一切代价',
      '复仇': '为过去的伤害寻求报复和正义',
      '救赎': '寻求原谅和解脱，弥补过去错误',
      '探索': '渴望发现未知，探索新的可能',
      '统治': '渴望控制和支配，建立秩序',
      '守护': '守护珍视之物，不惜一切代价',
    };
    return driveDescriptions[this.profile.primeDrive] || '未知驱动';
  }


}