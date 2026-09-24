import type OpenAI from 'openai';
import { WorldEngine } from './engine';
import { AgentMemory } from './agent/memory';
import { LLMGateway, mapLimit, type LLMConfig } from './llm';
import { buildSystemPrompt, buildUserPrompt } from './agent/prompts';
import { ALLOWED_ACTIONS, type Action, type ActionType, type Decision } from './agent/actions';
import { createWorld } from './config/worldFactory';
import type { NPCSeed } from './agent/npcProfiles';
import {
  type AgentStatus, type OmphalosWorldState, returnedEmberCount, isNpc, isTitan
} from './omphalosWorldState';

export interface SimConfig {
  concurrency: number;      // 同时进行的模型请求数
  npcActivity: number;      // NPC 每天行动的概率 0-1
  replyPhase: boolean;      // 被搭话者当天即回应
  dayDelayMs: number;       // 每天之间的间隔
  npcCount: number;
}

export const DEFAULT_SIM_CONFIG: SimConfig = {
  concurrency: 4,
  npcActivity: 0.5,
  replyPhase: true,
  dayDelayMs: 500,
  npcCount: 10
};

export type SimStatus = 'idle' | 'running' | 'paused' | 'stopping';

export interface SimProgress {
  phase: string;
  done: number;
  total: number;
}

const REPLY_ACTIONS: ActionType[] = ['CHAT', 'GIFT', 'TRADE', 'FORM_ALLIANCE', 'ATTACK', 'INSPECT', 'BESTOW_EMBER', 'DEFEND'];

class AbortedError extends Error {}

export class OmphalosSimulation {
  engine: WorldEngine;
  status: SimStatus = 'idle';
  progress: SimProgress = { phase: '待机', done: 0, total: 0 };
  lastError = '';
  config: SimConfig;

  private memories = new Map<string, AgentMemory>();
  private systemPrompts = new Map<string, string>();
  private npcSeeds: NPCSeed[];
  private gateway?: LLMGateway;
  private abort?: AbortController;
  private listeners = new Set<() => void>();
  private pauseRequested = false;
  private pendingEraEnd?: 'recreation' | 'collapse';

  constructor(config: Partial<SimConfig> = {}) {
    this.config = { ...DEFAULT_SIM_CONFIG, ...config };
    const { state, npcs } = createWorld({ npcCount: this.config.npcCount });
    this.npcSeeds = npcs;
    this.engine = new WorldEngine(state, () => this.emit());
    this.engine.onEraEnd = outcome => { this.pendingEraEnd = outcome; };
    this.engine.log('system', '翁法罗斯世界初始化完成，逐火之旅即将开始……', 'critical');
  }

  get state(): OmphalosWorldState {
    return this.engine.state;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach(fn => fn());
  }

  memoryOf(id: string): AgentMemory {
    let m = this.memories.get(id);
    if (!m) { m = new AgentMemory(); this.memories.set(id, m); }
    return m;
  }

  connect(client: OpenAI, llm: LLMConfig) {
    this.gateway = new LLMGateway(client, llm, () => this.state.ai);
  }

  updateConfig(patch: Partial<SimConfig>) {
    Object.assign(this.config, patch);
    this.emit();
  }

  // ---------- 运行控制 ----------
  async start() {
    if (this.status === 'running' || this.status === 'stopping') return;
    await this.loop(Infinity);
  }

  async step() {
    if (this.status === 'running' || this.status === 'stopping') return;
    await this.loop(1);
  }

  pause() {
    if (this.status === 'running') {
      this.pauseRequested = true;
      this.setPhase('将在本日结束后暂停');
    }
  }

  resume(): Promise<void> | undefined {
    if (this.status === 'paused') return this.loop(Infinity);
  }

  stop() {
    if (this.status === 'idle') return;
    if (this.status === 'paused') {
      this.status = 'idle';
      this.setPhase('已停止');
      return;
    }
    this.status = 'stopping';
    this.pauseRequested = false;
    this.abort?.abort();
    this.emit();
  }

  reset() {
    this.stop();
    const { state, npcs } = createWorld({ npcCount: this.config.npcCount });
    this.npcSeeds = npcs;
    this.engine.state = state;
    this.memories.clear();
    this.systemPrompts.clear();
    this.status = 'idle';
    this.lastError = '';
    this.setPhase('待机');
    this.engine.log('system', '世界已重置。', 'critical');
  }

  private async loop(days: number) {
    if (!this.gateway) throw new Error('尚未连接模型');
    this.status = 'running';
    this.pauseRequested = false;
    this.lastError = '';
    this.abort = new AbortController();
    this.gateway.setSignal(this.abort.signal);
    this.emit();
    try {
      for (let i = 0; i < days; i++) {
        await this.runDay();
        if (this.pauseRequested || i === days - 1) break;
        await this.sleep(this.config.dayDelayMs);
      }
      this.status = 'paused';
      this.setPhase('已暂停');
    } catch (err: any) {
      if (err instanceof AbortedError || this.abort.signal.aborted) {
        this.status = 'idle';
        this.setPhase('已停止');
      } else {
        this.lastError = String(err?.message || err);
        this.status = 'paused';
        this.setPhase('出错暂停');
        this.engine.log('failure', `仿真出错并已暂停：${this.lastError}`, 'critical');
      }
    } finally {
      this.pauseRequested = false;
      this.emit();
    }
  }

  private sleep(ms: number) {
    return new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, ms);
      this.abort?.signal.addEventListener('abort', () => { clearTimeout(t); reject(new AbortedError()); }, { once: true });
    });
  }

  private setPhase(phase: string, done = 0, total = 0) {
    this.progress = { phase, done, total };
    this.emit();
  }

  private checkAbort() {
    if (this.abort?.signal.aborted) throw new AbortedError();
  }

  // ---------- 一天 ----------
  private async runDay() {
    const engine = this.engine;
    engine.beginDay();
    const s = this.state;

    // 1. 决策：黄金裔每天行动；NPC 按活跃度抽样；泰坦只在有人来访时醒来
    const active = Object.values(s.agents).filter(a => a.condition === 'active');
    const deciders = active.filter(a => {
      if (isTitan(a)) return engine.agentsIn(a.location, a.id).some(o => !isTitan(o));
      if (isNpc(a)) return Math.random() < this.config.npcActivity;
      return true;
    });
    const decisions = await this.decideAll(deciders, '思考中');
    this.checkAbort();

    // 2. 结算：随机顺序逐一执行
    this.setPhase('结算行动');
    const order = deciders.map((a, i) => ({ a, d: decisions[i] })).sort(() => Math.random() - 0.5);
    for (const { a, d } of order) this.applyDecision(a, d);

    // 3. 回应：当天被搭话的人立即回应一次
    if (this.config.replyPhase && engine.inbox.size) {
      const inbox = new Map(engine.inbox);
      engine.inbox.clear();
      const responders = [...inbox.keys()].map(id => s.agents[id]).filter(a => a && a.condition === 'active');
      const replies = await this.decideAll(responders, '回应对话', agent => {
        const from = (inbox.get(agent.id) ?? []).map(id => s.agents[id]?.name).filter(Boolean).join('、');
        return `${from}刚刚对你说了话，请回应（可以只说话，也可以同时行动）。`;
      }, REPLY_ACTIONS);
      this.checkAbort();
      responders.forEach((a, i) => this.applyDecision(a, replies[i]));
    }

    // 4. 世界演化
    this.setPhase('世界演化');
    engine.endDay();
    if (this.pendingEraEnd) this.startNewEra(this.pendingEraEnd);

    // 5. 记忆整理（后台并发，不阻塞下一天太久）
    const gw = this.gateway!;
    await mapLimit([...this.memories.entries()], this.config.concurrency, ([id, mem]) =>
      mem.compact(text => gw.summarize(id, s.day, text)).catch(() => {}), this.abort?.signal);
    this.setPhase('本日完成');
  }

  private async decideAll(
    agents: AgentStatus[],
    phase: string,
    trigger?: (a: AgentStatus) => string,
    allowed?: ActionType[]
  ): Promise<(Decision | undefined)[]> {
    let done = 0;
    let failures = 0;
    this.setPhase(phase, 0, agents.length);
    const results = await mapLimit(agents, this.config.concurrency, async agent => {
      const d = await this.decideFor(agent, trigger?.(agent), allowed).catch(err => {
        if (this.abort?.signal.aborted) throw new AbortedError();
        failures++;
        this.engine.log('failure', `${agent.name} 的思考中断：${String(err?.message || err).slice(0, 80)}`, 'low', { agentId: agent.id });
        return undefined;
      });
      this.setPhase(phase, ++done, agents.length);
      return d;
    }, this.abort?.signal);
    if (agents.length >= 3 && failures === agents.length) {
      throw new Error('所有模型请求均失败，请检查因果矩阵配置（端点 / 密钥 / 模型）');
    }
    return results;
  }

  private decideFor(agent: AgentStatus, trigger?: string, allowed?: ActionType[]): Promise<Decision> {
    let system = this.systemPrompts.get(agent.id);
    if (!system) {
      const seed = isNpc(agent) ? this.npcSeeds[Number(agent.id.replace('npc_', '')) - 1] : undefined;
      system = buildSystemPrompt(agent, seed?.personality);
      this.systemPrompts.set(agent.id, system);
    }
    const user = buildUserPrompt(this.engine, agent, this.memoryOf(agent.id), trigger);
    const kindAllowed = ALLOWED_ACTIONS[agent.kind];
    return this.gateway!.decide({
      agentId: agent.id,
      day: this.state.day,
      system,
      user,
      allowed: allowed ? allowed.filter(t => kindAllowed.includes(t)) : kindAllowed
    });
  }

  private applyDecision(agent: AgentStatus, decision?: Decision) {
    const s = this.state;
    const mem = this.memoryOf(agent.id);
    if (!decision) return;
    if (decision.thought) agent.lastThought = decision.thought;
    if (!decision.actions.length) {
      agent.lastActions = ['（无所作为）'];
      return;
    }
    const summaries: string[] = [];
    for (const action of decision.actions) {
      if (agent.condition !== 'active') break;
      const res = this.engine.execute(agent, action);
      const text = `${describe(action, s)} → ${res.ok ? '' : '失败：'}${res.message}`;
      summaries.push(text);
      mem.add(s.day, text);
      // 被作用的一方也记住这件事
      const targetId = 'targetId' in action ? this.engine.resolveAgent(action.targetId)?.id : undefined;
      if (res.ok && targetId && action.type !== 'CHAT' && action.type !== 'INSPECT') {
        this.memoryOf(targetId).add(s.day, `${agent.name}对我${describe(action, s)}（${res.message}）`);
      }
    }
    agent.lastActions = summaries;
  }

  private startNewEra(outcome: 'recreation' | 'collapse') {
    this.pendingEraEnd = undefined;
    const old = this.state;
    const embers = returnedEmberCount(old);
    const summary = outcome === 'recreation'
      ? `十二火种尽数归还创世涡心，第${old.era}纪元迎来再创世。`
      : `黑潮吞没了翁法罗斯，第${old.era}纪元终结，永劫回归再度开启。`;
    const { state } = createWorld({ npcCount: this.config.npcCount, npcs: this.npcSeeds });
    state.era = old.era + 1;
    state.totalDays = old.totalDays;
    state.eraHistory = [...old.eraHistory, { era: old.era, days: old.day, embers, outcome, summary }];
    state.logs = old.logs;
    state.messages = old.messages;
    state.ai = old.ai;
    // 轮回会加深：每一纪元黑潮都更凶猛
    state.darkTide.growth = old.darkTide.growth;
    this.engine.state = state;
    this.memories.forEach(m => m.carryOver(old.era));
    this.engine.log('era', `${summary} 第${state.era}纪元开始。`, 'critical');
  }
}

function describe(action: Action, s: OmphalosWorldState): string {
  const name = (id: string) => s.agents[id]?.name ?? id;
  switch (action.type) {
    case 'MOVE': return `前往${action.targetCity}`;
    case 'CHAT': return `对${name(action.targetId)}说“${action.content}”`;
    case 'INSPECT': return `观察${name(action.targetId)}`;
    case 'FORM_ALLIANCE': return `与${name(action.targetId)}结盟`;
    case 'ATTACK': return `攻击${name(action.targetId)}`;
    case 'GATHER': return `采集${action.resource}`;
    case 'CRAFT': return `制作${action.itemName}`;
    case 'USE_ITEM': return `使用${action.itemName}`;
    case 'TRADE': return `与${name(action.targetId)}交易`;
    case 'GIFT': return `赠礼给${name(action.targetId)}`;
    case 'BUILD_DEFENSE': return `修筑${action.defenseType === 'WALL' ? '城墙' : '瞭望塔'}`;
    case 'BESTOW_EMBER': return `授予火种给${name(action.targetId)}`;
    case 'DEFEND': return '防御';
    case 'REST': return '休息';
    case 'CLEANSE': return '净化黑潮';
    case 'RETURN_EMBER': return '归还火种';
  }
}
