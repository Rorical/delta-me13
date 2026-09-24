import type { AICallRecord, AIStats } from './omphalosWorldState';
import { AI_RECORD_LIMIT } from './omphalosWorldState';
import { buildDecisionSchema, normalizeActions, type ActionType, type Decision } from './agent/actions';
import type { CompletionResult, ProviderAdapter, ToolSpec } from './providers';

export interface LLMConfig {
  timeoutMs: number;
}

export interface DecisionRequest {
  agentId: string;
  day: number;
  system: string;
  user: string;
  allowed: ActionType[];
}

const TOOL_NAME = 'act';
const JSON_FORMAT = '{"thought":"...","actions":[{"type":"...",...}]}';

export function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.search(/[[{]/);
  if (start < 0) throw new Error('响应中没有JSON');
  const end = Math.max(body.lastIndexOf('}'), body.lastIndexOf(']'));
  return JSON.parse(body.slice(start, end + 1));
}

export function parseArgs(args: unknown): any {
  if (typeof args === 'string') return JSON.parse(args);
  return args;
}

// 请求失败是否说明端点不支持工具调用（此时降级为纯文本JSON）
export function looksLikeToolUnsupported(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  const message = String(err?.message ?? '');
  return status === 422 || ((status === 400 || status === 404) && /tool|function/i.test(message));
}

// 统一的模型调用入口：工具调用优先，端点不支持时自动降级为纯文本JSON
export class LLMGateway {
  private useTools = true;
  private seq = 0;

  constructor(
    private adapter: ProviderAdapter,
    private config: LLMConfig,
    private stats: () => AIStats,
    private signal?: AbortSignal
  ) {
    // 重新连接或从存档恢复后，调用记录的编号接着已有的继续
    this.seq = stats().recent.reduce((m, r) => Math.max(m, r.id), 0);
  }

  setSignal(signal?: AbortSignal) {
    this.signal = signal;
  }

  async decide(req: DecisionRequest): Promise<Decision> {
    try {
      return await this.decideOnce(req, this.useTools);
    } catch (err: any) {
      if (this.signal?.aborted) throw err;
      if (this.useTools && looksLikeToolUnsupported(err)) {
        this.useTools = false;
        return this.decideOnce(req, false);
      }
      throw err;
    }
  }

  async summarize(agentId: string, day: number, text: string): Promise<string> {
    const { res } = await this.call(agentId, day, {
      system: '把以下角色经历压缩为不超过150字的第一人称摘要，保留关键人物、恩怨、承诺与目标。只输出摘要本身。',
      user: text
    });
    return res.text.trim();
  }

  private async decideOnce(req: DecisionRequest, tools: boolean): Promise<Decision> {
    const tool: ToolSpec | undefined = tools
      ? { name: TOOL_NAME, description: '决定今天的行动', schema: buildDecisionSchema(req.allowed) }
      : undefined;
    // 部分模型（思考模式、最新的 Claude）不允许强制工具调用，因此在提示中明确要求
    const system = tools
      ? `${req.system}\n\n请调用 ${TOOL_NAME} 工具提交你的决定，不要只用文字回答。`
      : `${req.system}\n\n只输出一个JSON对象，不要任何其他文字，格式：${JSON_FORMAT}`;
    const { res, record } = await this.call(req.agentId, req.day, { system, user: req.user, tool });

    if (res.refusal) throw new Error(`模型拒绝：${res.refusal}`);
    let parsed: any;
    if (res.toolArgs !== undefined) parsed = parseArgs(res.toolArgs);
    else if (res.text.trim()) parsed = extractJson(res.text);
    else throw new Error('模型没有返回任何内容');
    if (Array.isArray(parsed)) parsed = { thought: '', actions: parsed };

    const decision = {
      thought: String(parsed?.thought ?? '').slice(0, 160),
      actions: normalizeActions(parsed?.actions, req.allowed)
    };
    record.preview = `${decision.thought} ${decision.actions.map(a => a.type).join(',')}`.trim();
    return decision;
  }

  private async call(agentId: string, day: number, input: { system: string; user: string; tool?: ToolSpec }) {
    const stats = this.stats();
    const started = performance.now();
    const record: AICallRecord = {
      id: ++this.seq, day, agentId, model: this.adapter.model, ms: 0, ok: false, promptTokens: 0, completionTokens: 0
    };
    try {
      const res: CompletionResult = await this.adapter.complete({
        ...input,
        signal: this.signal,
        timeoutMs: this.config.timeoutMs
      });
      record.ok = !res.refusal;
      record.promptTokens = res.inputTokens;
      record.completionTokens = res.outputTokens;
      if (res.reasoning) record.reasoning = res.reasoning.slice(0, 1200);
      if (res.refusal) {
        record.error = `拒绝：${res.refusal}`.slice(0, 160);
        stats.failures++;
      }
      return { res, record };
    } catch (err: any) {
      record.error = String(err?.message || err).slice(0, 160);
      stats.failures++;
      throw err;
    } finally {
      record.ms = Math.round(performance.now() - started);
      stats.calls++;
      stats.totalMs += record.ms;
      stats.promptTokens += record.promptTokens;
      stats.completionTokens += record.completionTokens;
      stats.recent.push(record);
      if (stats.recent.length > AI_RECORD_LIMIT) stats.recent.splice(0, stats.recent.length - AI_RECORD_LIMIT);
    }
  }
}

// 带并发上限的 map，可被中止
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
  signal?: AbortSignal
): Promise<(R | undefined)[]> {
  const results: (R | undefined)[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length && !signal?.aborted) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return results;
}
