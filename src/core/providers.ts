// 模型协议适配层：把四种接口统一成「给定系统提示、用户提示与一个工具，返回工具参数/文本/思考内容」。
//   - OpenAI Responses API（推荐，支持推理摘要）
//   - OpenAI Chat Completions（以及所有 OpenAI 兼容端点）
//   - Anthropic Messages API（浏览器直连，自适应思考）
//   - DeepSeek V4（思考模式 thinking + reasoning_effort）
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type ProviderKind = 'openai-responses' | 'openai-chat' | 'anthropic' | 'deepseek';
export type ReasoningLevel = 'off' | 'low' | 'medium' | 'high' | 'max';

export interface ProviderSettings {
  provider: ProviderKind;
  endpoint: string;          // 留空则使用该协议的官方地址
  apiKey: string;
  model: string;
  temperature: number;
  reasoning: ReasoningLevel;
}

export interface ToolSpec {
  name: string;
  description: string;
  schema: Record<string, unknown>;
}

export interface CompletionRequest {
  system: string;
  user: string;
  tool?: ToolSpec;
  signal?: AbortSignal;
  timeoutMs: number;
}

export interface CompletionResult {
  toolArgs?: unknown;        // 工具调用参数（已解析或原始 JSON 字符串）
  text: string;              // 可见文本
  reasoning: string;         // 思考内容 / 推理摘要（若服务端返回）
  inputTokens: number;
  outputTokens: number;
  refusal?: string;          // 模型拒绝时的说明
}

export interface ProviderAdapter {
  readonly kind: ProviderKind;
  readonly model: string;
  complete(req: CompletionRequest): Promise<CompletionResult>;
  listModels(signal?: AbortSignal): Promise<string[]>;
}

export interface ProviderInfo {
  label: string;
  description: string;
  defaultEndpoint: string;
  keyPlaceholder: string;
  suggestedModels: string[];
  reasoningLevels: ReasoningLevel[];
}

export const PROVIDERS: Record<ProviderKind, ProviderInfo> = {
  'openai-responses': {
    label: 'OpenAI Responses',
    description: 'OpenAI 最新的 Responses API，支持推理模型与推理摘要。',
    defaultEndpoint: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-...',
    suggestedModels: ['gpt-5', 'gpt-5-mini', 'o4-mini', 'gpt-4.1'],
    reasoningLevels: ['off', 'low', 'medium', 'high']
  },
  'openai-chat': {
    label: 'OpenAI 兼容',
    description: 'Chat Completions 协议，适用于 OpenAI 及各类兼容端点（vLLM、OpenRouter、Ollama 等）。',
    defaultEndpoint: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-...',
    suggestedModels: ['gpt-4.1', 'gpt-4o', 'gpt-5-mini'],
    reasoningLevels: ['off', 'low', 'medium', 'high']
  },
  anthropic: {
    label: 'Anthropic',
    description: 'Claude Messages API，浏览器直连；新模型使用自适应思考与 effort 控制。',
    defaultEndpoint: 'https://api.anthropic.com',
    keyPlaceholder: 'sk-ant-...',
    suggestedModels: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5', 'claude-fable-5-1'],
    reasoningLevels: ['off', 'low', 'medium', 'high', 'max']
  },
  deepseek: {
    label: 'DeepSeek',
    description: 'DeepSeek V4，可开启思考模式；思考内容会显示在因果矩阵调用日志中。',
    defaultEndpoint: 'https://api.deepseek.com',
    keyPlaceholder: 'sk-...',
    suggestedModels: ['deepseek-v4-pro', 'deepseek-v4-flash'],
    reasoningLevels: ['off', 'high', 'max']
  }
};

export const REASONING_LABEL: Record<ReasoningLevel, string> = {
  off: '关闭', low: '低', medium: '中', high: '高', max: '极高'
};

// 不允许的思考档位回落到该协议支持的最接近档位
export function clampReasoning(kind: ProviderKind, level: ReasoningLevel): ReasoningLevel {
  const levels = PROVIDERS[kind].reasoningLevels;
  if (levels.includes(level)) return level;
  const order: ReasoningLevel[] = ['off', 'low', 'medium', 'high', 'max'];
  const idx = order.indexOf(level);
  for (let d = 1; d < order.length; d++) {
    const up = order[idx + d];
    if (up && levels.includes(up)) return up;
    const down = order[idx - d];
    if (down && levels.includes(down)) return down;
  }
  return levels[0];
}

export function createAdapter(settings: ProviderSettings): ProviderAdapter {
  const endpoint = settings.endpoint.trim() || PROVIDERS[settings.provider].defaultEndpoint;
  const s = { ...settings, endpoint, reasoning: clampReasoning(settings.provider, settings.reasoning) };
  switch (s.provider) {
    case 'openai-responses': return new OpenAIResponsesAdapter(s);
    case 'anthropic': return new AnthropicAdapter(s);
    case 'deepseek': return new DeepSeekAdapter(s);
    default: return new OpenAIChatAdapter(s);
  }
}

// OpenAI 推理模型（o 系列、gpt-5 系列）不接受 temperature，只接受 reasoning effort
function isOpenAIReasoningModel(model: string): boolean {
  return /(^|\/)(o\d|gpt-5|codex)/i.test(model);
}

function requestOptions(req: CompletionRequest) {
  return { signal: req.signal, timeout: req.timeoutMs, maxRetries: 1 };
}

// ---------------- OpenAI Chat Completions（及兼容端点） ----------------
class OpenAIChatAdapter implements ProviderAdapter {
  readonly kind: ProviderKind = 'openai-chat';
  protected client: OpenAI;

  constructor(protected s: ProviderSettings) {
    this.client = new OpenAI({ apiKey: s.apiKey, baseURL: s.endpoint, dangerouslyAllowBrowser: true });
  }

  get model() { return this.s.model; }

  protected extraBody(): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    const reasoningModel = isOpenAIReasoningModel(this.s.model);
    if (reasoningModel && this.s.reasoning !== 'off') body.reasoning_effort = this.s.reasoning === 'max' ? 'high' : this.s.reasoning;
    if (!reasoningModel) body.temperature = this.s.temperature;
    return body;
  }

  protected toolChoice(tool: ToolSpec): unknown {
    return { type: 'function', function: { name: tool.name } };
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const body: Record<string, unknown> = {
      model: this.s.model,
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user }
      ],
      ...this.extraBody()
    };
    if (req.tool) {
      body.tools = [{ type: 'function', function: { name: req.tool.name, description: req.tool.description, parameters: req.tool.schema } }];
      body.tool_choice = this.toolChoice(req.tool);
    }
    const res = await this.client.chat.completions.create(body as never, requestOptions(req)) as OpenAI.Chat.Completions.ChatCompletion;
    const msg = res.choices[0]?.message as (OpenAI.Chat.Completions.ChatCompletionMessage & { reasoning_content?: string; reasoning?: string }) | undefined;
    const call = msg?.tool_calls?.find(c => c.type === 'function');
    return {
      toolArgs: call?.function?.arguments,
      text: msg?.content ?? '',
      reasoning: msg?.reasoning_content ?? msg?.reasoning ?? '',
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
      refusal: msg?.refusal ?? undefined
    };
  }

  async listModels(signal?: AbortSignal): Promise<string[]> {
    const ids: string[] = [];
    for await (const m of this.client.models.list({ signal })) ids.push(m.id);
    return ids.sort();
  }
}

// ---------------- DeepSeek V4：思考模式 ----------------
class DeepSeekAdapter extends OpenAIChatAdapter {
  readonly kind: ProviderKind = 'deepseek';

  protected extraBody(): Record<string, unknown> {
    if (this.s.reasoning === 'off') {
      return { thinking: { type: 'disabled' }, temperature: this.s.temperature };
    }
    // 思考模式下 temperature 等采样参数会被忽略；reasoning_effort 仅支持 high / max
    return { thinking: { type: 'enabled' }, reasoning_effort: this.s.reasoning === 'max' ? 'max' : 'high' };
  }

  // 思考模式下只使用 auto，由提示要求调用工具；未调用时退回解析文本JSON
  protected toolChoice(tool: ToolSpec): unknown {
    return this.s.reasoning === 'off' ? super.toolChoice(tool) : 'auto';
  }
}

// ---------------- OpenAI Responses API ----------------
class OpenAIResponsesAdapter implements ProviderAdapter {
  readonly kind: ProviderKind = 'openai-responses';
  private client: OpenAI;

  constructor(private s: ProviderSettings) {
    this.client = new OpenAI({ apiKey: s.apiKey, baseURL: s.endpoint, dangerouslyAllowBrowser: true });
  }

  get model() { return this.s.model; }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const reasoningModel = isOpenAIReasoningModel(this.s.model);
    const body: Record<string, unknown> = {
      model: this.s.model,
      instructions: req.system,
      input: req.user,
      store: false
    };
    if (reasoningModel && this.s.reasoning !== 'off') {
      body.reasoning = { effort: this.s.reasoning === 'max' ? 'high' : this.s.reasoning, summary: 'auto' };
    }
    if (!reasoningModel) body.temperature = this.s.temperature;
    if (req.tool) {
      // strict 需要所有字段必填；动作参数大多可选，因此保持非严格模式
      body.tools = [{ type: 'function', name: req.tool.name, description: req.tool.description, parameters: req.tool.schema, strict: false }];
      body.tool_choice = { type: 'function', name: req.tool.name };
    }
    const res = await this.client.responses.create(body as never, requestOptions(req)) as OpenAI.Responses.Response;
    let toolArgs: string | undefined;
    const text: string[] = [];
    const reasoning: string[] = [];
    let refusal: string | undefined;
    for (const item of res.output ?? []) {
      if (item.type === 'function_call' && !toolArgs) toolArgs = item.arguments;
      else if (item.type === 'message') {
        for (const part of item.content) {
          if (part.type === 'output_text') text.push(part.text);
          else if (part.type === 'refusal') refusal = part.refusal;
        }
      } else if (item.type === 'reasoning') {
        for (const s of item.summary ?? []) reasoning.push(s.text);
      }
    }
    return {
      toolArgs,
      text: text.join('\n'),
      reasoning: reasoning.join('\n'),
      inputTokens: res.usage?.input_tokens ?? 0,
      outputTokens: res.usage?.output_tokens ?? 0,
      refusal
    };
  }

  async listModels(signal?: AbortSignal): Promise<string[]> {
    const ids: string[] = [];
    for await (const m of this.client.models.list({ signal })) ids.push(m.id);
    return ids.sort();
  }
}

// ---------------- Anthropic Messages API ----------------
// 支持自适应思考（adaptive + effort）的新一代模型；这些模型不接受 temperature 与 budget_tokens
function isAdaptiveClaude(model: string): boolean {
  return /claude-(opus|sonnet|fable|mythos)-(4-[678]|5)/i.test(model);
}
// 旧模型的思考需要 budget_tokens
function supportsBudgetThinking(model: string): boolean {
  return /claude-(3-7|opus-4|sonnet-4|haiku-4-5)/i.test(model) && !isAdaptiveClaude(model);
}
// 这些模型默认启用服务器端拒绝回退（仅官方端点）
function supportsServerFallback(model: string): boolean {
  return /^claude-(opus-5|fable-5-1)$/i.test(model);
}

const BUDGET: Record<ReasoningLevel, number> = { off: 0, low: 1024, medium: 4096, high: 8192, max: 12000 };

class AnthropicAdapter implements ProviderAdapter {
  readonly kind: ProviderKind = 'anthropic';
  private client: Anthropic;
  private official: boolean;

  constructor(private s: ProviderSettings) {
    this.client = new Anthropic({ apiKey: s.apiKey, baseURL: s.endpoint, dangerouslyAllowBrowser: true });
    this.official = /(^|\/\/)api\.anthropic\.com/.test(s.endpoint);
  }

  get model() { return this.s.model; }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const adaptive = isAdaptiveClaude(this.s.model);
    const thinkingOn = this.s.reasoning !== 'off' && (adaptive || supportsBudgetThinking(this.s.model));
    const body: Record<string, unknown> = {
      model: this.s.model,
      max_tokens: thinkingOn ? 16000 : 4096,
      system: req.system,
      messages: [{ role: 'user', content: req.user }]
    };

    if (adaptive) {
      // 新模型思考默认开启且部分型号无法关闭；「关闭」时以最低 effort 运行
      if (thinkingOn) body.thinking = { type: 'adaptive', display: 'summarized' };
      body.output_config = { effort: thinkingOn ? this.s.reasoning : 'low' };
    } else if (thinkingOn) {
      body.thinking = { type: 'enabled', budget_tokens: BUDGET[this.s.reasoning] };
    } else {
      body.temperature = Math.min(1, this.s.temperature);
    }

    if (req.tool) {
      body.tools = [{ name: req.tool.name, description: req.tool.description, input_schema: req.tool.schema }];
      // 思考模式与新模型都不允许强制指定工具，改用 auto + 提示约束
      body.tool_choice = !thinkingOn && !adaptive ? { type: 'tool', name: req.tool.name } : { type: 'auto' };
    }

    const useFallback = this.official && supportsServerFallback(this.s.model);
    const res = (useFallback
      ? await this.client.beta.messages.create({ ...body, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } as never, requestOptions(req))
      : await this.client.messages.create(body as never, requestOptions(req))) as Anthropic.Message;

    const usage = res.usage;
    const inputTokens = (usage?.input_tokens ?? 0) + (usage?.cache_read_input_tokens ?? 0) + (usage?.cache_creation_input_tokens ?? 0);
    if (res.stop_reason === 'refusal') {
      const details = (res as unknown as { stop_details?: { category?: string | null; explanation?: string | null } }).stop_details;
      return { text: '', reasoning: '', inputTokens, outputTokens: usage?.output_tokens ?? 0, refusal: details?.explanation || details?.category || '模型拒绝了该请求' };
    }

    let toolArgs: unknown;
    const text: string[] = [];
    const reasoning: string[] = [];
    for (const block of res.content) {
      if (block.type === 'tool_use' && toolArgs === undefined) toolArgs = block.input;
      else if (block.type === 'text') text.push(block.text);
      else if (block.type === 'thinking') reasoning.push(block.thinking);
    }
    return { toolArgs, text: text.join('\n'), reasoning: reasoning.join('\n'), inputTokens, outputTokens: usage?.output_tokens ?? 0 };
  }

  async listModels(signal?: AbortSignal): Promise<string[]> {
    const ids: string[] = [];
    for await (const m of this.client.models.list({}, { signal })) ids.push(m.id);
    return ids;
  }
}
