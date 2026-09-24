// 小剧场：把仿真中真实发生的对话与事件编成剧本。
//   - 实录：不调用模型，直接把对话与事件按天分幕
//   - 改编：把实录素材交给模型，按选定风格写成一出小剧场（情节必须基于真实事件）
import type { AgentStatus, Chronicle, OmphalosWorldState, WorldLog } from './omphalosWorldState';
import { isHeir, isNpc, isTitan } from './omphalosWorldState';
import type { ProviderAdapter, ToolSpec } from './providers';
import { extractJson, looksLikeToolUnsupported, parseArgs } from './llm';
import { GOLDEN_HEIRS } from './agent/goldenHeirProfiles';
import { getTitanProfile } from './agent/titanProfiles';
import { NPC_ROLES } from './agent/npcProfiles';

export type LineKind = 'dialogue' | 'action' | 'narration';

export interface PlayLine {
  kind: LineKind;
  speaker?: string;
  to?: string;
  text: string;
}

export interface PlayScene {
  heading: string;
  setting?: string;
  lines: PlayLine[];
}

export interface CastMember {
  id: string;
  name: string;
  subtitle: string;
}

export type PlayStyle = 'drama' | 'comedy' | 'tragedy' | 'slice';
export type PlayLength = 'short' | 'medium';

export interface Play {
  id: string;
  mode: 'record' | 'adapt';
  title: string;
  logline: string;
  style?: PlayStyle;
  model?: string;
  createdAt: number;
  era: number;
  dayFrom: number;
  dayTo: number;
  cast: CastMember[];
  scenes: PlayScene[];
  epilogue?: string;
}

export const STYLE_LABEL: Record<PlayStyle, string> = { drama: '正剧', comedy: '喜剧', tragedy: '悲剧', slice: '日常' };
const STYLE_GUIDE: Record<PlayStyle, string> = {
  drama: '正剧：庄重克制，突出抉择与命运的重量，台词有力。',
  comedy: '喜剧：轻松诙谐，放大角色之间的反差与误会，但不丑化角色，笑点来自性格本身。',
  tragedy: '悲剧：哀而不伤，着重失去、牺牲与无法挽回之事，留白多于煽情。',
  slice: '日常：温情细腻，聚焦战斗与使命之外的相处、闲谈与小事。'
};
export const LENGTH_LABEL: Record<PlayLength, string> = { short: '短篇', medium: '中篇' };
const LENGTH_GUIDE: Record<PlayLength, string> = {
  short: '共2幕，每幕8~14行。',
  medium: '共3~4幕，每幕10~18行。'
};

// ---------------- 素材 ----------------
export interface TheaterScope {
  era: number;
  dayFrom: number;
  dayTo: number;
  castIds: string[];              // 为空时自动挑选出场最多的角色
}

export interface TheaterMaterial {
  scope: TheaterScope;
  cast: CastMember[];
  logs: WorldLog[];
  chats: number;
}

const MATERIAL_LIMIT = 220;
// 不适合入戏的流水账
const SKIP_TYPES = new Set(['system', 'failure', 'economy']);

function speakerOf(state: OmphalosWorldState, id?: string): string {
  return (id && state.agents[id]?.name) || id || '';
}

// 对话日志的格式：「X 对 Y 说：「内容」」
export function chatContent(log: WorldLog): string {
  return log.message.match(/说：「([\s\S]*)」$/)?.[1] ?? log.message;
}

export function erasIn(chronicle: Chronicle): { era: number; lastDay: number }[] {
  const map = new Map<number, number>();
  for (const l of chronicle.logs) map.set(l.era, Math.max(map.get(l.era) ?? 0, l.day));
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([era, lastDay]) => ({ era, lastDay }));
}

export function collectMaterial(state: OmphalosWorldState, chronicle: Chronicle, scope: TheaterScope): TheaterMaterial {
  const inRange = chronicle.logs.filter(l => l.era === scope.era && l.day >= scope.dayFrom && l.day <= scope.dayTo && !SKIP_TYPES.has(l.type));

  let castIds = scope.castIds.filter(id => state.agents[id]);
  if (!castIds.length) {
    // 自动选角：对话与重要事件中出现最多的角色
    const score = new Map<string, number>();
    for (const l of inRange) {
      const w = l.type === 'chat' ? 2 : l.importance === 'critical' || l.importance === 'high' ? 1 : 0;
      for (const id of [l.agentId, l.targetId]) if (id && state.agents[id] && w) score.set(id, (score.get(id) ?? 0) + w);
    }
    castIds = [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => id);
  }
  const cast = new Set(castIds);

  const involved = (l: WorldLog) => (l.agentId && cast.has(l.agentId)) || (l.targetId && cast.has(l.targetId));
  let logs = inRange.filter(l =>
    involved(l) ? (l.type !== 'move' || l.importance !== 'low') : l.importance === 'critical' || l.type === 'era');
  if (logs.length > MATERIAL_LIMIT) {
    // 超出上限时优先保留对话与重要事件，再按时间顺序排列
    const rank = (l: WorldLog) => (l.type === 'chat' ? 3 : l.importance === 'critical' ? 3 : l.importance === 'high' ? 2 : l.type === 'move' ? 0 : 1);
    const keep = new Set([...logs].sort((a, b) => rank(b) - rank(a) || b.id - a.id).slice(0, MATERIAL_LIMIT));
    logs = logs.filter(l => keep.has(l));
  }

  return {
    scope: { ...scope, castIds },
    cast: castIds.map(id => ({ id, name: state.agents[id].name, subtitle: state.agents[id].subtitle })),
    logs,
    chats: logs.filter(l => l.type === 'chat').length
  };
}

// ---------------- 实录 ----------------
const newId = () => `play_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function recordPlay(state: OmphalosWorldState, m: TheaterMaterial): Play {
  const byDay = new Map<number, WorldLog[]>();
  for (const l of m.logs) {
    const list = byDay.get(l.day) ?? [];
    list.push(l);
    byDay.set(l.day, list);
  }
  const scenes: PlayScene[] = [];
  for (const [day, logs] of [...byDay.entries()].sort((a, b) => a[0] - b[0])) {
    const places = new Map<string, number>();
    for (const l of logs) if (l.location) places.set(l.location, (places.get(l.location) ?? 0) + 1);
    const place = [...places.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const lines: PlayLine[] = logs.slice(-30).map(l => l.type === 'chat'
      ? { kind: 'dialogue', speaker: speakerOf(state, l.agentId), to: speakerOf(state, l.targetId), text: chatContent(l) }
      : { kind: l.type === 'era' || l.type === 'event' || l.type === 'tide' ? 'narration' : 'action', text: l.message });
    scenes.push({ heading: `第${day}天${place ? ` · ${place}` : ''}`, lines });
  }
  const names = m.cast.map(c => c.name).join('、');
  const { era, dayFrom, dayTo } = m.scope;
  return {
    id: newId(),
    mode: 'record',
    title: `${m.cast.length > 2 ? `${m.cast.slice(0, 2).map(c => c.name).join('、')}等` : names || '翁法罗斯'} · 第${era}纪元实录`,
    logline: `第${dayFrom}至${dayTo}天间${names ? `围绕${names}` : ''}真实发生的${m.chats}段对话与${m.logs.length - m.chats}件事。`,
    createdAt: Date.now(),
    era, dayFrom, dayTo,
    cast: m.cast,
    scenes
  };
}

// ---------------- 改编 ----------------
function persona(a: AgentStatus): string {
  if (isHeir(a)) {
    const p = GOLDEN_HEIRS.find(h => h.id === a.id);
    return p ? `${p.trueName}（${p.epithet}，「${a.path}」黄金裔${a.demigod.length ? '，已成为半神' : ''}）性格：${p.personality} 说话：${p.speech}` : a.name;
  }
  if (isTitan(a)) {
    const p = getTitanProfile(a.id);
    return p ? `${p.name}（「${p.title}」，${p.path}之泰坦）性格：${p.personality}` : a.name;
  }
  if (isNpc(a)) return `${a.name}（${NPC_ROLES[a.role as keyof typeof NPC_ROLES]?.label ?? '居民'}，普通人）`;
  return `${a.name}（${a.subtitle}，敌对存在）`;
}

const PLAY_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: '剧名，不超过16字' },
    logline: { type: 'string', description: '一句话简介' },
    scenes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          heading: { type: 'string', description: '幕名，如「第一幕 · 悬锋城的黄昏」' },
          setting: { type: 'string', description: '场景说明' },
          lines: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                kind: { type: 'string', enum: ['dialogue', 'action', 'narration'] },
                speaker: { type: 'string', description: 'dialogue 时为说话者名字' },
                text: { type: 'string' }
              },
              required: ['kind', 'text']
            }
          }
        },
        required: ['heading', 'lines']
      }
    },
    epilogue: { type: 'string', description: '落幕旁白（可选）' }
  },
  required: ['title', 'scenes']
};

const PLAY_TOOL: ToolSpec = { name: 'write_play', description: '提交写好的小剧场剧本', schema: PLAY_SCHEMA };
const PLAY_JSON_FORMAT = '{"title":"...","logline":"...","scenes":[{"heading":"...","setting":"...","lines":[{"kind":"dialogue","speaker":"...","text":"..."},{"kind":"action","text":"..."}]}],"epilogue":"..."}';

export function buildAdaptPrompt(state: OmphalosWorldState, m: TheaterMaterial, style: PlayStyle, length: PlayLength) {
  const system = `你是《崩坏：星穹铁道》翁法罗斯篇的同人剧作者。你将根据一段多代理仿真的真实记录，写一出中文小剧场。
要求：
- 情节必须建立在记录中真实发生的事件与对话之上：可以补充心理、细节、舞台说明与幕间过渡，可以重新组织顺序，但不得改变事件的结果，不得让角色做记录中没有发生的关键行动
- 角色的性格与说话方式必须贴合角色表；台词口语化、简短，不使用表情符号
- 记录中的原话可以润色后化用
- 风格：${STYLE_GUIDE[style]}
- 篇幅：${LENGTH_GUIDE[length]}
- 行的种类：dialogue（台词，须给出 speaker）、action（动作与舞台说明）、narration（旁白）`;
  const cast = m.cast.map(c => state.agents[c.id]).filter(Boolean).map(a => `- ${persona(a)}`).join('\n');
  const records = m.logs.map(l => l.type === 'chat'
    ? `D${l.day}${l.location ? `@${l.location}` : ''} ${speakerOf(state, l.agentId)}→${speakerOf(state, l.targetId)}：「${chatContent(l)}」`
    : `D${l.day}${l.location ? `@${l.location}` : ''} ${l.message}`).join('\n');
  const { era, dayFrom, dayTo } = m.scope;
  const user = `【主要角色】\n${cast || '（由记录决定）'}\n\n【仿真记录：第${era}纪元 第${dayFrom}~${dayTo}天】\n${records || '（这段时间几乎无事发生，请据此写一出安静的小品）'}`;
  return { system, user };
}

function normalizePlay(raw: any): Pick<Play, 'title' | 'logline' | 'scenes' | 'epilogue'> {
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const scenes: PlayScene[] = (Array.isArray(raw?.scenes) ? raw.scenes : []).slice(0, 8).map((sc: any, i: number) => ({
    heading: str(sc?.heading, 60) || `第${i + 1}幕`,
    setting: str(sc?.setting, 300) || undefined,
    lines: (Array.isArray(sc?.lines) ? sc.lines : []).slice(0, 60).map((ln: any): PlayLine => {
      const kind: LineKind = ln?.kind === 'dialogue' || ln?.kind === 'narration' ? ln.kind : 'action';
      const speaker = str(ln?.speaker, 30);
      return kind === 'dialogue' && speaker ? { kind, speaker, text: str(ln?.text, 400) } : { kind: kind === 'dialogue' ? 'action' : kind, text: str(ln?.text, 400) };
    }).filter((ln: PlayLine) => ln.text)
  })).filter((sc: PlayScene) => sc.lines.length);
  if (!scenes.length) throw new Error('模型没有写出任何一幕');
  return { title: str(raw?.title, 40) || '无题', logline: str(raw?.logline, 160), scenes, epilogue: str(raw?.epilogue, 600) || undefined };
}

export async function adaptPlay(
  adapter: ProviderAdapter,
  state: OmphalosWorldState,
  m: TheaterMaterial,
  style: PlayStyle,
  length: PlayLength,
  signal?: AbortSignal
): Promise<Play> {
  const { system, user } = buildAdaptPrompt(state, m, style, length);
  const request = async (withTool: boolean) => {
    const res = await adapter.complete({
      system: withTool ? `${system}\n\n写完后调用 ${PLAY_TOOL.name} 工具提交剧本。` : `${system}\n\n只输出一个JSON对象，不要任何其他文字，格式：${PLAY_JSON_FORMAT}`,
      user,
      tool: withTool ? PLAY_TOOL : undefined,
      signal,
      timeoutMs: 300_000,
      maxTokens: 8000
    });
    if (res.refusal) throw new Error(`模型拒绝：${res.refusal}`);
    if (res.toolArgs !== undefined) return parseArgs(res.toolArgs);
    if (res.text.trim()) return extractJson(res.text);
    throw new Error('模型没有返回任何内容');
  };
  let raw: any;
  try {
    raw = await request(true);
  } catch (err) {
    if (signal?.aborted || !looksLikeToolUnsupported(err)) throw err;
    raw = await request(false);
  }
  const { era, dayFrom, dayTo } = m.scope;
  return {
    id: newId(),
    mode: 'adapt',
    style,
    model: adapter.model,
    createdAt: Date.now(),
    era, dayFrom, dayTo,
    cast: m.cast,
    ...normalizePlay(raw)
  };
}

// ---------------- 导出 ----------------
function metaLine(p: Play): string {
  const kind = p.mode === 'record' ? '实录' : `改编 · ${STYLE_LABEL[p.style ?? 'drama']}`;
  const cast = p.cast.map(c => c.name).join('、');
  return `第${p.era}纪元 · 第${p.dayFrom}—${p.dayTo}天 · ${kind}${cast ? ` · 出演：${cast}` : ''}`;
}

export function playToMarkdown(p: Play): string {
  const out = [`# ${p.title}`, ''];
  if (p.logline) out.push(`> ${p.logline}`, '');
  out.push(`*${metaLine(p)}*`, '');
  for (const sc of p.scenes) {
    out.push(`## ${sc.heading}`, '');
    if (sc.setting) out.push(`*${sc.setting}*`, '');
    for (const ln of sc.lines) {
      if (ln.kind === 'dialogue') out.push(`**${ln.speaker}**${ln.to ? `（对${ln.to}）` : ''}：${ln.text}`, '');
      else if (ln.kind === 'narration') out.push(`> ${ln.text}`, '');
      else out.push(`（${ln.text}）`, '');
    }
  }
  if (p.epilogue) out.push('---', '', `*${p.epilogue}*`, '');
  out.push('---', '', '*由「翁法罗斯」多代理仿真生成*');
  return out.join('\n');
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function playToHtml(p: Play): string {
  const scenes = p.scenes.map(sc => `
  <section class="scene">
    <h2>${esc(sc.heading)}</h2>
    ${sc.setting ? `<p class="setting">${esc(sc.setting)}</p>` : ''}
    ${sc.lines.map(ln => ln.kind === 'dialogue'
      ? `<p class="line"><b>${esc(ln.speaker ?? '')}</b>${ln.to ? `<small>对${esc(ln.to)}</small>` : ''}<span>${esc(ln.text)}</span></p>`
      : `<p class="${ln.kind}">${esc(ln.text)}</p>`).join('\n    ')}
  </section>`).join('\n');
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<style>
  :root { --bg: #0b1633; --panel: rgba(173, 216, 230, 0.06); --line: rgba(173, 216, 230, 0.28); --text: #d6f0fa; --muted: rgba(214, 240, 250, 0.6); --accent: #add8e6; }
  :root[data-theme="light"] { --bg: #f3f8fb; --panel: rgba(11, 22, 51, 0.04); --line: rgba(11, 22, 51, 0.2); --text: #0b1633; --muted: rgba(11, 22, 51, 0.6); --accent: #1f4f7a; }
  @media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) { --bg: #f3f8fb; --panel: rgba(11, 22, 51, 0.04); --line: rgba(11, 22, 51, 0.2); --text: #0b1633; --muted: rgba(11, 22, 51, 0.6); --accent: #1f4f7a; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.8 "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif; }
  main { max-width: 760px; margin: 0 auto; padding: 48px 16px 64px; }
  header { border-bottom: 1px solid var(--line); padding-bottom: 18px; margin-bottom: 28px; }
  h1 { font-size: 32px; line-height: 1.3; margin: 0 0 10px; letter-spacing: 0.04em; }
  .logline { margin: 0 0 8px; font-size: 17px; }
  .meta { color: var(--muted); font-size: 13px; margin: 0; }
  .scene { margin: 0 0 32px; }
  h2 { font-size: 19px; margin: 0 0 10px; padding: 4px 12px; border-left: 4px solid var(--accent); background: var(--panel); }
  .setting { color: var(--muted); font-style: italic; margin: 0 0 14px; }
  p { margin: 0 0 10px; }
  .line { display: grid; grid-template-columns: 7em 1fr; column-gap: 12px; }
  .line b { text-align: right; color: var(--accent); }
  .line small { grid-column: 1; grid-row: 2; text-align: right; color: var(--muted); font-size: 12px; margin-top: -6px; }
  .line span { grid-column: 2; grid-row: 1 / span 2; }
  .action { color: var(--muted); padding-left: calc(7em + 12px); }
  .action::before { content: "（"; } .action::after { content: "）"; }
  .narration { border: 1px solid var(--line); background: var(--panel); padding: 8px 14px; }
  .epilogue { border-top: 1px solid var(--line); padding-top: 18px; font-style: italic; }
  footer { margin-top: 40px; color: var(--muted); font-size: 12px; text-align: center; }
  @media (max-width: 560px) { .line { grid-template-columns: 1fr; } .line b, .line small { text-align: left; } .line span, .line small { grid-column: 1; grid-row: auto; margin: 0; } .action { padding-left: 0; } }
</style>
</head>
<body>
<main>
  <header>
    <h1>${esc(p.title)}</h1>
    ${p.logline ? `<p class="logline">${esc(p.logline)}</p>` : ''}
    <p class="meta">${esc(metaLine(p))}</p>
  </header>
${scenes}
  ${p.epilogue ? `<p class="epilogue">${esc(p.epilogue)}</p>` : ''}
  <footer>由「翁法罗斯」多代理仿真生成</footer>
</main>
</body>
</html>
`;
}
