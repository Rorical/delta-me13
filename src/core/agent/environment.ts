import type { OmphalosWorldState } from "../omphalosWorldState";
import type { Action, BaseAgent, AICallLog } from "./base";
import { getRecipe } from "../recipes";
import { CommunicationService } from "../../services/comms";

export class EnvironmentAgent {
  private worldState: OmphalosWorldState;
  private comms: CommunicationService;
  private onUpdate: (state: OmphalosWorldState) => void;

  constructor(
    initialState: OmphalosWorldState,
    onUpdate: (state: OmphalosWorldState) => void = () => {}
  ) {
    this.worldState = initialState;
    this.comms = new CommunicationService();
    this.onUpdate = onUpdate;
  }

  // 设置代理的日志回调
  setupAgentLogging(agents: BaseAgent[]) {
    agents.forEach((agent) => {
      agent.setLogCallback((log: AICallLog) => {
        this.logAICall(log);
      });
    });
  }

  // 记录AI调用日志
  private logAICall(log: AICallLog) {
    /*
    this.worldState.logs.push({
      timestamp: log.timestamp,
      day: this.worldState.day,
      type: 'ai_call',
      message: `${log.agentName}(${log.agentType}) 进行了思考 - 耗时${log.duration}ms`,
      importance: 'low',
      tags: ['ai_call', log.agentType.toLowerCase()],
      metadata: {
        agentId: log.agentId,
        model: log.model,
        duration: log.duration,
        tokenUsage: log.tokenUsage,
        prompt: log.prompt,
        response: log.response
      }
    });*/
    this.onUpdate(this.worldState);
  }

  public getState(): Readonly<OmphalosWorldState> {
    return this.worldState;
  }

  public getCommunicationService(): CommunicationService {
    return this.comms;
  }

  // 判断是否是泰坦代理
  private isTitanAgent(agent: BaseAgent): boolean {
    return this.worldState.titans.hasOwnProperty(agent.id);
  }

  // 为代理构建增强的世界上下文
  private buildEnhancedWorldContext(): string {
    const validCities = Object.keys(this.worldState.cityStates).join(", ");

    const cityResources = Object.entries(this.worldState.cityStates)
      .map(([cityId, city]) => {
        const resources = Object.entries(city.resources)
          .filter(([_, amount]) => amount > 0)
          .map(([name, amount]) => `${name}:${amount}`)
          .join(",");
        return `${cityId}[${resources || "无资源"}]`;
      })
      .join("; ");

    // 黑潮威胁信息
    const corruptionInfo = Object.entries(this.worldState.darkTide.corruptedAreas)
      .map(([area, level]) => `${area}: ${(level.corruptionLevel * 100).toFixed(1)}%`)
      .join(", ");

    // 泰坦信息
    const titanInfo = Object.entries(this.worldState.titans)
      .map(([id, titan]) => `${titan.name}(${id})`)
      .join(", ");

    return `\n=== 世界状态参考 ===
可用城市: ${validCities}
城市资源分布: ${cityResources}
黑潮威胁: ${corruptionInfo || "暂无"}
泰坦位置: ${titanInfo || "未知"}
=== 逐火之旅指导 ===
• 黄金裔：你们被黑潮推动，必须挑战泰坦、搜集火种
• 商人：与黄金裔交易装备和资源，支持他们的逐火之旅
• 工匠：为黄金裔制作装备，帮助他们对抗泰坦
• 守卫：保护城市安全，为黄金裔提供后方支持
• 学者：研究泰坦和火种，为黄金裔提供知识
• 泰坦：守护火种，测试黄金裔是否配得上火种
=== 行动指导 ===
• 移动前请确认目标城市存在
• 收集前请确认当前城市有对应资源
• 对话前请确认目标代理存在
• 对话要简洁有目的，避免无意义闲聊
• 优先执行具体行动（移动、收集、交易等）
• 收到对话请求时，优先考虑实际行动而非继续对话
• 每次只与一个目标对话
• 收到对话时必须回应，可以选择继续对话或执行行动
• 语言要自然多样，避免固定格式如"嘿，"等开头
• TRADE和GIFT要经常使用，建立合作关系
===============================\n`;
  }

  // 智能对话处理：支持名字匹配和对话驱动的行动
  private async processConversationChainWithIntelligence(
    initiator: BaseAgent,
    chatAction: Action,
    agents: BaseAgent[],
    actionBuckets: { agent: BaseAgent; actions: Action[] }[] = []
  ) {
    const maxConversationDepth = 6; // 增加深度以支持更复杂的对话
    let conversationDepth = 0;
    let currentSpeaker = initiator;
    let currentAction = chatAction;
    const conversationHistory: string[] = [];

    while (conversationDepth < maxConversationDepth) {
      if (currentAction.type !== "CHAT") {
        break;
      }

      const currentChatAction = currentAction as Extract<
        Action,
        { type: "CHAT" }
      >;

      conversationHistory.push(currentChatAction.content);

      // 执行当前CHAT动作
      this.executeAction(currentSpeaker, currentAction);

      // 智能名字匹配：支持ID、名字、部分名字匹配
      const targetAgent = this.findAgentByNameOrId(
        currentChatAction.targetId,
        agents
      );
      if (!targetAgent) {
        this.log(`找不到目标代理: ${currentChatAction.targetId}`, "low");
        break;
      }

      // 泰坦特殊处理
      if (this.isTitanAgent(targetAgent)) {
        const reactionContext = `${currentSpeaker.name} (id: ${currentSpeaker.id}) 对你说道: "${currentChatAction.content}"。请简洁回应，体现泰坦的威严，语言要自然多样`;
        const reactions = await targetAgent.decide(
          this.worldState as any,
          reactionContext
        );

        const targetBucket = actionBuckets.find(
          (b) => b.agent.id === targetAgent.id
        );
        if (targetBucket) {
          targetBucket.actions.push(...reactions);
        }
        break;
      }

      // 智能响应：让代理根据对话内容决定行动，并提供ID信息
      const reactionContext = `${currentSpeaker.name} (id: ${currentSpeaker.id}) 对你说道: "${currentChatAction.content}"。请自然回应这个对话，语言要灵活多样，避免固定格式。可以选择继续对话或执行其他行动`;

      const reactions = await targetAgent.decide(
        this.worldState as any,
        reactionContext
      );

      // 查找CHAT响应
      const nextChatAction = reactions.find(
        (action) => action.type === "CHAT"
      ) as Extract<Action, { type: "CHAT" }> | undefined;

      if (nextChatAction) {
        // 继续对话链
        currentSpeaker = targetAgent;
        currentAction = nextChatAction;
        conversationDepth++;

        // 立即执行其他动作（如果有actionBuckets则加入，否则直接执行）
        const otherActions = reactions.filter(
          (action) => action.type !== "CHAT"
        );
        if (actionBuckets.length > 0) {
          const targetBucket = actionBuckets.find(
            (b) => b.agent.id === targetAgent.id
          );
          if (targetBucket) {
            targetBucket.actions.push(...otherActions);
          }
        } else {
          // 直接执行其他动作
          for (const action of otherActions) {
            this.executeAction(targetAgent, action);
          }
        }
      } else {
        // 没有CHAT响应，强制生成一个简单的回应
        if (!nextChatAction) {
          const simpleResponse: Action = {
            type: "CHAT",
            targetId: currentSpeaker.id,
            content: `我听到了，${currentSpeaker.name}。`,
          };

          // 将简单回应加入对话链
          currentSpeaker = targetAgent;
          currentAction = simpleResponse;
          conversationDepth++;

          // 立即执行其他动作（如果有actionBuckets则加入，否则直接执行）
          if (actionBuckets.length > 0) {
            const targetBucket = actionBuckets.find(
              (b) => b.agent.id === targetAgent.id
            );
            if (targetBucket) {
              targetBucket.actions.push(...reactions);
            }
          } else {
            // 直接执行其他动作
            for (const action of reactions) {
              this.executeAction(targetAgent, action);
            }
          }
        } else {
          // 有CHAT但质量低，结束对话链
          if (actionBuckets.length > 0) {
            const targetBucket = actionBuckets.find(
              (b) => b.agent.id === targetAgent.id
            );
            if (targetBucket) {
              targetBucket.actions.push(...reactions);
            }
          } else {
            // 直接执行所有反应动作
            for (const action of reactions) {
              this.executeAction(targetAgent, action);
            }
          }
          break;
        }
      }
    }
  }

  // 智能名字匹配：支持ID、完整名字、部分名字匹配
  private findAgentByNameOrId(
    targetId: string,
    agents: BaseAgent[]
  ): BaseAgent | undefined {
    // 1. 精确ID匹配
    let agent = agents.find((a) => a.id === targetId);
    if (agent) return agent;

    // 2. 精确名字匹配
    agent = agents.find((a) => a.name === targetId);
    if (agent) return agent;

    // 3. 部分名字匹配（包含关系）
    agent = agents.find(
      (a) => a.name.includes(targetId) || targetId.includes(a.name)
    );
    if (agent) return agent;

    // 4. 模糊匹配（处理常见变体）
    const normalizedTarget = targetId.toLowerCase().replace(/[^a-z0-9]/g, "");
    agent = agents.find((a) => {
      const normalizedName = a.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      return (
        normalizedName.includes(normalizedTarget) ||
        normalizedTarget.includes(normalizedName)
      );
    });

    return agent;
  }

  // 处理对话链，确保对话连贯性和质量
  private async processConversationChain(
    initiator: BaseAgent,
    chatAction: Action,
    agents: BaseAgent[],
    actionBuckets: { agent: BaseAgent; actions: Action[] }[]
  ) {
    const maxConversationDepth = 5; // 最多连续对话5轮
    let conversationDepth = 0;
    let currentSpeaker = initiator;
    let currentAction = chatAction;
    const conversationHistory: string[] = []; // 记录对话历史

    while (conversationDepth < maxConversationDepth) {
      // 确保当前动作是CHAT类型
      if (currentAction.type !== "CHAT") {
        break;
      }

      const currentChatAction = currentAction as Extract<
        Action,
        { type: "CHAT" }
      >;

      conversationHistory.push(currentChatAction.content);

      // 执行当前CHAT动作
      this.executeAction(currentSpeaker, currentAction);

      // 寻找对话目标
      const targetAgent = agents.find(
        (a) =>
          a.id === currentChatAction.targetId ||
          a.name === currentChatAction.targetId
      );
      if (!targetAgent) {
        break; // 目标不存在，结束对话链
      }

      // 如果目标是泰坦，让其响应但结束对话链（泰坦不主动继续对话）
      if (this.isTitanAgent(targetAgent)) {
        const reactionContext = `${currentSpeaker.name} 对你说道: "${currentChatAction.content}"。请简洁回应，体现泰坦的威严。`;
        const reactions = await targetAgent.decide(
          this.worldState as any,
          reactionContext
        );

        const targetBucket = actionBuckets.find(
          (b) => b.agent.id === targetAgent.id
        );
        if (targetBucket) {
          targetBucket.actions.push(...reactions);
        }
        break; // 泰坦响应后结束对话链
      }

      // 让目标代理立即响应，强调简洁和目的性
      const reactionContext = `${currentSpeaker.name} 对你说道: "${currentChatAction.content}"。请简洁回应，避免闲聊，尽快转向具体行动（如交易、移动、收集等）。`;
      const reactions = await targetAgent.decide(
        this.worldState as any,
        reactionContext
      );

      // 查找响应中的动作
      const nextChatAction = reactions.find(
        (action) => action.type === "CHAT"
      ) as Extract<Action, { type: "CHAT" }> | undefined;
      
      const otherActions = reactions.filter(
        (action) => action.type !== "CHAT"
      );

      // 优先执行非CHAT动作（如收集、移动、交易等）
      if (otherActions.length > 0) {
        this.log(`${targetAgent.name} 在对话中决定执行 ${otherActions.length} 个动作`, 'medium');
        for (const action of otherActions) {
          this.executeAction(targetAgent, action);
        }
        this.onUpdate(this.worldState);
      }

      if (nextChatAction) {
        // 如果有CHAT，继续对话链
        currentSpeaker = targetAgent;
        currentAction = nextChatAction;
        conversationDepth++;
      } else {
        break;
      }
    }
  }

  // 处理单个非对话动作
  private async processSingleAction(
    agent: BaseAgent,
    action: Action,
    actionBuckets: { agent: BaseAgent; actions: Action[] }[]
  ) {
    let immediateResponse = undefined;

    if (action.type === "INSPECT") {
      const inspectAction = action as Extract<Action, { type: "INSPECT" }>;
      const inspectionResult = this.executeAction(agent, action);
      const reactionContext = `你观察了 ${inspectAction.targetId} 后得到如下信息: ${inspectionResult}`;
      immediateResponse = { targetAgent: agent, reactionContext };
    } else {
      this.executeAction(agent, action);
    }

    // 处理即时反应（仅限INSPECT的自我反应）
    if (immediateResponse) {
      const { targetAgent, reactionContext } = immediateResponse;
      const reactions = await targetAgent.decide(
        this.worldState as any,
        reactionContext
      );

      const targetBucket = actionBuckets.find(
        (b) => b.agent.id === targetAgent.id
      );
      if (targetBucket) {
        targetBucket.actions.push(...reactions);
      }
    }
  }

  // 修剪世界日志，保留重要日志并限制数量
  private trimWorldLogs() {
    const maxLogs = 1000; // 最多保留1000条日志

    if (this.worldState.logs.length > maxLogs) {
      // 优先保留高重要度的日志
      const importantLogs = this.worldState.logs.filter(
        (log) => log.importance === "high" || log.importance === "critical"
      );

      const recentLogs = this.worldState.logs.slice(-maxLogs * 0.7); // 保留最近70%的日志

      // 合并重要日志和最近日志，去重
      const preservedLogs = [...importantLogs, ...recentLogs]
        .filter(
          (log, index, arr) =>
            arr.findIndex((l) => l.timestamp === log.timestamp) === index
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      this.worldState.logs = preservedLogs.slice(-maxLogs);

      console.log(
        `日志修剪完成：从 ${
          this.worldState.logs.length +
          (this.worldState.logs.length - preservedLogs.length)
        } 条减少到 ${this.worldState.logs.length} 条`
      );
    }
  }

  private log(
    message: string,
    importance: "low" | "medium" | "high" | "critical" = "medium",
    tags: string[] = []
  ) {
    this.worldState.logs.push({
      timestamp: Date.now(),
      day: this.worldState.day,
      type: "action",
      message,
      importance,
      tags: ["agent_action", ...tags],
    });
    console.log(`[第${this.worldState.day}天] ${message}`);
    this.onUpdate(this.worldState);
  }

  public async runDailyCycle(agents: BaseAgent[]) {
    this.worldState.day++;
    this.log("新的一天开始了。", "high");

    // 1. 每天随机打乱代理执行顺序
    const shuffledAgents = [...agents].sort(() => Math.random() - 0.5);

    // 2. 按随机顺序逐个代理决策并立即执行
    const enhancedContext = this.buildEnhancedWorldContext();
    const interactionLimit = 100;
    let totalInteractions = 0;

    for (const agent of shuffledAgents) {
      if (this.isTitanAgent(agent)) {
        this.log(`${agent.name} (泰坦) 跳过主动行动`, "low");
        continue; // 泰坦不主动行动
      }

      // 代理决策
      this.log(`${agent.name} 开始决策...`, "medium");
      const actions = await agent.decide(
        this.worldState as any,
        enhancedContext
      );
      this.onUpdate(this.worldState);

      if (actions.length === 0) {
        this.log(`${agent.name} 没有决定任何行动`, "low");
        continue;
      }

      this.log(`${agent.name} 决定执行 ${actions.length} 个动作`, "medium");

      // 立即执行该代理的所有动作
      for (const action of actions) {
        if (totalInteractions >= interactionLimit) {
          this.log(`${agent.name} 的动作被限制，已达到每日互动上限`, "medium");
          break;
        }

        if (action.type === "CHAT") {
          // CHAT动作触发对话链和智能响应
          await this.processConversationChainWithIntelligence(
            agent,
            action,
            agents,
            []
          );
          totalInteractions += 5; // 对话链消耗更多交互次数
        } else {
          // 非对话动作直接执行
          this.executeAction(agent, action);
          totalInteractions++;
        }

        this.onUpdate(this.worldState);
      }
    }

    if (totalInteractions >= interactionLimit) {
      this.log("本日互动次数已达上限。", "medium");
    }

    // 3. World events
    this.processWorldEvents();
    this.onUpdate(this.worldState);

    // 4. 内存管理
    this.trimWorldLogs();

    this.log("一天结束了。", "high");
  }

  private processWorldEvents() {
    // 黑潮黑潮扩散
    Object.values(this.worldState.darkTide.corruptedAreas).forEach((area) => {
      if (area.isExpanding) {
        const oldLevel = area.corruptionLevel;
        area.corruptionLevel = Math.min(
          100,
          area.corruptionLevel + Math.random() * 2
        );

        if (area.corruptionLevel - oldLevel > 1) {
          this.log(
            `黑潮在${area.name}扩散。黑潮程度: ${area.corruptionLevel.toFixed(
              1
            )}%`
          );
        }

        // 影响附近城市
        Object.keys(this.worldState.cityStates).forEach((cityId) => {
          if (area.affectedCities.includes(cityId)) {
            this.worldState.cityStates[cityId].darkTideInfluence = Math.min(
              100,
              this.worldState.cityStates[cityId].darkTideInfluence +
                Math.random() * 1
            );
          }
        });
      }
    });

    // 城邦资源再生
    Object.values(this.worldState.cityStates).forEach((cityState) => {
      // 安全地更新基础资源字段
      cityState.resources.food = Math.min(
        2000,
        cityState.resources.food + Math.floor(Math.random() * 50) + 10
      );
      cityState.resources.materials = Math.min(
        1500,
        cityState.resources.materials + Math.floor(Math.random() * 30) + 5
      );
      cityState.resources.wealth = Math.min(
        10000,
        cityState.resources.wealth + Math.floor(Math.random() * 100) + 20
      );
      cityState.resources.mana = Math.min(
        500,
        cityState.resources.mana + Math.floor(Math.random() * 20) + 5
      );

      // 繁荣度缓慢变化
      const prosperityChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      cityState.prosperity = Math.max(
        0,
        Math.min(100, cityState.prosperity + prosperityChange)
      );
    });
  }

  private getAgentStatus(agentId: string) {
    // This helper safely retrieves any agent's status from the world state.
    return (
      this.worldState.goldenHeirs[agentId] ||
      this.worldState.titans[agentId] ||
      this.worldState.npcs[agentId]
    );
  }

  private executeAction(agent: BaseAgent, action: Action) {
    const agentStatus = this.getAgentStatus(agent.id);
    if (!agentStatus) {
      this.log(`严重错误: 找不到电信号 ${agent.name} (${agent.id}) 的状态`);
      return;
    }

    switch (action.type) {
      // --- Movement & Location ---
      case "MOVE":
        if (this.worldState.cityStates[action.targetCity]) {
          agentStatus.location = action.targetCity;
          this.log(`${agent.name} 移动到了 ${action.targetCity}。`, "medium");
        } else {
          this.log(
            `${agent.name} 试图移动到不存在的城市 ${action.targetCity}。`,
            "low"
          );
          // 提供合法城市列表给代理记忆
          const validCities = Object.keys(this.worldState.cityStates).join(
            ", "
          );
          return `移动失败：城市"${action.targetCity}"不存在。可用城市: ${validCities}`;
        }
        break;

      // --- Social & Diplomacy ---
      case "INSPECT":
        const inspectedAgent = this.getAgentStatus(action.targetId);
        if (inspectedAgent) {
          // Exclude sensitive or overly complex information
          const {
            allies,
            relationshipWithOthers,
            respectForChallengers,
            ...publicInfo
          } = inspectedAgent as any;
          this.log(`${agent.name} 仔细观察了 ${action.targetId}。`, "medium");
          return JSON.stringify(publicInfo, null, 2);
        } else {
          this.log(
            `${agent.name} 试图观察不存在的目标 ${action.targetId}。`,
            "low"
          );
          return `${action.targetId} 不存在。`;
        }
      case "CHAT":
        // 使用智能名字匹配
        const targetExists =
          this.getAgentStatus(action.targetId) ||
          this.worldState.goldenHeirs[action.targetId] ||
          this.worldState.titans[action.targetId] ||
          this.worldState.npcs[action.targetId];
        if (targetExists) {
          this.comms.sendMessage(agent.id, action.targetId, action.content);
          this.log(
            `${agent.name} 对 ${action.targetId} 说: "${action.content}"`,
            "medium",
            ["chat_action"]
          );
        } else {
          this.log(
            `${agent.name} 试图对不存在的目标 ${action.targetId} 说话。`,
            "low"
          );
          return `对话失败：${action.targetId} 不存在。`;
        }
        break;
      case "NEGOTIATE":
        this.log(
          `${agent.name} 尝试与 ${action.targetId} 谈判: "${action.proposal}"`
        );
        break;
      case "FORM_ALLIANCE":
        const targetStatus = this.getAgentStatus(action.targetId);
        if (targetStatus) {
          agentStatus.allies.push(action.targetId);
          targetStatus.allies.push(agent.id);
          this.log(`${agent.name} 与 ${action.targetId} 结成了同盟。`);
        } else {
          this.log(
            `${agent.name} 与不存在的代理 ${action.targetId} 结盟失败。`
          );
        }
        break;

      // --- Combat & Defense ---
      case "ATTACK":
        const targetAgent = this.getAgentStatus(action.targetId);
        if (targetAgent) {
          // Calculate damage based on attacker's power vs defender's current HP
          const damage = Math.min(action.power, targetAgent.hp);
          targetAgent.hp -= damage;

          this.log(
            `${agent.name} 攻击了 ${action.targetId}, 造成 ${damage} 点伤害。目标剩余HP: ${targetAgent.hp}。`
          );

          if (targetAgent.hp <= 0) {
            this.log(`${action.targetId} 被击败了!`, "high");
            // In a full implementation, you might remove the agent from the world or mark them as dead
          }

          // Attacker takes minor damage from combat
          agentStatus.hp -= Math.floor(damage * 0.1);
          if (agentStatus.hp < 0) agentStatus.hp = 0;
        } else {
          this.log(`${agent.name} 无法攻击不存在的目标 ${action.targetId}。`);
        }
        break;
      case "BUILD_DEFENSE":
        const target_city = this.worldState.cityStates[action.cityId];
        if (target_city && agentStatus.location === action.cityId) {
          if (action.defenseType === "WALL") target_city.defenses.walls++;
          if (action.defenseType === "WATCHTOWER")
            target_city.defenses.watchtowers++;
          this.log(
            `${agent.name} 在 ${action.cityId} 建立了一座 ${action.defenseType}。该城防御变为: 城墙 ${target_city.defenses.walls}, 瞭望塔 ${target_city.defenses.watchtowers}。`
          );
        } else {
          this.log(
            `${agent.name} 在 ${action.cityId} 建造失败，原因可能是不在该地或城市不存在。`
          );
        }
        break;

      // --- Resource & Economy ---
      case "FORAGE":
        // Forage gives a small random amount of FOOD
        const forageAmount = Math.floor(Math.random() * 5) + 1; // 1-5 food
        if (!agentStatus.inventory["food"]) agentStatus.inventory["food"] = 0;
        agentStatus.inventory["food"] += forageAmount;
        this.log(
          `${agent.name} 四处搜寻，找到了 ${forageAmount} 单位的食物。食物总量: ${agentStatus.inventory["food"]}。`
        );
        break;
      case "GATHER_RESOURCES":
        // 资源映射到具体的数字字段
        const resourceMap = {
          WOOD: "materials",
          STONE: "materials",
          MANA_CRYSTAL: "mana",
          FOOD: "food",
          materials: "materials",
        } as const;

        const targetResource =
          resourceMap[action.resource as keyof typeof resourceMap] ||
          "materials";

        // 查找有该资源的城市
        let targetCity = null;
        let maxResource = 0;

        // 首先检查当前城市
        if (agentStatus.location && this.worldState.cityStates[agentStatus.location]) {
          const currentCity = this.worldState.cityStates[agentStatus.location];
          const currentAmount = currentCity.resources[targetResource] || 0;
          if (currentAmount > 0) {
            targetCity = currentCity;
            maxResource = currentAmount;
          }
        }

        // 如果当前城市没有资源，寻找其他有资源的城市
        if (!targetCity) {
          for (const [cityId, city] of Object.entries(this.worldState.cityStates)) {
            const amount = city.resources[targetResource] || 0;
            if (amount > maxResource) {
              targetCity = city;
              maxResource = amount;
            }
          }
        }

        // 如果找到了有资源的城市
        if (targetCity && maxResource > 0) {
          // 如果不在目标城市，自动移动
          if (agentStatus.location !== targetCity.name) {
            agentStatus.location = targetCity.name;
            this.log(`${agent.name} 移动到 ${targetCity.name} 收集资源`, 'low');
          }

          // 执行收集
          const gatherAmount = Math.min(10, maxResource);
          targetCity.resources[targetResource] -= gatherAmount;

          const resourceKey = action.resource.toLowerCase();
          if (!agentStatus.inventory[resourceKey])
            agentStatus.inventory[resourceKey] = 0;
          agentStatus.inventory[resourceKey] += gatherAmount;

          this.log(
            `${agent.name} 从 ${targetCity.name} 收集了 ${gatherAmount} 单位的 ${action.resource}。城市剩余 ${targetCity.resources[targetResource]}。`,
            "medium"
          );
        } else {
          // 如果没有任何城市有该资源，给予少量随机资源
          const fallbackAmount = Math.floor(Math.random() * 3) + 1;
          const resourceKey = action.resource.toLowerCase();
          if (!agentStatus.inventory[resourceKey])
            agentStatus.inventory[resourceKey] = 0;
          agentStatus.inventory[resourceKey] += fallbackAmount;

          this.log(
            `${agent.name} 在野外找到了 ${fallbackAmount} 单位的 ${action.resource}。`,
            "low"
          );
        }
        break;
      case "CRAFT_ITEM":
        // Enhanced crafting system with recipe lookup
        const recipe = getRecipe(action.itemName);
        if (!recipe) {
          this.log(`${agent.name} 尝试制作未知的物品: ${action.itemName}。`);
          break;
        }

        // Check if agent has required materials (use recipe materials if action materials not provided)
        const requiredMaterials =
          Object.keys(action.materials).length > 0
            ? action.materials
            : recipe.materials;
        const hasAllMaterials = Object.entries(requiredMaterials).every(
          ([material, required]) =>
            (agentStatus.inventory[material] || 0) >= required
        );

        if (hasAllMaterials) {
          // Consume materials
          Object.entries(requiredMaterials).forEach(([material, required]) => {
            agentStatus.inventory[material] =
              (agentStatus.inventory[material] || 0) - required;
          });

          // Add crafted item(s)
          const outputItem = recipe.output.item;
          const outputQuantity = recipe.output.quantity;

          if (!agentStatus.inventory[outputItem])
            agentStatus.inventory[outputItem] = 0;
          agentStatus.inventory[outputItem] += outputQuantity;

          this.log(
            `${agent.name} 成功制作了 ${outputQuantity}x ${recipe.name}。`
          );
        } else {
          const missingMaterials = Object.entries(requiredMaterials)
            .filter(
              ([material, required]) =>
                (agentStatus.inventory[material] || 0) < required
            )
            .map(([material, required]) => `${material}(需要${required})`)
            .join(", ");
          this.log(
            `${agent.name} 因缺少材料而无法制作 ${recipe.name}。缺少: ${missingMaterials}。`
          );
        }
        break;

      // --- Trade & Gift System ---
      case "TRADE":
        const tradeTarget = this.getAgentStatus(action.targetId);
        if (!tradeTarget) {
          this.log(
            `${agent.name} 试图与不存在的目标 ${action.targetId} 交易。`,
            "low"
          );
          break;
        }

        // 检查交易双方是否在同一城市
        if (agentStatus.location !== tradeTarget.location) {
          this.log(
            `${agent.name} 无法与 ${action.targetId} 交易 - 不在同一城市。`,
            "low"
          );
          break;
        }

        // 检查交易参数是否有效
        if (!action.offer || !action.request) {
          this.log(`${agent.name} 交易失败 - 交易参数无效。`, "low");
          break;
        }

        // 检查发起者是否有足够的物品
        const hasOfferItems = Object.entries(action.offer).every(
          ([item, amount]) => (agentStatus.inventory[item] || 0) >= amount
        );

        if (!hasOfferItems) {
          this.log(`${agent.name} 交易失败 - 没有足够的物品进行交易。`, "low");
          break;
        }

        // 检查目标是否有足够的物品
        const hasRequestItems = Object.entries(action.request).every(
          ([item, amount]) => (tradeTarget.inventory[item] || 0) >= amount
        );

        if (!hasRequestItems) {
          this.log(
            `${agent.name} 与 ${action.targetId} 交易失败 - 对方没有足够的物品。`,
            "low"
          );
          break;
        }

        // 执行交易
        Object.entries(action.offer).forEach(([item, amount]) => {
          agentStatus.inventory[item] =
            (agentStatus.inventory[item] || 0) - amount;
          tradeTarget.inventory[item] =
            (tradeTarget.inventory[item] || 0) + amount;
        });

        Object.entries(action.request).forEach(([item, amount]) => {
          tradeTarget.inventory[item] =
            (tradeTarget.inventory[item] || 0) - amount;
          agentStatus.inventory[item] =
            (agentStatus.inventory[item] || 0) + amount;
        });

        const offerStr = Object.entries(action.offer)
          .map(([item, amount]) => `${amount}x ${item}`)
          .join(", ");
        const requestStr = Object.entries(action.request)
          .map(([item, amount]) => `${amount}x ${item}`)
          .join(", ");
        const message = action.message ? ` - "${action.message}"` : "";

        this.log(
          `${agent.name} 与 ${action.targetId} 成功交易: 用 ${offerStr} 换取了 ${requestStr}${message}`,
          "medium"
        );
        break;

      case "GIFT":
        const giftTarget = this.getAgentStatus(action.targetId);
        if (!giftTarget) {
          this.log(
            `${agent.name} 试图向不存在的目标 ${action.targetId} 赠送物品。`,
            "low"
          );
          break;
        }

        // 检查是否在同一城市
        if (agentStatus.location !== giftTarget.location) {
          this.log(
            `${agent.name} 无法向 ${action.targetId} 赠送物品 - 不在同一城市。`,
            "low"
          );
          break;
        }

        // 检查赠送参数是否有效
        if (!action.items || !action.resources) {
          this.log(`${agent.name} 赠送失败 - 赠送参数无效。`, "low");
          break;
        }

        // 检查是否有足够的物品和资源
        const hasGiftItems = action.items.every(
          (item) => (agentStatus.inventory[item] || 0) > 0
        );
        const hasGiftResources = Object.entries(action.resources).every(
          ([resource, amount]) =>
            (agentStatus.inventory[resource] || 0) >= amount
        );

        if (!hasGiftItems || !hasGiftResources) {
          this.log(`${agent.name} 赠送失败 - 没有足够的物品或资源。`, "low");
          break;
        }

        // 执行赠送
        action.items.forEach((item) => {
          if (agentStatus.inventory[item] > 0) {
            agentStatus.inventory[item]--;
            giftTarget.inventory[item] = (giftTarget.inventory[item] || 0) + 1;
          }
        });

        Object.entries(action.resources).forEach(([resource, amount]) => {
          agentStatus.inventory[resource] =
            (agentStatus.inventory[resource] || 0) - amount;
          giftTarget.inventory[resource] =
            (giftTarget.inventory[resource] || 0) + amount;
        });

        const itemsStr = action.items.length > 0 ? action.items.join(", ") : "";
        const resourcesStr = Object.entries(action.resources)
          .map(([resource, amount]) => `${amount}x ${resource}`)
          .join(", ");
        const giftMessage = action.message ? ` - "${action.message}"` : "";

        this.log(
          `${agent.name} 向 ${action.targetId} 赠送了 ${itemsStr} ${resourcesStr}${giftMessage}`,
          "medium"
        );
        break;

      // --- World & Self ---
      case "CLEANSE_CORRUPTION":
        const corruptedArea =
          this.worldState.darkTide.corruptedAreas[action.areaId];
        const currentCorruption = corruptedArea
          ? corruptedArea.corruptionLevel
          : 0;
        if (currentCorruption > 0) {
          // Calculate cleansing effectiveness based on action power vs corruption
          const cleansingEffect = Math.min(
            action.power / 100,
            currentCorruption
          ); // Scale based on power

          if (corruptedArea) {
            corruptedArea.corruptionLevel = Math.max(
              0,
              corruptedArea.corruptionLevel - cleansingEffect
            );
            this.log(
              `${agent.name} 净化了 ${
                action.areaId
              } 的黑潮。黑潮度从 ${currentCorruption.toFixed(
                2
              )} 降至 ${corruptedArea.corruptionLevel.toFixed(2)}。`
            );
          }

          // Cleansing corruption costs HP
          agentStatus.hp -= Math.floor(cleansingEffect * 10);
          if (agentStatus.hp < 0) agentStatus.hp = 0;
        } else {
          this.log(`${agent.name} 在 ${action.areaId} 未发现任何黑潮。`);
        }
        break;
      case "REST":
        agentStatus.hp += 10;
        this.log(
          `${agent.name} 正在休息以恢复生命值。当前HP: ${agentStatus.hp}。`
        );
        break;

      // --- Special & Abilities ---
      case "USE_ABILITY":
        this.log(`${agent.name} 使用了能力: ${action.abilityName}。`);
        break;

      default:
        const unhandledAction = action as any;
        this.log(
          `${agent.name} 执行了未知或未处理的动作: ${
            (unhandledAction as any).type
          }`
        );
        break;
    }
  }
}
