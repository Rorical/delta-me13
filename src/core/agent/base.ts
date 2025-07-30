import type { OmphalosWorldState } from '../omphalosWorldState';
import { CombinedMemory } from '../memory/combined';
import OpenAI from 'openai';

export type Action =
  // --- Movement & Location ---
  | { type: 'MOVE'; targetCity: string }

  // --- Social & Diplomacy ---
  | { type: 'INSPECT'; targetId: string }
  | { type: 'CHAT'; targetId: string; content: string }
  | { type: 'NEGOTIATE'; targetId: string; proposal: string }
  | { type: 'FORM_ALLIANCE'; targetId: string }

  // --- Combat & Defense ---
  | { type: 'ATTACK'; targetId: string; power: number }
  | { type: 'BUILD_DEFENSE'; cityId: string; defenseType: 'WALL' | 'WATCHTOWER' }

  // --- Resource & Economy ---
  | { type: 'FORAGE' } // General-purpose low-yield gathering
  | { type: 'GATHER_RESOURCES'; resource: 'WOOD' | 'STONE' | 'MANA_CRYSTAL' }
  | { type: 'CRAFT_ITEM'; itemName: string; materials: Record<string, number> }
  | { type: 'TRADE'; targetId: string; offer: Record<string, number>; request: Record<string, number>; message?: string }
  | { type: 'GIFT'; targetId: string; items: string[]; resources: Record<string, number>; message?: string }

  // --- World & Self ---
  | { type: 'CLEANSE_CORRUPTION'; areaId: string; power: number }
  | { type: 'REST' }
  
  // --- Special & Abilities ---
  | { type: 'USE_ABILITY'; abilityName: string; targetId?: string; payload?: any }
  | { type: 'SPECIAL'; name: string; payload: any }; // Legacy/flexible special action

export interface AICallLog {
  timestamp: number;
  agentId: string;
  agentName: string;
  agentType: string;
  model: string;
  prompt: string;
  response: string;
  duration: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export abstract class BaseAgent {
  id: string;
  name: string;
  memory: CombinedMemory;
  client: OpenAI;
  model: string;
  temperature: number;
  private logCallback?: (log: AICallLog) => void;

  // 检查是否为o1系列模型
  protected isO1Model(): boolean {
    return this.model.toLowerCase().includes('o1') || this.model.toLowerCase().includes('o4');
  }

  // 设置日志回调
  setLogCallback(callback: (log: AICallLog) => void) {
    this.logCallback = callback;
  }

  // 记录AI调用日志
  protected logAICall(prompt: string, response: string, duration: number, tokenUsage?: any) {
    if (this.logCallback) {
      const log: AICallLog = {
        timestamp: Date.now(),
        agentId: this.id,
        agentName: this.name,
        agentType: this.constructor.name.replace('Agent', ''),
        model: this.model,
        prompt: prompt.length > 200 ? prompt.substring(0, 200) + '...' : prompt,
        response: response.length > 200 ? response.substring(0, 200) + '...' : response,
        duration,
        tokenUsage
      };
      this.logCallback(log);
    }
  }

  constructor(id: string, name: string, client: OpenAI, config: { model?: string; temperature?: number, memory_max_tokens?: number } = {}) {
    if (!client) {
      throw new Error(`Agent ${name} requires valid OpenAI client instance`);
    }
    this.id = id;
    this.name = name;
    this.client = client;
    this.model = config.model ?? 'gpt-4o';
    this.temperature = config.temperature ?? 0.7;
    this.memory = new CombinedMemory(client, {
      model: this.model,
      temperature: this.temperature,
      stm_max_tokens: config.memory_max_tokens || 8192
    });
  }

  abstract decide(world: Readonly<OmphalosWorldState>, context?: string): Promise<Action[]>;
}
