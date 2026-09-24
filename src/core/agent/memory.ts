// 代理记忆：最近的经历 + 早期经历的摘要。
// 替代原先基于 embedding 的向量记忆 —— 不再依赖端点提供 embedding 模型，也不会每次决策都额外请求。
export interface MemoryEntry {
  day: number;
  text: string;
}

export type Summarizer = (text: string) => Promise<string>;

const KEEP_RECENT = 14;
const COMPACT_AT = 36;

export class AgentMemory {
  private entries: MemoryEntry[] = [];
  private summary = '';
  private compacting = false;

  add(day: number, text: string) {
    this.entries.push({ day, text });
  }

  recent(n = KEEP_RECENT): MemoryEntry[] {
    return this.entries.slice(-n);
  }

  getSummary(): string {
    return this.summary;
  }

  all(): MemoryEntry[] {
    return [...this.entries];
  }

  // 条目过多时，把较早的部分压缩为摘要。没有可用模型时退化为截断拼接。
  async compact(summarize?: Summarizer) {
    if (this.compacting || this.entries.length < COMPACT_AT) return;
    this.compacting = true;
    const old = this.entries.slice(0, this.entries.length - KEEP_RECENT);
    const text = [this.summary, ...old.map(e => `第${e.day}天: ${e.text}`)].filter(Boolean).join('\n');
    try {
      const s = summarize ? await summarize(text) : '';
      this.summary = (s || text).slice(-600);
      this.entries = this.entries.slice(old.length);
    } catch {
      this.summary = text.slice(-600);
      this.entries = this.entries.slice(old.length);
    } finally {
      this.compacting = false;
    }
  }

  // 纪元轮回：只留下一丝模糊的印象
  carryOver(era: number) {
    const glimpse = this.summary || this.entries.slice(-5).map(e => e.text).join('；');
    this.entries = [];
    this.summary = glimpse ? `（第${era}纪元的残响，似梦非梦）${glimpse.slice(0, 300)}` : '';
  }
}
