import type OpenAI from 'openai';
import type { AICallRecord, AIStats } from './omphalosWorldState';
import { AI_RECORD_LIMIT } from './omphalosWorldState';
import { buildDecisionSchema, normalizeActions, type ActionType, type Decision } from './agent/actions';

export interface LLMConfig {
  model: string;
  temperature: number;
  timeoutMs: number;
}

export interface DecisionRequest {
  agentId: string;
  day: number;
  system: string;
  user: string;
  allowed: ActionType[];
}

// 推理类模型不接受 temperature
function isReasoningModel(model: string): boolean {
  return /(^|\/)o\d/i.test(model) || /gpt-5/i.test(model);
}

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.search(/[[{]/);
  if (start < 0) throw new Error('响应中没有JSON');
  const end = Math.max(body.lastIndexOf('}'), body.lastIndexOf(']'));
  return JSON.parse(body.slice(start, end + 1));
}

// 统一的模型调用入口：函数调用优先，端点不支持时自动降级为纯文本JSON
export class LLMGateway {
  private useTools = true;
  private seq = 0;

  constructor(
    private client: OpenAI,
    private config: LLMConfig,
    private stats: () => AIStats,
    private signal?: AbortSignal
  ) {}

  setSignal(signal?: AbortSignal) {
    this.signal = signal;
  }

  async decide(req: DecisionRequest): Promise<Decision> {
    try {
      return await this.decideOnce(req, this.useTools);
    } catch (err: any) {
      if (this.signal?.aborted) throw err;
      // 400/422 多半是端点不支持 tools，切换到JSON模式重试一次
      const status = err?.status ?? err?.response?.status;
      if (this.useTools && (status === 400 || status === 422 || status === 404 || /tool|function/i.test(String(err?.message)))) {
        this.useTools = false;
        return this.decideOnce(req, false);
      }
      throw err;
    }
  }

  async summarize(agentId: string, day: number, text: string): Promise<string> {
    const { res } = await this.call(agentId, day, {
      messages: [
        { role: 'system', content: '把以下角色经历压缩为不超过150字的第一人称摘要，保留关键人物、恩怨、承诺与目标。' },
        { role: 'user', content: text }
      ]
    });
    return res.choices[0]?.message?.content?.trim() || '';
  }

  private async decideOnce(req: DecisionRequest, tools: boolean): Promise<Decision> {
    const schema = buildDecisionSchema(req.allowed);
    const system = tools
      ? req.system
      : `${req.system}\n\n只输出一个JSON对象，不要任何其他文字，格式：{"thought":"...","actions":[{"type":"...",...}]}`;
    const body: Record<string, any> = {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: req.user }
      ]
    };
    if (tools) {
      body.tools = [{ type: 'function', function: { name: 'act', description: '决定今天的行动', parameters: schema } }];
      body.tool_choice = { type: 'function', function: { name: 'act' } };
    }
    const { res, record } = await this.call(req.agentId, req.day, body);
    const msg = res.choices[0]?.message;
    const argText = msg?.tool_calls?.[0]?.function?.arguments;
    let parsed: any;
    if (argText) parsed = JSON.parse(argText);
    else if (msg?.content) parsed = extractJson(msg.content);
    else throw new Error('模型没有返回任何内容');
    if (Array.isArray(parsed)) parsed = { thought: '', actions: parsed };
    const decision = {
      thought: String(parsed?.thought ?? '').slice(0, 160),
      actions: normalizeActions(parsed?.actions, req.allowed)
    };
    record.preview = `${decision.thought} ${decision.actions.map(a => a.type).join(',')}`.trim();
    return decision;
  }

  private async call(agentId: string, day: number, body: Record<string, any>) {
    const stats = this.stats();
    const started = performance.now();
    const record: AICallRecord = {
      id: ++this.seq, day, agentId, model: this.config.model, ms: 0, ok: false, promptTokens: 0, completionTokens: 0
    };
    const request: Record<string, any> = { model: this.config.model, ...body };
    if (!isReasoningModel(this.config.model)) request.temperature = this.config.temperature;
    try {
      const res = await this.client.chat.completions.create(request as any, {
        signal: this.signal,
        timeout: this.config.timeoutMs,
        maxRetries: 1
      });
      record.ok = true;
      record.promptTokens = res.usage?.prompt_tokens ?? 0;
      record.completionTokens = res.usage?.completion_tokens ?? 0;
      return { res: res as OpenAI.Chat.Completions.ChatCompletion, record };
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
