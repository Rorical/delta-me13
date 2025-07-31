import { WorldAgent } from '../agent/worldAgent';
import { BehaviorEnhancer, PersonalityTrait } from '../agent/behaviorEnhancer';
import { OmphalosWorldState } from '../omphalosWorldState';
import OpenAI from 'openai';

// 世界代理配置
export interface WorldAgentConfig {
  enabled: boolean;
  eventFrequency: number;  // 事件触发频率 (0-1)
  maxActiveEvents: number; // 最大同时活跃事件数
  environmentalChangeRate: number; // 环境变化率
  behaviorEnhancement: boolean; // 是否启用行为增强
}

// 默认配置
export const DEFAULT_WORLD_AGENT_CONFIG: WorldAgentConfig = {
  enabled: true,
  eventFrequency: 0.3,
  maxActiveEvents: 3,
  environmentalChangeRate: 0.2,
  behaviorEnhancement: true
};

// 个性特征配置
export const PERSONALITY_TEMPLATES: Record<string, PersonalityTrait> = {
  // 黄金裔个性
  '白厄': {
    openness: 60,
    conscientiousness: 40,
    extraversion: 30,
    agreeableness: 20,
    neuroticism: 80
  },
  '昔涟': {
    openness: 80,
    conscientiousness: 70,
    extraversion: 50,
    agreeableness: 60,
    neuroticism: 30
  },
  '赛飞儿': {
    openness: 70,
    conscientiousness: 50,
    extraversion: 80,
    agreeableness: 40,
    neuroticism: 60
  },
  '遐蝶': {
    openness: 90,
    conscientiousness: 60,
    extraversion: 40,
    agreeableness: 70,
    neuroticism: 20
  },
  '思辨': {
    openness: 85,
    conscientiousness: 80,
    extraversion: 30,
    agreeableness: 50,
    neuroticism: 40
  },

  // NPC个性
  'merchant': {
    openness: 60,
    conscientiousness: 70,
    extraversion: 80,
    agreeableness: 60,
    neuroticism: 40
  },
  'guard': {
    openness: 40,
    conscientiousness: 80,
    extraversion: 50,
    agreeableness: 70,
    neuroticism: 30
  },
  'scholar': {
    openness: 90,
    conscientiousness: 60,
    extraversion: 30,
    agreeableness: 50,
    neuroticism: 50
  },
  'craftsman': {
    openness: 50,
    conscientiousness: 85,
    extraversion: 40,
    agreeableness: 60,
    neuroticism: 35
  },

  // 泰坦个性
  'titan': {
    openness: 40,
    conscientiousness: 90,
    extraversion: 20,
    agreeableness: 30,
    neuroticism: 60
  }
};

// 世界代理管理器
export class WorldAgentManager {
  private worldAgent: WorldAgent;
  private config: WorldAgentConfig;
  private behaviorStates: Map<string, any> = new Map();

  constructor(
    worldState: OmphalosWorldState,
    openaiClient: OpenAI,
    config: WorldAgentConfig = DEFAULT_WORLD_AGENT_CONFIG
  ) {
    this.config = config;
    this.worldAgent = new WorldAgent('world_agent', '世界意志', openaiClient, worldState);
  }

  // 初始化代理行为状态
  initializeAgentBehaviors(agentIds: string[], agentTypes: Record<string, string>) {
    agentIds.forEach(agentId => {
      const agentType = agentTypes[agentId] || 'adaptive';
      const personality = PERSONALITY_TEMPLATES[agentType] || PERSONALITY_TEMPLATES['merchant'];
      const behaviorState = BehaviorEnhancer.createInitialBehaviorState(personality);
      this.behaviorStates.set(agentId, behaviorState);
    });
  }

  // 更新代理行为状态
  updateAgentBehavior(agentId: string, worldState: OmphalosWorldState) {
    const currentState = this.behaviorStates.get(agentId);
    if (currentState) {
      const newState = BehaviorEnhancer.updateBehaviorState(agentId, worldState, currentState);
      this.behaviorStates.set(agentId, newState);
      return newState;
    }
    return null;
  }

  // 调整代理动作
  adjustAgentAction(agentId: string, action: any, worldState: OmphalosWorldState) {
    const behaviorState = this.behaviorStates.get(agentId);
    if (behaviorState && this.config.behaviorEnhancement) {
      return BehaviorEnhancer.adjustAction(action, behaviorState, worldState);
    }
    return action;
  }

  // 记录动作结果
  recordActionResult(agentId: string, success: boolean, currentTime: number) {
    const currentState = this.behaviorStates.get(agentId);
    if (currentState) {
      const newState = BehaviorEnhancer.recordActionResult(currentState, success, currentTime);
      this.behaviorStates.set(agentId, newState);
    }
  }

  // 获取世界代理
  getWorldAgent(): WorldAgent {
    return this.worldAgent;
  }

  // 获取代理行为状态
  getAgentBehaviorState(agentId: string) {
    return this.behaviorStates.get(agentId);
  }

  // 获取所有行为状态
  getAllBehaviorStates() {
    return Object.fromEntries(this.behaviorStates);
  }

  // 获取配置
  getConfig(): WorldAgentConfig {
    return this.config;
  }

  // 更新配置
  updateConfig(newConfig: Partial<WorldAgentConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// 使用示例
export function createWorldAgentManager(
  worldState: OmphalosWorldState,
  openaiClient: OpenAI,
  config?: WorldAgentConfig
): WorldAgentManager {
  const manager = new WorldAgentManager(worldState, openaiClient, config);
  
  // 初始化所有代理的行为状态
  const allAgentIds = [
    ...Object.keys(worldState.goldenHeirs),
    ...Object.keys(worldState.titans),
    ...Object.keys(worldState.npcs)
  ];

  const agentTypes: Record<string, string> = {};
  
  // 设置黄金裔类型
  Object.keys(worldState.goldenHeirs).forEach(id => {
    const heir = worldState.goldenHeirs[id];
    agentTypes[id] = heir.name;
  });

  // 设置泰坦类型
  Object.keys(worldState.titans).forEach(id => {
    agentTypes[id] = 'titan';
  });

  // 设置NPC类型
  Object.keys(worldState.npcs).forEach(id => {
    const npc = worldState.npcs[id];
    agentTypes[id] = npc.role.toLowerCase();
  });

  manager.initializeAgentBehaviors(allAgentIds, agentTypes);
  
  return manager;
} 