// 翁法罗斯世界状态 —— 单一数据源
// 所有代理（黄金裔 / 泰坦 / NPC）都统一存放在 `agents` 中，城邦之间以图结构相连。

export type AgentKind = 'heir' | 'titan' | 'npc';
export type AgentCondition = 'active' | 'down' | 'fallen';
export type TitanDisposition = 'benevolent' | 'neutral' | 'corrupted';
export type ResourceKey = 'food' | 'materials' | 'mana';

export interface CityState {
  id: string;
  name: string;
  type: string;
  description: string;
  population: number;
  prosperity: number;               // 0-100
  walls: number;
  watchtowers: number;
  resources: Record<ResourceKey, number>;
  neighbors: string[];
  darkTide: number;                 // 黑潮侵蚀度 0-100
  fallen: boolean;                  // 被黑潮吞没
  titanIds: string[];               // 栖居于此的泰坦
  map: { x: number; y: number };    // 地图坐标（0-100）
}

export interface AgentBase {
  id: string;
  name: string;
  kind: AgentKind;
  subtitle: string;                 // 称号 / 身份
  location: string;
  hp: number;
  maxHp: number;
  power: number;                    // 基础攻击
  defense: number;                  // 基础防御
  inventory: Record<string, number>;
  weapon?: string;
  armor?: string;
  allies: string[];
  relations: Record<string, number>; // -100..100
  condition: AgentCondition;
  reviveDay?: number;
  guarding?: boolean;               // 当日处于防御姿态
  lastThought?: string;
  lastActions?: string[];
  counters: { actions: number; failures: number; damageDealt: number; chats: number };
}

export interface HeirStatus extends AgentBase {
  kind: 'heir';
  codename: string;
  path: string;
  targetTitanId: string;
  embers: string[];                 // 持有（尚未归还）的火种 id
  demigod: string[];                // 已归还火种、承载的神权（半神）
  deaths: number;
  xp: number;
  level: number;
}

export interface TitanStatus extends AgentBase {
  kind: 'titan';
  path: string;
  disposition: TitanDisposition;
  emberId: string;
  emberTaken: boolean;
  respect: Record<string, number>;  // 对黄金裔的认可度
}

export interface NpcStatus extends AgentBase {
  kind: 'npc';
  role: string;
}

export type AgentStatus = HeirStatus | TitanStatus | NpcStatus;

export interface Ember {
  id: string;
  name: string;
  path: string;
  titanId: string;
  holderId?: string;                // 当前持有者（黄金裔）
  returned: boolean;                // 已在创世涡心归还
}

export type LogType =
  | 'system' | 'move' | 'chat' | 'combat' | 'ember' | 'economy'
  | 'social' | 'tide' | 'event' | 'failure' | 'era';

export interface WorldLog {
  id: number;
  day: number;
  era: number;
  type: LogType;
  message: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  agentId?: string;
  targetId?: string;
  location?: string;
}

export interface ChatMessage {
  id: number;
  day: number;
  era: number;
  from: string;
  to: string;
  content: string;
  location: string;
}

export interface WorldEvent {
  id: string;
  name: string;
  description: string;
  location?: string;
  startDay: number;
  endDay: number;
}

export interface EraRecord {
  era: number;
  days: number;
  embers: number;
  outcome: 'recreation' | 'collapse';
  summary: string;
}

export interface AICallRecord {
  id: number;
  day: number;
  agentId: string;
  model: string;
  ms: number;
  ok: boolean;
  promptTokens: number;
  completionTokens: number;
  error?: string;
  preview?: string;
  reasoning?: string;                // 模型返回的思考内容 / 推理摘要
}

export interface AIStats {
  calls: number;
  failures: number;
  promptTokens: number;
  completionTokens: number;
  totalMs: number;
  recent: AICallRecord[];
}

export interface OmphalosWorldState {
  era: number;
  day: number;                      // 本纪元内的天数
  totalDays: number;
  timeOfDay: 'dawn' | 'noon' | 'dusk' | 'midnight';
  cities: Record<string, CityState>;
  agents: Record<string, AgentStatus>;
  embers: Record<string, Ember>;
  darkTide: { global: number; growth: number };
  worldStability: number;           // 0-100
  activeEvents: WorldEvent[];
  eraHistory: EraRecord[];
  logs: WorldLog[];
  messages: ChatMessage[];
  ai: AIStats;
}

export const LOG_LIMIT = 800;
export const MESSAGE_LIMIT = 300;
export const AI_RECORD_LIMIT = 80;

export function isHeir(a: AgentStatus | undefined): a is HeirStatus {
  return !!a && a.kind === 'heir';
}
export function isTitan(a: AgentStatus | undefined): a is TitanStatus {
  return !!a && a.kind === 'titan';
}
export function isNpc(a: AgentStatus | undefined): a is NpcStatus {
  return !!a && a.kind === 'npc';
}

// 城邦间最短路径（BFS），返回下一跳；已在目标或不可达时返回 undefined
export function nextHop(cities: Record<string, CityState>, from: string, to: string): string | undefined {
  if (from === to || !cities[from] || !cities[to]) return undefined;
  const prev: Record<string, string> = {};
  const queue = [from];
  const seen = new Set([from]);
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const n of cities[cur].neighbors) {
      if (!seen.has(n) && cities[n]) {
        seen.add(n);
        prev[n] = cur;
        queue.push(n);
      }
    }
  }
  if (!seen.has(to)) return undefined;
  let step = to;
  while (prev[step] !== from) step = prev[step];
  return step;
}

// 已从泰坦处取得的火种（含已归还）
export function collectedEmberCount(state: OmphalosWorldState): number {
  return Object.values(state.embers).filter(e => !!e.holderId).length;
}

// 已在创世涡心归还的火种
export function returnedEmberCount(state: OmphalosWorldState): number {
  return Object.values(state.embers).filter(e => e.returned).length;
}
