<template>
  <div class="theater">
    <!-- 阅读 -->
    <article v-if="current" class="reader">
      <div class="reader-bar">
        <button class="om-btn" @click="currentId = ''"><ArrowLeft :size="13" /> 剧目列表</button>
        <div class="om-line"></div>
        <button class="om-btn" @click="exportHtml(current)" title="导出为独立网页"><FileCode :size="13" /> HTML</button>
        <button class="om-btn" @click="exportMd(current)" title="导出为 Markdown"><FileText :size="13" /> Markdown</button>
        <button class="om-btn icon-only" @click="copy(current)" title="复制剧本文本"><Copy :size="13" /></button>
        <button class="om-btn icon-only" @click="remove(current)" title="删除"><Trash2 :size="13" /></button>
      </div>
      <header>
        <h2>{{ current.title }}</h2>
        <p v-if="current.logline" class="logline">{{ current.logline }}</p>
        <p class="om-muted meta">{{ metaOf(current) }}</p>
      </header>
      <section v-for="(sc, i) in current.scenes" :key="i" class="scene">
        <h3>{{ sc.heading }}</h3>
        <p v-if="sc.setting" class="setting">{{ sc.setting }}</p>
        <template v-for="(ln, j) in sc.lines" :key="j">
          <p v-if="ln.kind === 'dialogue'" class="line">
            <b>{{ ln.speaker }}</b><small v-if="ln.to">对{{ ln.to }}</small><span>{{ ln.text }}</span>
          </p>
          <p v-else :class="ln.kind">{{ ln.text }}</p>
        </template>
      </section>
      <p v-if="current.epilogue" class="epilogue">{{ current.epilogue }}</p>
    </article>

    <!-- 编排 -->
    <template v-else>
      <section class="om-inner composer">
        <div class="row">
          <label>纪元</label>
          <select v-model.number="era" class="om-input">
            <option v-for="e in eras" :key="e.era" :value="e.era">第{{ e.era }}纪元（{{ e.lastDay }}天）</option>
          </select>
          <label>天数</label>
          <input v-model.number="dayFrom" type="number" min="0" :max="lastDay" class="om-input num" />
          <span class="om-muted">至</span>
          <input v-model.number="dayTo" type="number" min="0" :max="lastDay" class="om-input num" />
          <button class="om-chip" @click="recent(3)">最近3天</button>
          <button class="om-chip" @click="recent(7)">最近7天</button>
          <button class="om-chip" @click="recent(Infinity)">整个纪元</button>
        </div>
        <div class="row">
          <label>主角</label>
          <button v-for="id in castIds" :key="id" class="om-chip active" @click="toggleCast(id)" title="移除">
            {{ nameOf(id) }} <X :size="11" />
          </button>
          <select v-if="castIds.length < 4" class="om-input" :value="''" @change="addCast(($event.target as HTMLSelectElement).value)">
            <option value="" disabled>添加角色…</option>
            <optgroup v-for="g in castGroups" :key="g.label" :label="g.label">
              <option v-for="a in g.agents" :key="a.id" :value="a.id">{{ a.name }}</option>
            </optgroup>
          </select>
          <span v-if="!castIds.length" class="om-muted hint">留空则按出场次数自动选角</span>
        </div>
        <div class="row">
          <label>风格</label>
          <button v-for="(label, k) in STYLE_LABEL" :key="k" class="om-chip" :class="{ active: style === k }" @click="style = k">{{ label }}</button>
          <label class="gap">篇幅</label>
          <button v-for="(label, k) in LENGTH_LABEL" :key="k" class="om-chip" :class="{ active: length === k }" @click="length = k">{{ label }}</button>
        </div>
        <p class="om-muted material">
          素材：{{ material.logs.length }} 条记录，其中对话 {{ material.chats }} 句{{ material.cast.length ? `；出演：${material.cast.map(c => c.name).join('、')}` : '' }}
        </p>
        <div class="actions">
          <button class="om-btn" :disabled="!material.logs.length || !!busy" @click="makeRecord" title="不调用模型，直接把真实对话与事件编成剧本">
            <ScrollText :size="14" /> 实录成剧
          </button>
          <button v-if="!busy" class="om-btn primary" :disabled="!material.logs.length" @click="makeAdapt" title="由模型根据真实记录改编">
            <Clapperboard :size="14" /> 改编成剧
          </button>
          <button v-else class="om-btn" @click="cancel"><Square :size="13" /> 停止改编</button>
          <span v-if="busy" class="om-muted"><Loader2 :size="13" class="spin" /> {{ busy }}</span>
          <span v-if="error" class="err"><AlertTriangle :size="13" /> {{ error }}</span>
        </div>
      </section>

      <h5><Drama :size="13" /> 剧目 <small class="om-muted">{{ plays.length }}</small></h5>
      <div class="plays">
        <button v-for="p in plays" :key="p.id" class="om-item play" @click="currentId = p.id">
          <div class="play-title">
            <b>{{ p.title }}</b>
            <span class="om-tag" :class="{ strong: p.mode === 'adapt' }">{{ p.mode === 'record' ? '实录' : STYLE_LABEL[p.style ?? 'drama'] }}</span>
          </div>
          <small class="om-muted">{{ metaOf(p) }}</small>
          <small v-if="p.logline" class="logline-sm">{{ p.logline }}</small>
        </button>
        <div v-if="!plays.length" class="om-empty">还没有剧目。选择一段时间与主角，把真实发生的故事编成一出小剧场。</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  AlertTriangle, ArrowLeft, Clapperboard, Copy, Drama, FileCode, FileText, Loader2, ScrollText, Square, Trash2, X
} from 'lucide-vue-next';
import type { OmphalosSimulation } from '../../core/llmSimulation';
import {
  LENGTH_LABEL, STYLE_LABEL, adaptPlay, collectMaterial, erasIn, playToHtml, playToMarkdown, recordPlay,
  type Play, type PlayLength, type PlayStyle
} from '../../core/theater';
import { useOpenAIStore } from '../../stores/openAIStore';
import { notificationService } from '../../services/notificationService';
import { downloadFile } from '../../services/worldStorage';
import { timeStamp } from '../../core/archive';
import { KIND_LABEL, saveTheaters, theaters } from './useSimulation';

const props = defineProps<{ sim: OmphalosSimulation; tick: number }>();

const openAIStore = useOpenAIStore();
const plays = computed(() => theaters.value);
const currentId = ref('');
const current = computed(() => plays.value.find(p => p.id === currentId.value) ?? null);

// ---------- 素材范围 ----------
const eras = computed(() => {
  void props.tick;
  const list = erasIn(props.sim.engine.chronicle);
  const s = props.sim.state;
  if (!list.some(e => e.era === s.era)) list.push({ era: s.era, lastDay: s.day });
  return list;
});
const era = ref(props.sim.state.era);
const lastDay = computed(() => eras.value.find(e => e.era === era.value)?.lastDay ?? 0);
const dayFrom = ref(Math.max(0, props.sim.state.day - 4));
const dayTo = ref(props.sim.state.day);
const recent = (n: number) => {
  dayTo.value = lastDay.value;
  dayFrom.value = n === Infinity ? 0 : Math.max(0, lastDay.value - n + 1);
};
watch(era, () => recent(5));

const castIds = ref<string[]>([]);
const nameOf = (id: string) => props.sim.state.agents[id]?.name ?? id;
const toggleCast = (id: string) => { castIds.value = castIds.value.filter(x => x !== id); };
const addCast = (id: string) => { if (id && !castIds.value.includes(id)) castIds.value = [...castIds.value, id]; };
const castGroups = computed(() => {
  const agents = Object.values(props.sim.state.agents).filter(a => !castIds.value.includes(a.id));
  return (['heir', 'titan', 'npc', 'enemy'] as const)
    .map(kind => ({ label: KIND_LABEL[kind], agents: agents.filter(a => a.kind === kind) }))
    .filter(g => g.agents.length);
});

const style = ref<PlayStyle>('drama');
const length = ref<PlayLength>('short');

const material = computed(() => {
  void props.tick;
  const from = Math.min(dayFrom.value || 0, dayTo.value || 0);
  const to = Math.max(dayFrom.value || 0, dayTo.value || 0);
  return collectMaterial(props.sim.state, props.sim.engine.chronicle, { era: era.value, dayFrom: from, dayTo: to, castIds: castIds.value });
});

// ---------- 生成 ----------
const busy = ref('');
const error = ref('');
let abort: AbortController | null = null;

const add = async (play: Play) => {
  await saveTheaters([play, ...plays.value]);
  currentId.value = play.id;
};

const makeRecord = () => {
  error.value = '';
  void add(recordPlay(props.sim.state, material.value));
};

const makeAdapt = async () => {
  error.value = '';
  const adapter = openAIStore.getAdapter();
  if (!adapter || !openAIStore.isConnected) {
    error.value = '请先在「因果矩阵」中配置并测试模型连接';
    return;
  }
  abort = new AbortController();
  busy.value = `${adapter.model} 正在执笔…`;
  try {
    const play = await adaptPlay(adapter, props.sim.state, material.value, style.value, length.value, abort.signal);
    await add(play);
    notificationService.showSuccess(`《${play.title}》已写成`);
  } catch (err: any) {
    if (!abort?.signal.aborted) error.value = `改编失败：${String(err?.message ?? err).slice(0, 120)}`;
  } finally {
    busy.value = '';
    abort = null;
  }
};

const cancel = () => abort?.abort();

// ---------- 剧目操作 ----------
const metaOf = (p: Play) => {
  const kind = p.mode === 'record' ? '实录' : `改编 · ${STYLE_LABEL[p.style ?? 'drama']}${p.model ? ` · ${p.model}` : ''}`;
  return `第${p.era}纪元 · 第${p.dayFrom}—${p.dayTo}天 · ${kind}${p.cast.length ? ` · ${p.cast.map(c => c.name).join('、')}` : ''}`;
};

const safeName = (p: Play) => `omphalos-play-era${p.era}-day${p.dayFrom}-${p.dayTo}-${timeStamp(new Date(p.createdAt))}`;
const exportHtml = (p: Play) => downloadFile(`${safeName(p)}.html`, playToHtml(p), 'text/html');
const exportMd = (p: Play) => downloadFile(`${safeName(p)}.md`, playToMarkdown(p), 'text/markdown');
const copy = async (p: Play) => {
  try {
    await navigator.clipboard.writeText(playToMarkdown(p));
    notificationService.showSuccess('剧本已复制');
  } catch {
    notificationService.showError('无法写入剪贴板', '复制失败');
  }
};
const remove = async (p: Play) => {
  if (!window.confirm(`删除《${p.title}》？`)) return;
  currentId.value = '';
  await saveTheaters(plays.value.filter(x => x.id !== p.id));
};
</script>

<style scoped>
.theater { font-size: 13px; }
.composer { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.row > label { color: var(--om-muted); font-size: 12px; min-width: 30px; }
.row > label.gap { margin-left: 10px; min-width: 0; }
.row select.om-input { max-width: 190px; }
.num { width: 64px; }
.hint { font-size: 12px; }
.material { margin: 0; font-size: 12px; }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.actions > span { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; }
.err { color: var(--om-text); }
h5 { display: flex; align-items: center; gap: 6px; margin: 4px 0 8px; font-size: 13px; font-weight: 600; }
.plays { display: flex; flex-direction: column; gap: 6px; }
.play { display: flex; flex-direction: column; align-items: stretch; gap: 3px; padding: 8px 12px; text-align: left; }
.play-title { display: flex; align-items: center; gap: 8px; }
.play-title b { font-size: 15px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.play small { font-size: 12px; }
.logline-sm { color: var(--om-text); opacity: 0.8; }

.reader { max-width: 820px; margin: 0 auto; }
.reader-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; position: sticky; top: 0; z-index: 1; background: var(--ui-fill-inner, #0d1330); padding: 2px 0 8px; }
.reader header { border-bottom: 1px solid var(--om-line-strong); padding-bottom: 12px; margin-bottom: 18px; }
.reader h2 { font-size: 24px; margin: 6px 0 6px; letter-spacing: 0.04em; }
.logline { margin: 0 0 4px; font-size: 15px; line-height: 1.7; }
.meta { margin: 0; font-size: 12px; }
.scene { margin-bottom: 22px; }
.scene h3 { font-size: 15px; margin: 0 0 8px; padding: 3px 10px; border-left: 3px solid var(--ui-select); background: rgba(173, 216, 230, 0.06); }
.setting { color: var(--om-muted); font-style: italic; margin: 0 0 10px; line-height: 1.7; }
.scene p { margin: 0 0 8px; line-height: 1.8; font-size: 14px; }
.line { display: grid; grid-template-columns: 6.5em 1fr; column-gap: 12px; }
.line b { text-align: right; font-weight: 600; }
.line small { grid-column: 1; grid-row: 2; text-align: right; color: var(--om-muted); font-size: 11px; margin-top: -4px; }
.line span { grid-column: 2; grid-row: 1 / span 2; }
.action { color: var(--om-muted); padding-left: calc(6.5em + 12px); }
.action::before { content: '（'; }
.action::after { content: '）'; }
.narration { border: 1px solid var(--om-line); background: rgba(173, 216, 230, 0.05); padding: 6px 12px; }
.epilogue { border-top: 1px solid var(--om-line-strong); padding-top: 12px; font-style: italic; line-height: 1.8; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) {
  .line { grid-template-columns: 1fr; }
  .line b, .line small { text-align: left; }
  .line span, .line small { grid-column: 1; grid-row: auto; margin: 0; }
  .action { padding-left: 0; }
}
</style>
