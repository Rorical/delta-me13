import { BaseAgent, Action } from './base';
import { OmphalosWorldState, WorldEvent, EventEffect } from '../omphalosWorldState';
import OpenAI from 'openai';

// 世界事件类型
export type WorldEventType = 
  | 'natural_disaster'      // 自然灾害
  | 'magical_anomaly'       // 魔法异常
  | 'titan_interference'    // 泰坦干预
  | 'corruption_spread'     // 黑潮扩散
  | 'resource_discovery'    // 资源发现
  | 'ancient_awakening'     // 远古觉醒
  | 'alliance_shift'        // 联盟变化
  | 'prophecy_fulfillment'  // 预言应验
  | 'dimensional_breach'    // 维度裂隙
  | 'time_anomaly'          // 时间异常
  | 'memory_corruption'     // 记忆腐蚀
  | 'reality_shift'         // 现实转换
  | 'ember_resonance'       // 火种共鸣
  | 'fate_intervention'     // 命运干预
  | 'chaos_manifestation';  // 混沌显现

// 世界事件模板
export interface WorldEventTemplate {
  type: WorldEventType;
  name: string;
  description: string;
  severity: 'minor' | 'major' | 'world_changing';
  probability: number;  // 触发概率 (0-1)
  conditions: WorldEventCondition[];
  effects: WorldEventEffectTemplate[];
  duration: number;     // 持续时间（天）
  cooldown: number;     // 冷却时间（天）
}

// 事件触发条件
export interface WorldEventCondition {
  type: 'world_stability' | 'magic_level' | 'corruption_level' | 'ember_count' | 'time_of_day' | 'season' | 'city_state' | 'agent_presence';
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number | string;
  location?: string;
}

// 事件效果模板
export interface WorldEventEffectTemplate {
  type: 'stat_change' | 'resource_change' | 'relationship_change' | 'new_ability' | 'corruption_spread' | 'reality_shift' | 'memory_alteration' | 'magic_level' | 'fate_intervention';
  target: string | 'random' | 'all_agents' | 'all_cities' | 'specific_location';
  magnitude: number;
  description: string;
  duration?: number;
}

export class WorldAgent extends BaseAgent {
  private eventTemplates: WorldEventTemplate[] = [];
  private lastEventTimes: Record<string, number> = {};
  private worldState: OmphalosWorldState;

  constructor(id: string, name: string, client: OpenAI, worldState: OmphalosWorldState, config: { model?: string; temperature?: number } = {}) {
    super(id, name, client, config);
    this.worldState = worldState;
    this.initializeEventTemplates();
  }

  private initializeEventTemplates() {
    this.eventTemplates = [
      // 自然灾害类
      {
        type: 'natural_disaster',
        name: '魔法风暴',
        description: '一场强大的魔法风暴席卷了某个区域，影响了当地的资源和居民。',
        severity: 'major',
        probability: 0.15,
        conditions: [
          { type: 'magic_level', operator: 'gt', value: 30 }
        ],
        effects: [
          {
            type: 'resource_change',
            target: 'random',
            magnitude: -20,
            description: '风暴摧毁了部分资源'
          },
          {
            type: 'stat_change',
            target: 'random',
            magnitude: -10,
            description: '居民士气受到影响'
          }
        ],
        duration: 3,
        cooldown: 10
      },

      // 魔法异常类
      {
        type: 'magical_anomaly',
        name: '火种共鸣',
        description: '多个火种之间产生了意外的共鸣，引发了魔法异常现象。',
        severity: 'major',
        probability: 0.1,
        conditions: [
          { type: 'ember_count', operator: 'gte', value: 3 }
        ],
        effects: [
          {
            type: 'magic_level',
            target: 'all_cities',
            magnitude: 15,
            description: '魔法浓度暂时提升'
          },
          {
            type: 'new_ability',
            target: 'all_agents',
            magnitude: 1,
            description: '所有代理暂时获得火种感知能力'
          }
        ],
        duration: 5,
        cooldown: 15
      },

      // 泰坦干预类
      {
        type: 'titan_interference',
        name: '泰坦意志显现',
        description: '某个泰坦的意志在物质世界显现，影响了周围的环境和生物。',
        severity: 'world_changing',
        probability: 0.05,
        conditions: [
          { type: 'world_stability', operator: 'lt', value: 50 }
        ],
        effects: [
          {
            type: 'reality_shift',
            target: 'specific_location',
            magnitude: 25,
            description: '泰坦领域在物质世界显现'
          },
          {
            type: 'corruption_spread',
            target: 'random',
            magnitude: 10,
            description: '泰坦意志引发黑潮扩散'
          }
        ],
        duration: 7,
        cooldown: 30
      },

      // 时间异常类
      {
        type: 'time_anomaly',
        name: '时间裂隙',
        description: '时间流出现了异常，某些区域的时间流速发生了变化。',
        severity: 'major',
        probability: 0.08,
        conditions: [
          { type: 'magic_level', operator: 'gt', value: 60 }
        ],
        effects: [
          {
            type: 'reality_shift',
            target: 'random',
            magnitude: 15,
            description: '时间流速异常'
          },
          {
            type: 'memory_alteration',
            target: 'all_agents',
            magnitude: 5,
            description: '代理的记忆出现轻微混乱'
          }
        ],
        duration: 4,
        cooldown: 20
      },

      // 维度裂隙类
      {
        type: 'dimensional_breach',
        name: '维度裂隙',
        description: '现实与虚空的边界出现了裂隙，带来了未知的影响。',
        severity: 'world_changing',
        probability: 0.03,
        conditions: [
          { type: 'corruption_level', operator: 'gt', value: 70 }
        ],
        effects: [
          {
            type: 'reality_shift',
            target: 'specific_location',
            magnitude: 30,
            description: '现实结构被扭曲'
          },
          {
            type: 'corruption_spread',
            target: 'random',
            magnitude: 20,
            description: '裂隙引发大规模黑潮扩散'
          }
        ],
        duration: 10,
        cooldown: 50
      },

      // 预言应验类
      {
        type: 'prophecy_fulfillment',
        name: '古老预言',
        description: '一个古老的预言开始应验，影响了世界的走向。',
        severity: 'major',
        probability: 0.12,
        conditions: [
          { type: 'ember_count', operator: 'gte', value: 6 }
        ],
        effects: [
          {
            type: 'fate_intervention',
            target: 'all_agents',
            magnitude: 10,
            description: '命运的力量干预了代理的行动'
          },
          {
            type: 'relationship_change',
            target: 'random',
            magnitude: 15,
            description: '预言影响了代理之间的关系'
          }
        ],
        duration: 6,
        cooldown: 25
      },

      // 混沌显现类
      {
        type: 'chaos_manifestation',
        name: '混沌显现',
        description: '纯粹的混沌力量在物质世界显现，带来了不可预测的变化。',
        severity: 'world_changing',
        probability: 0.02,
        conditions: [
          { type: 'world_stability', operator: 'lt', value: 30 }
        ],
        effects: [
          {
            type: 'reality_shift',
            target: 'all_cities',
            magnitude: 20,
            description: '混沌力量扭曲了现实'
          },
          {
            type: 'memory_alteration',
            target: 'all_agents',
            magnitude: 10,
            description: '代理的记忆被混沌影响'
          }
        ],
        duration: 8,
        cooldown: 60
      }
    ];
  }

  async decide(_world: Readonly<OmphalosWorldState>, _context?: string): Promise<Action[]> {
    const currentTime = this.worldState.day;
    const actions: Action[] = [];

    // 检查并触发随机事件
    for (const template of this.eventTemplates) {
      if (this.shouldTriggerEvent(template, currentTime)) {
        const event = this.createWorldEvent(template);
        if (event) {
          this.worldState.activeEvents.push(event);
          this.lastEventTimes[template.type] = currentTime;
          
          actions.push({
            type: 'WORLD_EVENT',
            target: 'world',
            parameters: {
              eventId: event.eventId,
              eventName: event.name,
              description: event.description,
              severity: event.severity
            }
          });
        }
      }
    }

    // 处理进行中的事件
    this.processOngoingEvents();

    // 生成环境变化
    const environmentalChanges = this.generateEnvironmentalChanges();
    if (environmentalChanges.length > 0) {
      actions.push(...environmentalChanges);
    }

    return actions;
  }

  private shouldTriggerEvent(template: WorldEventTemplate, currentTime: number): boolean {
    // 检查冷却时间
    const lastTime = this.lastEventTimes[template.type] || 0;
    if (currentTime - lastTime < template.cooldown) {
      return false;
    }

    // 检查概率
    if (Math.random() > template.probability) {
      return false;
    }

    // 检查触发条件
    return this.checkEventConditions(template.conditions);
  }

  private checkEventConditions(conditions: WorldEventCondition[]): boolean {
    for (const condition of conditions) {
      let currentValue: number | string;
      
      switch (condition.type) {
        case 'world_stability':
          currentValue = this.worldState.worldStability;
          break;
        case 'magic_level':
          currentValue = this.worldState.magicLevel;
          break;
        case 'corruption_level':
          currentValue = this.worldState.darkTide.globalCorruption;
          break;
        case 'ember_count':
          currentValue = this.worldState.emberSystem.collectedEmbers;
          break;
        case 'time_of_day':
          currentValue = this.worldState.timeOfDay;
          break;
        case 'season':
          currentValue = this.worldState.season;
          break;
        default:
          return false;
      }

      if (!this.evaluateCondition(currentValue, condition.operator, condition.value)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(currentValue: number | string, operator: string, targetValue: number | string): boolean {
    switch (operator) {
      case 'gt':
        return currentValue > targetValue;
      case 'lt':
        return currentValue < targetValue;
      case 'eq':
        return currentValue === targetValue;
      case 'gte':
        return currentValue >= targetValue;
      case 'lte':
        return currentValue <= targetValue;
      default:
        return false;
    }
  }

  private createWorldEvent(template: WorldEventTemplate): WorldEvent | null {
    const eventId = `${template.type}_${Date.now()}`;
    const location = this.selectEventLocation(template);
    
    const effects: EventEffect[] = template.effects.map(effect => ({
      type: effect.type as any,
      target: this.resolveEffectTarget(effect.target, location),
      magnitude: effect.magnitude,
      description: effect.description
    }));

    return {
      eventId,
      name: template.name,
      type: template.type as any,
      severity: template.severity,
      description: template.description,
      participants: this.selectEventParticipants(template),
      location,
      startTime: this.worldState.day,
      duration: template.duration,
      effects,
      isOngoing: true
    };
  }

  private selectEventLocation(template: WorldEventTemplate): string {
    const cities = Object.keys(this.worldState.cityStates);
    if (cities.length === 0) return 'unknown';
    
    // 根据事件类型选择合适的位置
    switch (template.type) {
      case 'corruption_spread':
        // 选择黑潮影响较重的城市
        return cities.find(city => 
          this.worldState.cityStates[city].darkTideInfluence > 50
        ) || cities[Math.floor(Math.random() * cities.length)];
      
      case 'magical_anomaly':
        // 选择魔法浓度较高的城市
        return cities.find(city => 
          this.worldState.cityStates[city].resources.mana > 200
        ) || cities[Math.floor(Math.random() * cities.length)];
      
      default:
        return cities[Math.floor(Math.random() * cities.length)];
    }
  }

  private resolveEffectTarget(target: string, location: string): string {
    switch (target) {
      case 'random':
        const cities = Object.keys(this.worldState.cityStates);
        return cities[Math.floor(Math.random() * cities.length)];
      case 'all_cities':
        return 'all_cities';
      case 'all_agents':
        return 'all_agents';
      case 'specific_location':
        return location;
      default:
        return target;
    }
  }

  private selectEventParticipants(template: WorldEventTemplate): string[] {
    const participants: string[] = [];
    
    // 根据事件类型选择参与者
    switch (template.type) {
      case 'titan_interference':
        participants.push(...Object.keys(this.worldState.titans));
        break;
      case 'ember_resonance':
        participants.push(...Object.keys(this.worldState.goldenHeirs));
        break;
      case 'prophecy_fulfillment':
        participants.push(...Object.keys(this.worldState.goldenHeirs));
        participants.push(...Object.keys(this.worldState.titans));
        break;
    }
    
    return participants;
  }

  private processOngoingEvents() {
    const currentTime = this.worldState.day;
    
    for (let i = this.worldState.activeEvents.length - 1; i >= 0; i--) {
      const event = this.worldState.activeEvents[i];
      
      if (currentTime - event.startTime >= event.duration) {
        // 事件结束
        event.isOngoing = false;
        this.worldState.completedQuests.push({
          questId: event.eventId,
          name: event.name,
          type: 'ember_collection', // 临时类型
          difficulty: 'moderate',
          description: event.description,
          objectives: [],
          rewards: [],
          assignedTo: event.participants,
          status: 'completed'
        });
        
        // 移除已完成的事件
        this.worldState.activeEvents.splice(i, 1);
      }
    }
  }

  private generateEnvironmentalChanges(): Action[] {
    const actions: Action[] = [];
    
    // 随机环境变化
    if (Math.random() < 0.3) {
      // 魔法浓度变化
      const magicChange = (Math.random() - 0.5) * 5;
      this.worldState.magicLevel = Math.max(0, Math.min(100, this.worldState.magicLevel + magicChange));
      
      actions.push({
        type: 'ENVIRONMENT_CHANGE',
        target: 'world',
        parameters: {
          changeType: 'magic_level',
          magnitude: magicChange,
          description: `魔法浓度${magicChange > 0 ? '上升' : '下降'}了${Math.abs(magicChange).toFixed(1)}%`
        }
      });
    }
    
    if (Math.random() < 0.2) {
      // 世界稳定度变化
      const stabilityChange = (Math.random() - 0.5) * 3;
      this.worldState.worldStability = Math.max(0, Math.min(100, this.worldState.worldStability + stabilityChange));
      
      actions.push({
        type: 'ENVIRONMENT_CHANGE',
        target: 'world',
        parameters: {
          changeType: 'world_stability',
          magnitude: stabilityChange,
          description: `世界稳定度${stabilityChange > 0 ? '提升' : '下降'}了${Math.abs(stabilityChange).toFixed(1)}%`
        }
      });
    }
    
    return actions;
  }

  // 获取当前活跃事件
  getActiveEvents(): WorldEvent[] {
    return this.worldState.activeEvents.filter(event => event.isOngoing);
  }

  // 获取事件模板
  getEventTemplates(): WorldEventTemplate[] {
    return this.eventTemplates;
  }
} 