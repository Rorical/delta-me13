import { OmphalosWorldState } from '../omphalosWorldState';
import { Action } from './base';

// 行为模式类型
export type BehaviorPattern = 
  | 'aggressive'      // 攻击性
  | 'defensive'       // 防御性
  | 'diplomatic'      // 外交性
  | 'opportunistic'   // 机会主义
  | 'cautious'        // 谨慎
  | 'reckless'        // 鲁莽
  | 'strategic'       // 战略性
  | 'chaotic'         // 混乱
  | 'orderly'         // 有序
  | 'adaptive';       // 适应性

// 情绪状态
export type EmotionalState = 
  | 'calm'           // 平静
  | 'excited'        // 兴奋
  | 'fearful'        // 恐惧
  | 'angry'          // 愤怒
  | 'hopeful'        // 希望
  | 'desperate'      // 绝望
  | 'confident'      // 自信
  | 'confused'       // 困惑
  | 'determined'     // 坚定
  | 'indifferent';   // 冷漠

// 个性特征
export interface PersonalityTrait {
  openness: number;        // 开放性 (0-100)
  conscientiousness: number; // 尽责性 (0-100)
  extraversion: number;    // 外向性 (0-100)
  agreeableness: number;   // 宜人性 (0-100)
  neuroticism: number;     // 神经质 (0-100)
}

// 动态行为状态
export interface DynamicBehaviorState {
  currentPattern: BehaviorPattern;
  emotionalState: EmotionalState;
  personality: PersonalityTrait;
  stressLevel: number;     // 压力水平 (0-100)
  confidence: number;      // 自信度 (0-100)
  riskTolerance: number;   // 风险承受度 (0-100)
  lastActionTime: number;  // 上次行动时间
  consecutiveFailures: number; // 连续失败次数
  recentSuccesses: number; // 最近成功次数
  environmentalInfluence: number; // 环境影响因子
}

export class BehaviorEnhancer {
  // Pattern weights for behavior adjustment (currently unused but kept for future implementation)
  // private static readonly PATTERN_WEIGHTS = {
  //   aggressive: { attack: 0.8, chat: 0.1, negotiate: 0.1 },
  //   defensive: { build_defense: 0.6, rest: 0.3, move: 0.1 },
  //   diplomatic: { chat: 0.5, negotiate: 0.3, form_alliance: 0.2 },
  //   opportunistic: { gather_resources: 0.4, trade: 0.3, attack: 0.3 },
  //   cautious: { inspect: 0.4, rest: 0.3, move: 0.3 },
  //   reckless: { attack: 0.7, use_ability: 0.3 },
  //   strategic: { form_alliance: 0.4, negotiate: 0.3, build_defense: 0.3 },
  //   chaotic: { special: 0.5, attack: 0.3, move: 0.2 },
  //   orderly: { build_defense: 0.4, gather_resources: 0.3, rest: 0.3 },
  //   adaptive: { chat: 0.3, negotiate: 0.3, gather_resources: 0.2, attack: 0.2 }
  // };

  private static readonly EMOTIONAL_INFLUENCE = {
    calm: { riskTolerance: 0, stressLevel: -10 },
    excited: { riskTolerance: 20, stressLevel: 10 },
    fearful: { riskTolerance: -30, stressLevel: 30 },
    angry: { riskTolerance: 40, stressLevel: 20 },
    hopeful: { riskTolerance: 10, stressLevel: -5 },
    desperate: { riskTolerance: 50, stressLevel: 40 },
    confident: { riskTolerance: 15, stressLevel: -15 },
    confused: { riskTolerance: -10, stressLevel: 15 },
    determined: { riskTolerance: 25, stressLevel: 5 },
    indifferent: { riskTolerance: 0, stressLevel: 0 }
  };

  // 根据世界状态和代理状态更新行为模式
  static updateBehaviorState(
    agentId: string,
    worldState: OmphalosWorldState,
    currentState: DynamicBehaviorState
  ): DynamicBehaviorState {
    const newState = { ...currentState };
    // const currentTime = worldState.day; // Unused variable

    // 更新情绪状态
    newState.emotionalState = this.calculateEmotionalState(agentId, worldState, currentState);
    
    // 更新行为模式
    newState.currentPattern = this.calculateBehaviorPattern(agentId, worldState, currentState);
    
    // 更新压力水平
    newState.stressLevel = this.calculateStressLevel(agentId, worldState, currentState);
    
    // 更新自信度
    newState.confidence = this.calculateConfidence(agentId, worldState, currentState);
    
    // 更新风险承受度
    newState.riskTolerance = this.calculateRiskTolerance(agentId, worldState, currentState);
    
    // 更新环境影响因子
    newState.environmentalInfluence = this.calculateEnvironmentalInfluence(agentId, worldState, currentState);

    return newState;
  }

  // 计算情绪状态
  private static calculateEmotionalState(
    agentId: string,
    worldState: OmphalosWorldState,
    state: DynamicBehaviorState
  ): EmotionalState {
    const agent = this.getAgentStatus(agentId, worldState);
    if (!agent) return 'calm';

    const hp = agent.hp / agent.maxHp;
    const stress = state.stressLevel;
    const recentFailures = state.consecutiveFailures;
    const recentSuccesses = state.recentSuccesses;

    if (hp < 0.3) {
      if (stress > 70) return 'desperate';
      if (recentFailures > 3) return 'fearful';
      return 'calm';
    }

    if (hp > 0.8 && recentSuccesses > 2) {
      if (stress < 30) return 'confident';
      return 'excited';
    }

    if (stress > 60) {
      if (recentFailures > 2) return 'angry';
      return 'confused';
    }

    if (recentSuccesses > 1) return 'hopeful';
    if (recentFailures > 1) return 'fearful';

    return 'calm';
  }

  // 计算行为模式
  private static calculateBehaviorPattern(
    agentId: string,
    worldState: OmphalosWorldState,
    state: DynamicBehaviorState
  ): BehaviorPattern {
    const agent = this.getAgentStatus(agentId, worldState);
    if (!agent) return 'adaptive';

    const hp = agent.hp / agent.maxHp;
    const stress = state.stressLevel;
    const confidence = state.confidence;
    const riskTolerance = state.riskTolerance;

    // 低血量时倾向于防御
    if (hp < 0.3) {
      if (stress > 70) return 'reckless';
      return 'defensive';
    }

    // 高压力时倾向于攻击性
    if (stress > 70) {
      if (confidence > 50) return 'aggressive';
      return 'reckless';
    }

    // 高自信时倾向于战略性
    if (confidence > 70) {
      if (riskTolerance > 50) return 'aggressive';
      return 'strategic';
    }

    // 低自信时倾向于谨慎
    if (confidence < 30) {
      return 'cautious';
    }

    // 根据个性特征决定
    const personality = state.personality;
    if (personality.extraversion > 70) return 'diplomatic';
    if (personality.conscientiousness > 70) return 'orderly';
    if (personality.neuroticism > 70) return 'chaotic';

    return 'adaptive';
  }

  // 计算压力水平
  private static calculateStressLevel(
    agentId: string,
    worldState: OmphalosWorldState,
    state: DynamicBehaviorState
  ): number {
    const agent = this.getAgentStatus(agentId, worldState);
    if (!agent) return 0;

    let stress = state.stressLevel;

    // 血量影响
    const hp = agent.hp / agent.maxHp;
    if (hp < 0.5) stress += 20;
    if (hp < 0.2) stress += 30;

    // 连续失败影响
    stress += state.consecutiveFailures * 10;

    // 环境影响
    stress += state.environmentalInfluence;

    // 黑潮影响
    const corruptionLevel = worldState.darkTide.globalCorruption;
    stress += corruptionLevel * 0.3;

    return Math.max(0, Math.min(100, stress));
  }

  // 计算自信度
  private static calculateConfidence(
    agentId: string,
    worldState: OmphalosWorldState,
    state: DynamicBehaviorState
  ): number {
    let confidence = state.confidence;

    // 最近成功增加自信
    confidence += state.recentSuccesses * 15;

    // 连续失败降低自信
    confidence -= state.consecutiveFailures * 10;

    // 血量影响
    const agent = this.getAgentStatus(agentId, worldState);
    if (agent) {
      const hp = agent.hp / agent.maxHp;
      if (hp > 0.8) confidence += 20;
      if (hp < 0.3) confidence -= 30;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  // 计算风险承受度
  private static calculateRiskTolerance(
    _agentId: string,
    _worldState: OmphalosWorldState,
    state: DynamicBehaviorState
  ): number {
    let riskTolerance = state.riskTolerance;

    // 情绪影响
    const emotionalInfluence = this.EMOTIONAL_INFLUENCE[state.emotionalState];
    riskTolerance += emotionalInfluence.riskTolerance;

    // 个性影响
    const personality = state.personality;
    riskTolerance += (personality.extraversion - 50) * 0.3;
    riskTolerance -= (personality.neuroticism - 50) * 0.2;

    // 环境压力影响
    if (state.stressLevel > 70) riskTolerance += 20;

    return Math.max(0, Math.min(100, riskTolerance));
  }

  // 计算环境影响因子
  private static calculateEnvironmentalInfluence(
    _agentId: string,
    worldState: OmphalosWorldState,
    _state: DynamicBehaviorState
  ): number {
    let influence = 0;

    // 世界稳定度影响
    influence += (50 - worldState.worldStability) * 0.5;

    // 魔法浓度影响
    influence += (worldState.magicLevel - 50) * 0.3;

    // 活跃事件影响
    influence += worldState.activeEvents.length * 5;

    return influence;
  }

  // 根据行为状态调整动作
  static adjustAction(
    action: Action,
    behaviorState: DynamicBehaviorState,
    _worldState: OmphalosWorldState
  ): Action {
    const adjustedAction = { ...action };

    // 根据行为模式调整动作参数
    switch (behaviorState.currentPattern) {
      case 'aggressive':
        if (action.type === 'ATTACK') {
          (adjustedAction as any).power = Math.min(100, (action as any).power * 1.3);
        }
        break;

      case 'defensive':
        if (action.type === 'BUILD_DEFENSE') {
          // 增加防御建设效果
        }
        break;

      case 'cautious':
        if (action.type === 'MOVE') {
          // 选择更安全的城市
        }
        break;

      case 'reckless':
        if (action.type === 'ATTACK') {
          (adjustedAction as any).power = Math.min(100, (action as any).power * 1.5);
        }
        break;
    }

    // 根据情绪状态调整
    switch (behaviorState.emotionalState) {
      case 'angry':
        if (action.type === 'CHAT') {
          (adjustedAction as any).content = `[愤怒地] ${(action as any).content}`;
        }
        break;

      case 'fearful':
        if (action.type === 'MOVE') {
          // 选择更安全的路径
        }
        break;

      case 'desperate':
        if (action.type === 'ATTACK') {
          (adjustedAction as any).power = Math.min(100, (action as any).power * 2.0);
        }
        break;
    }

    return adjustedAction;
  }

  // 获取代理状态
  private static getAgentStatus(agentId: string, worldState: OmphalosWorldState) {
    return (
      worldState.goldenHeirs[agentId] ||
      worldState.titans[agentId] ||
      worldState.npcs[agentId]
    );
  }

  // 创建初始行为状态
  static createInitialBehaviorState(personality: PersonalityTrait): DynamicBehaviorState {
    return {
      currentPattern: 'adaptive',
      emotionalState: 'calm',
      personality,
      stressLevel: 20,
      confidence: 50,
      riskTolerance: 50,
      lastActionTime: 0,
      consecutiveFailures: 0,
      recentSuccesses: 0,
      environmentalInfluence: 0
    };
  }

  // 记录动作结果
  static recordActionResult(
    state: DynamicBehaviorState,
    success: boolean,
    currentTime: number
  ): DynamicBehaviorState {
    const newState = { ...state };
    newState.lastActionTime = currentTime;

    if (success) {
      newState.recentSuccesses = Math.min(5, newState.recentSuccesses + 1);
      newState.consecutiveFailures = 0;
    } else {
      newState.consecutiveFailures = Math.min(5, newState.consecutiveFailures + 1);
      newState.recentSuccesses = Math.max(0, newState.recentSuccesses - 1);
    }

    return newState;
  }
} 