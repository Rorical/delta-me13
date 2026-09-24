<template>
  <div class="ws om-root" role="dialog" aria-label="翁法罗斯仿真">
    <!-- 顶栏：返回、标题、状态、控制 -->
    <header class="ws-head">
      <button class="om-btn" @click="$emit('close')" title="返回档案 (Esc)"><ArrowLeft :size="15" /> 返回档案</button>
      <div class="brand">
        <h1>翁法罗斯 · 逐火之旅</h1>
        <div class="status"><span class="om-dot" :class="{ live: status === 'running' }"></span>{{ statusText }}</div>
      </div>
      <div class="controls">
        <button v-if="status !== 'running'" class="om-btn primary" :disabled="status === 'stopping'" @click="start">
          <Play :size="14" /> {{ status === 'paused' ? '继续' : '启动仿真' }}
        </button>
        <button v-else class="om-btn" @click="sim.pause()"><Pause :size="14" /> 暂停</button>
        <button class="om-btn" :disabled="busy" @click="step" title="仅推进一天"><StepForward :size="14" /> 单步</button>
        <button class="om-btn" :disabled="status === 'idle'" @click="sim.stop()"><Square :size="14" /> 停止</button>
        <button class="om-btn" :disabled="busy" @click="reset"><RotateCcw :size="14" /> 重置</button>
        <button class="om-btn icon-only" :class="{ primary: showSettings }" @click="showSettings = !showSettings" title="仿真参数"><Settings :size="15" /></button>
      </div>
    </header>

    <div class="om-bar progress" :class="{ idle: !(status === 'running' && view.progress.total) }">
      <i :style="{ width: (view.progress.total ? view.progress.done / view.progress.total * 100 : 0) + '%' }"></i>
    </div>

    <!-- 指标条 -->
    <div class="kpis">
      <div class="kpi"><label><InfinityIcon :size="12" /> 纪元</label><b>{{ view.era }}</b></div>
      <div class="kpi"><label><Sun :size="12" /> 天数</label><b>{{ view.day }}</b><small>累计 {{ view.totalDays }}</small></div>
      <div class="kpi wide"><label><Flame :size="12" /> 火种归还</label><b>{{ view.returned }}/12</b><small>已取得 {{ view.embers }}</small>
        <div class="om-bar"><i :style="{ width: view.returned / 12 * 100 + '%' }"></i></div></div>
      <div class="kpi wide"><label><Waves :size="12" /> 黑潮</label><b>{{ view.tide.toFixed(1) }}%</b><small>{{ tideLabel(view.tide) }}</small>
        <div class="om-bar" :class="{ hazard: view.tide >= 45 }"><i :style="{ width: view.tide + '%' }"></i></div></div>
      <div class="kpi"><label><Activity :size="12" /> 稳定度</label><b>{{ view.stability.toFixed(0) }}</b></div>
      <div class="kpi"><label><Cpu :size="12" /> 模型调用</label><b>{{ view.ai.calls }}</b><small>{{ view.ai.failures }} 失败 · {{ view.ai.avgMs }}ms</small></div>
    </div>

    <div v-if="!openAIStore.isConnected" class="notice"><Info :size="14" /> 因果矩阵未连接 —— 请先在「再创世 / 因果矩阵」中配置模型端点与密钥。</div>
    <div v-if="sim.lastError" class="notice"><AlertTriangle :size="14" /> {{ sim.lastError }}</div>

    <section v-if="showSettings" class="om-panel settings">
      <label>并发请求 <input type="range" min="1" max="12" v-model.number="cfg.concurrency" /> <b>{{ cfg.concurrency }}</b></label>
      <label>居民活跃度 <input type="range" min="0" max="1" step="0.1" v-model.number="cfg.npcActivity" /> <b>{{ Math.round(cfg.npcActivity * 100) }}%</b></label>
      <label>每日间隔 <input type="range" min="0" max="5000" step="250" v-model.number="cfg.dayDelayMs" /> <b>{{ (cfg.dayDelayMs / 1000).toFixed(2) }}s</b></label>
      <label>居民数量 <input type="range" min="0" max="20" v-model.number="cfg.npcCount" /> <b>{{ cfg.npcCount }}</b></label>
      <label class="check"><input type="checkbox" v-model="cfg.replyPhase" /> 被搭话者当日回应（对话更生动，调用更多）</label>
      <p class="om-muted hint">每天约 {{ estimatedCalls }} 次模型调用；居民数量在重置后生效。</p>
    </section>

    <!-- 主体：名册 | 地图 + 日志 | 详情 -->
    <div class="ws-body">
      <aside class="om-panel col left">
        <div class="om-panel-header"><Users :size="16" /> 电信号 <div class="om-line"></div></div>
        <div class="scroll">
          <AgentRoster :sim="sim" :tick="tick" :selected-id="selectedAgent" @select="selectAgent" />
        </div>
      </aside>

      <main class="center">
        <section class="om-panel map-panel">
          <div class="om-panel-header">
            <MapIcon :size="16" /> 世界 <div class="om-line"></div>
            <small>点击城邦查看详情</small>
          </div>
          <WorldMap class="map" fill :state="sim.state" :tick="tick" :selected="focusCity" @select="selectCity" />
        </section>

        <section class="om-panel feed-panel">
          <div class="tabs">
            <button v-for="t in feedTabs" :key="t.id" class="om-chip" :class="{ active: feedTab === t.id }" @click="feedTab = t.id">
              <component :is="t.icon" :size="13" /> {{ t.label }}
            </button>
            <div class="om-line"></div>
          </div>
          <div class="scroll">
            <EventFeed v-if="feedTab === 'events'" :state="sim.state" :tick="tick" :agent-id="selectedAgent" @clear-agent="selectedAgent = ''" />
            <ChatFeed v-else-if="feedTab === 'chat'" :state="sim.state" :tick="tick" :agent-id="selectedAgent" @agent="selectAgent" />
            <AiLog v-else :state="sim.state" :tick="tick" />
          </div>
        </section>
      </main>

      <aside class="om-panel col right">
        <div class="tabs">
          <button class="om-chip" :class="{ active: sideTab === 'detail' }" @click="sideTab = 'detail'"><ScanSearch :size="13" /> 详情</button>
          <button class="om-chip" :class="{ active: sideTab === 'embers' }" @click="sideTab = 'embers'"><Flame :size="13" /> 火种与纪元</button>
          <div class="om-line"></div>
        </div>
        <div class="scroll">
          <template v-if="sideTab === 'detail'">
            <AgentDetail v-if="selectedAgent" :sim="sim" :tick="tick" :agent-id="selectedAgent" @close="selectedAgent = ''" @city="selectCity" />
            <CityDetail v-else :state="sim.state" :tick="tick" :city-id="selectedCity" @agent="selectAgent" @city="selectCity" />
          </template>
          <EmberBoard v-else :state="sim.state" :tick="tick" @agent="selectAgent" />
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import {
  Activity, AlertTriangle, ArrowLeft, Cpu, Flame, Info, Infinity as InfinityIcon, Map as MapIcon, MessageSquare,
  Pause, Play, RotateCcw, ScanSearch, ScrollText, Settings, Square, StepForward, Sun, Users, Waves
} from 'lucide-vue-next';
import { useOpenAIStore } from '../../stores/openAIStore';
import { notificationService } from '../../services/notificationService';
import { collectedEmberCount, returnedEmberCount } from '../../core/omphalosWorldState';
import WorldMap from './WorldMap.vue';
import AgentRoster from './AgentRoster.vue';
import AgentDetail from './AgentDetail.vue';
import CityDetail from './CityDetail.vue';
import EventFeed from './EventFeed.vue';
import ChatFeed from './ChatFeed.vue';
import AiLog from './AiLog.vue';
import EmberBoard from './EmberBoard.vue';
import { getSimulation, saveSimConfig, tideLabel, useSimTick } from './useSimulation';
import './sim.css';

const emit = defineEmits<{ (e: 'close'): void }>();

const openAIStore = useOpenAIStore();
const sim = getSimulation();
const tick = useSimTick(sim);

const showSettings = ref(false);
const selectedCity = ref('奥赫玛');
const selectedAgent = ref('');
const feedTab = ref<'events' | 'chat' | 'ai'>('events');
const sideTab = ref<'detail' | 'embers'>('detail');

const feedTabs = [
  { id: 'events' as const, label: '事件', icon: ScrollText },
  { id: 'chat' as const, label: '对话', icon: MessageSquare },
  { id: 'ai' as const, label: '因果矩阵', icon: Cpu }
];

const cfg = reactive({ ...sim.config });
watch(cfg, () => {
  sim.updateConfig({ ...cfg });
  saveSimConfig({ ...cfg });
});

const status = computed(() => { void tick.value; return sim.status; });
const busy = computed(() => status.value === 'running' || status.value === 'stopping');
const statusText = computed(() => {
  void tick.value;
  const p = sim.progress;
  const label = { idle: '待机', running: '运行中', paused: '已暂停', stopping: '正在停止' }[sim.status];
  if (p.total) return `${label} · ${p.phase} ${p.done}/${p.total}`;
  return p.phase && !p.phase.includes(label) ? `${label} · ${p.phase}` : label;
});

const view = computed(() => {
  void tick.value;
  const s = sim.state;
  return {
    era: s.era,
    day: s.day,
    totalDays: s.totalDays,
    embers: collectedEmberCount(s),
    returned: returnedEmberCount(s),
    tide: s.darkTide.global,
    stability: s.worldStability,
    progress: { ...sim.progress },
    ai: { calls: s.ai.calls, failures: s.ai.failures, avgMs: s.ai.calls ? Math.round(s.ai.totalMs / s.ai.calls) : 0 }
  };
});

const estimatedCalls = computed(() => {
  const heirs = Object.values(sim.state.agents).filter(a => a.kind === 'heir').length;
  const base = heirs + cfg.npcCount * cfg.npcActivity + 3;
  return `${Math.round(base)}–${Math.round(base * (cfg.replyPhase ? 1.6 : 1.1))}`;
});

// 选中人物时，地图高亮其所在城邦
const focusCity = computed(() => {
  void tick.value;
  return selectedAgent.value ? sim.state.agents[selectedAgent.value]?.location ?? selectedCity.value : selectedCity.value;
});

const selectAgent = (id: string) => {
  selectedAgent.value = id;
  if (id) sideTab.value = 'detail';
};

const selectCity = (id: string) => {
  selectedCity.value = id;
  selectedAgent.value = '';
  sideTab.value = 'detail';
};

const ensureConnected = (): boolean => {
  if (!openAIStore.isConfigured() || !openAIStore.isConnected) {
    notificationService.showError('请先配置并连接因果矩阵（模型端点、密钥与模型）。', '配置错误');
    return false;
  }
  const client = openAIStore.getClient();
  if (!client) {
    notificationService.showError('无法获取因果矩阵客户端，请检查配置。', '连接错误');
    return false;
  }
  sim.connect(client, {
    model: openAIStore.settings.selectedModel,
    temperature: Number(openAIStore.settings.temperature) || 0.7,
    timeoutMs: 90_000
  });
  return true;
};

const start = () => { if (ensureConnected()) void sim.start(); };
const step = () => { if (ensureConnected()) void sim.step(); };
const reset = () => {
  sim.reset();
  selectedAgent.value = '';
};

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close');
};

onMounted(() => {
  document.addEventListener('keydown', onKey);
  document.body.style.overflow = 'hidden';
  if (openAIStore.isConfigured() && !openAIStore.isConnected) void openAIStore.testConnection();
});
onUnmounted(() => {
  document.removeEventListener('keydown', onKey);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.ws {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 18px 16px;
  box-sizing: border-box;
  font-size: 13px;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(0, 212, 255, 0.08) 0%, transparent 55%),
    linear-gradient(135deg, #0a0e27 0%, #141a36 50%, #0d1220 100%);
}

.ws-head { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.brand { display: flex; align-items: baseline; gap: 16px; flex: 1; min-width: 200px; flex-wrap: wrap; }
.brand h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 1px; text-shadow: 0 0 12px rgba(173, 216, 230, 0.35); white-space: nowrap; }
.status { display: flex; align-items: center; gap: 8px; color: var(--om-muted); }
.controls { display: flex; gap: 6px; flex-wrap: wrap; }

.progress { height: 3px; border: none; }
.progress.idle i { width: 0 !important; }

.kpis { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
.kpi { border: 1px solid var(--om-line-strong); background: var(--om-fill); padding: 6px 12px; display: grid; grid-template-columns: auto 1fr; grid-template-areas: 'label label' 'value sub' 'bar bar'; align-items: baseline; column-gap: 8px; min-width: 0; }
.kpi label { grid-area: label; display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--om-muted); }
.kpi b { grid-area: value; font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
.kpi small { grid-area: sub; font-size: 11px; color: var(--om-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kpi .om-bar { grid-area: bar; margin-top: 3px; }

.notice { display: flex; align-items: center; gap: 8px; padding: 7px 12px; border: 1px solid var(--om-line-strong); border-left: 4px solid var(--ui-select); background: var(--ui-fill-inner); }

.settings { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 8px 20px; }
.settings label { display: flex; align-items: center; gap: 8px; color: var(--om-muted); }
.settings input[type='range'] { flex: 1; accent-color: rgba(173, 216, 230, 0.9); }
.settings b { color: var(--om-text); min-width: 42px; text-align: right; font-weight: normal; }
.settings .check { grid-column: 1 / -1; }
.hint { grid-column: 1 / -1; margin: 0; font-size: 11px; }

.ws-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 380px;
  gap: 10px;
}

.col, .map-panel, .feed-panel { display: flex; flex-direction: column; min-height: 0; }
.center { display: grid; grid-template-rows: minmax(0, 1.45fr) minmax(0, 1fr); gap: 10px; min-height: 0; }
.scroll { flex: 1; min-height: 0; overflow-y: auto; padding-right: 4px; }
.map { flex: 1; min-height: 0; }

.tabs { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; }
.tabs .om-line { flex: 1; height: 1px; background: var(--om-line-strong); margin-left: 6px; }

.scroll::-webkit-scrollbar { width: 6px; }
.scroll::-webkit-scrollbar-thumb { background: rgba(173, 216, 230, 0.25); }

@media (max-width: 1280px) {
  .ws-body { grid-template-columns: 260px minmax(0, 1fr) 330px; }
  .kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

/* 窄屏：整页滚动，分栏纵向堆叠 */
@media (max-width: 960px) {
  .ws { overflow-y: auto; padding: 12px; }
  .ws-body { display: flex; flex-direction: column; flex: none; }
  .center { display: flex; flex-direction: column; order: 1; }
  .col.left { order: 2; }
  .col.right { order: 3; }
  .map-panel { height: 70vw; min-height: 280px; }
  .feed-panel, .col.left { max-height: 70vh; }
  .col.right { max-height: none; }
  .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .brand h1 { font-size: 18px; }
}
</style>
