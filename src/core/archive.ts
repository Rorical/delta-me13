// 世界档案文件：完整导出 / 导入世界状态、编年史、记忆与小剧场。
import type { OmphalosSimulation, SimSnapshot } from './llmSimulation';
import type { Chronicle, OmphalosWorldState } from './omphalosWorldState';
import type { Play } from './theater';

export const ARCHIVE_FORMAT = 'omphalos-world';
export const ARCHIVE_VERSION = 1;

export interface WorldArchive {
  format: typeof ARCHIVE_FORMAT;
  version: number;
  exportedAt: string;
  snapshot: SimSnapshot;
  theaters: Play[];
}

export function buildArchive(sim: OmphalosSimulation, theaters: Play[]): WorldArchive {
  return { format: ARCHIVE_FORMAT, version: ARCHIVE_VERSION, exportedAt: new Date().toISOString(), snapshot: sim.snapshot(), theaters };
}

// 文件名只用 ASCII：部分浏览器会把非 ASCII 的下载文件名替换为「download」
export function timeStamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export function archiveFilename(state: OmphalosWorldState, kind: 'world' | 'chronicle', ext: string): string {
  return `omphalos-${kind}-era${state.era}-day${state.day}-${timeStamp()}.${ext}`;
}

// 解析导入的文件：接受完整档案，也接受单独的仿真快照
export function parseArchive(text: string): { snapshot: SimSnapshot; theaters: Play[] } {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('文件不是有效的 JSON');
  }
  if (data?.format === ARCHIVE_FORMAT) {
    if (typeof data.version !== 'number' || data.version > ARCHIVE_VERSION) throw new Error('档案来自更新的版本，无法读取');
    return { snapshot: data.snapshot, theaters: Array.isArray(data.theaters) ? data.theaters.filter(isPlay) : [] };
  }
  if (data?.state && data?.version) return { snapshot: data, theaters: [] };
  throw new Error('这不是翁法罗斯的世界档案');
}

function isPlay(p: any): p is Play {
  return !!p && typeof p.id === 'string' && typeof p.title === 'string' && Array.isArray(p.scenes);
}

// 可读的编年史（Markdown）：按纪元、天数分节
export function chronicleToMarkdown(chronicle: Chronicle, state: OmphalosWorldState): string {
  const out = ['# 翁法罗斯编年史', ''];
  out.push(`*导出于 ${new Date().toLocaleString()} · 当前第${state.era}纪元第${state.day}天 · 共 ${chronicle.logs.length} 条记录*`, '');
  if (state.eraHistory.length) {
    out.push('## 纪元更迭', '');
    for (const r of state.eraHistory) out.push(`- 第${r.era}纪元（${r.days}天，归还${r.embers}/12）：${r.summary}`);
    out.push('');
  }
  let era = -1;
  let day = -1;
  for (const l of chronicle.logs) {
    if (l.era !== era) {
      era = l.era;
      day = -1;
      out.push('', `## 第${era}纪元`, '');
    }
    if (l.day !== day) {
      day = l.day;
      out.push('', `### 第${day}天`, '');
    }
    if (/^—— 第\d+纪元/.test(l.message)) continue;
    const mark = l.importance === 'critical' ? '**' : '';
    out.push(`- ${mark}${l.message}${mark}`);
  }
  return out.join('\n') + '\n';
}
