<template>
  <!-- 外层面板带有 transform/backdrop-filter，会困住 position:fixed，全屏时传送到 body -->
  <Teleport to="body" :disabled="!expanded">
  <div class="omphalos-system om-root" :class="{ expanded }">
    <!-- 顶栏：与首页「实验档案 / 进程」一致 -->
    <header class="top">
      <div class="section-label">
        <span>翁法罗斯 · 逐火之旅</span>
        <div class="label-underline"></div>
      </div>
      <div class="status">
        <span class="om-dot" :class="{ live: status === 'running' }"></span>
        {{ statusText }}
      </div>
    </header>

    <div class="controls">
      <button v-if="status !== 'running'" class="om-btn primary" :disabled="status === 'stopping'" @click="start">
        <Play :size="14" /> {{ status === 'paused' ? '继续' : '启动仿真' }}
      </button>
      <button v-else class="om-btn" @click="sim.pause()"><Pause :size="14" /> 暂停</button>
      <button class="om-btn" :disabled="status === 'running' || status === 'stopping'" @click="step" title="仅推进一天">
        <StepForward :size="14" /> 单步
      </button>
      <button class="om-btn" :disabled="status === 'idle'" @click="sim.stop()"><Square :size="14" /> 停止</button>
      <button class="om-btn" :disabled="status === 'running' || status === 'stopping'" @click="reset"><RotateCcw :size="14" /> 重置</button>
      <span class="spacer"></span>
      <button class="om-btn icon-only" :class="{ primary: showSettings }" @click="showSettings = !showSettings" title="仿真参数">
        <Settings :size="15" />
      </button>
      <button class="om-btn icon-only" @click="expanded = !expanded" :title="expanded ? '收起 (Esc)' : '全屏展开'">
        <component :is="expanded ? Minimize2 : Maximize2" :size="15" />
      </button>
    </div>

    <div class="om-bar progress" v-if="status === 'running' && view.progress.total > 0">
      <i :style="{ width: (view.progress.done / view.progress.total * 100) + '%' }"></i>
    </div>

    <div v-if="!openAIStore.isConnected" class="notice"><Info :size="14" /> 因果矩阵未连接 —— 请先在「再创世 / 因果矩阵」中配置模型端点与密钥。</div>
    <div v-if="sim.lastError" class="notice"><AlertTriangle :size="14" /> {{ sim.lastError }}</div>

    <!-- 参数 -->
    <section v-if="showSettings" class="om-panel settings">
      <div class="om-panel-header"><Settings :size="16" /> 仿真参数 <div class="om-line"></div></div>
      <div class="settings-grid">
        <label>并发请求 <input type="range" min="1" max="12" v-model.number="cfg.concurrency" /> <b>{{ cfg.concurrency }}</b></label>
        <label>居民活跃度 <input type="range" min="0" max="1" step="0.1" v-model.number="cfg.npcActivity" /> <b>{{ Math.round(cfg.npcActivity * 100) }}%</b></label>
        <label>每日间隔 <input type="range" min="0" max="5000" step="250" v-model.number="cfg.dayDelayMs" /> <b>{{ (cfg.dayDelayMs / 1000).toFixed(2) }}s</b></label>
        <label>居民数量 <input type="range" min="0" max="20" v-model.number="cfg.npcCount" /> <b>{{ cfg.npcCount }}</b></label>
        <label class="check"><input type="checkbox" v-model="cfg.replyPhase" /> 被搭话者当日回应（对话更生动，调用更多）</label>
      </div>
      <p class="om-muted hint">每天约 {{ estimatedCalls }} 次模型调用；居民数量在重置后生效。</p>
    </section>

    <!-- 指标 -->
    <div class="kpis">
      <div class="kpi"><label><InfinityIcon :size="12" /> 纪元</label><b>{{ view.era }}</b></div>
      <div class="kpi"><label><Sun :size="12" /> 天数</label><b>{{ view.day }}</b><small>累计 {{ view.totalDays }}</small></div>
      <div class="kpi"><label><Flame :size="12" /> 火种归还</label><b>{{ view.returned }}/12</b><small>已取得 {{ view.embers }}</small>
        <div class="om-bar"><i :style="{ width: view.returned / 12 * 100 + '%' }"></i></div></div>
      <div class="kpi"><label><Waves :size="12" /> 黑潮</label><b>{{ view.tide.toFixed(1) }}%</b><small>{{ tideLabel(view.tide) }}</small>
        <div class="om-bar" :class="{ hazard: view.tide >= 45 }"><i :style="{ width: view.tide + '%' }"></i></div></div>
      <div class="kpi"><label><Activity :size="12" /> 稳定度</label><b>{{ view.stability.toFixed(0) }}</b></div>
      <div class="kpi"><label><Cpu :size="12" /> 模型调用</label><b>{{ view.ai.calls }}</b><small>{{ view.ai.failures }} 失败 · {{ view.ai.avgMs }}ms</small></div>
    </div>

    <!-- 标签页：与首页文件夹一致的方块按钮 -->
    <nav class="tabs">
      <button v-for="t in tabs" :key="t.id" class="om-item tab" :class="{ active: tab === t.id }" @click="tab = t.id">
        <component :is="t.icon" :size="15" />
        <span>{{ t.label }}</span>
        <small v-if="t.badge">{{ t.badge }}</small>
      </button>
    </nav>

    <main class="tab-body">
      <!-- 世界 -->
      <div v-if="tab === 'world'" class="world-tab">
        <section class="om-panel">
          <div class="om-panel-header"><MapIcon :size="16" /> 翁法罗斯 <div class="om-line"></div></div>
          <WorldMap :state="sim.state" :tick="tick" :selected="selectedCity" @select="id => selectedCity = id" />
        </section>
        <section v-if="city" class="om-panel city-card">
          <div class="om-panel-header">
            <Castle :size="16" /> {{ city.name }} <small>{{ city.type }}</small>
            <div class="om-line"></div>
            <span class="om-tag" :class="{ strong: city.darkTide >= 45 }"><Waves :size="11" />{{ city.darkTide.toFixed(1) }}% · {{ city.fallen ? '已沦陷' : tideLabel(city.darkTide) }}</span>
          </div>
          <p class="desc">{{ city.description }}</p>
          <div class="om-bar" :class="{ hazard: city.darkTide >= 45 }"><i :style="{ width: city.darkTide + '%' }"></i></div>
          <dl class="city-stats">
            <dt>人口</dt><dd>{{ city.population.toLocaleString() }}</dd>
            <dt>繁荣</dt><dd>{{ city.prosperity }}</dd>
            <dt>城防</dt><dd>城墙 {{ city.walls }} · 瞭望塔 {{ city.watchtowers }}</dd>
            <dt>库存</dt><dd>食物 {{ city.resources.food }} · 材料 {{ city.resources.materials }} · 魔力 {{ city.resources.mana }}</dd>
          </dl>
          <div v-for="t in city.titans" :key="t.id" class="om-item titan" @click="openAgent(t.id)">
            <Crown :size="14" />
            <div>
              <div class="titan-name">{{ t.subtitle }}</div>
              <div class="om-muted small">
                {{ DISPOSITION_LABEL[t.disposition] }} · HP {{ t.hp }}/{{ t.maxHp }} ·
                {{ t.condition === 'fallen' ? '已陨落' : t.emberTaken ? '火种已被取走' : '守护着火种' }}
              </div>
            </div>
          </div>
          <h5><Users :size="12" /> 此地之人</h5>
          <div class="present">
            <button v-for="a in city.present" :key="a.id" class="om-item person" :class="{ active: a.kind === 'heir' }" @click="openAgent(a.id)">
              {{ a.name }}<small>{{ a.subtitle }}</small>
            </button>
            <span v-if="!city.present.length" class="om-muted small">此地空无一人</span>
          </div>
        </section>
      </div>

      <!-- 电信号 -->
      <AgentPanel v-else-if="tab === 'agents'" :sim="sim" :tick="tick" :selected-id="selectedAgent"
        @select="id => selectedAgent = id" />

      <!-- 事件 -->
      <EventFeed v-else-if="tab === 'events'" :state="sim.state" :tick="tick" :agent-id="selectedAgent"
        @clear-agent="selectedAgent = ''" />

      <!-- 对话 -->
      <section v-else-if="tab === 'chat'" class="om-panel">
        <div class="om-panel-header"><MessageSquare :size="16" /> 对话记录 <div class="om-line"></div></div>
        <div class="chat-list">
          <div v-for="m in chats" :key="m.id" class="bubble" :class="m.fromKind">
            <div class="bubble-head">
              <component :is="kindIcon[m.fromKind]" :size="12" />
              <b @click="openAgent(m.from)">{{ m.fromName }}</b>
              <ArrowRight :size="11" />
              <span @click="openAgent(m.to)">{{ m.toName }}</span>
              <small>E{{ m.era }}·D{{ m.day }} · {{ m.location }}</small>
            </div>
            <div class="bubble-body">「{{ m.content }}」</div>
          </div>
          <div v-if="!chats.length" class="om-empty">还没有人开口说话</div>
        </div>
      </section>

      <!-- 纪元 -->
      <div v-else-if="tab === 'era'" class="era-tab">
        <section class="om-panel">
          <div class="om-panel-header"><Flame :size="16" /> 十二火种 <div class="om-line"></div><small>实心：已归还</small></div>
          <div class="ember-grid">
            <div v-for="e in embers" :key="e.id" class="ember-cell" :class="e.state">
              <svg viewBox="-2 -2 4 4" class="ember-glyph"><path d="M0,-1.8 L1.4,0 L0,1.8 L-1.4,0 Z" /></svg>
              <div>
                <b>{{ e.name }}</b>
                <small>{{ e.state === 'returned' ? `已由${e.holder}归还` : e.state === 'held' ? `${e.holder} 携带中` : `「${e.titanTitle}」${e.titan}守护中` }}</small>
              </div>
            </div>
          </div>
        </section>
        <section class="om-panel">
          <div class="om-panel-header"><InfinityIcon :size="16" /> 永劫回归 <div class="om-line"></div></div>
          <ol class="eras">
            <li v-for="r in eraHistory" :key="r.era">
              <b>第{{ r.era }}纪元</b> · {{ r.days }}天 · 火种归还 {{ r.embers }}/12 · {{ r.outcome === 'recreation' ? '再创世' : '黑潮吞没' }}
              <div class="om-muted">{{ r.summary }}</div>
            </li>
            <li v-if="!eraHistory.length" class="om-muted">这是第一个纪元。十二火种尽数归还创世涡心即完成再创世；若黑潮吞没世界，永劫回归将再度开启。</li>
          </ol>
        </section>
      </div>

      <!-- AI -->
      <section v-else-if="tab === 'ai'" class="om-panel">
        <div class="om-panel-header"><Cpu :size="16" /> 因果矩阵调用 <div class="om-line"></div></div>
        <div class="ai-stats om-muted">
          <span>调用 {{ view.ai.calls }}</span>
          <span>失败 {{ view.ai.failures }}</span>
          <span>平均 {{ view.ai.avgMs }}ms</span>
          <span>输入 {{ view.ai.promptTokens.toLocaleString() }} tok</span>
          <span>输出 {{ view.ai.completionTokens.toLocaleString() }} tok</span>
        </div>
        <table class="ai-table">
          <thead><tr><th>天</th><th>电信号</th><th>耗时</th><th>Token</th><th>结果</th></tr></thead>
          <tbody>
            <tr v-for="r in aiRecent" :key="r.id" :class="{ fail: !r.ok }">
              <td>{{ r.day }}</td>
              <td>{{ r.agent }}</td>
              <td>{{ r.ms }}ms</td>
              <td>{{ r.promptTokens }}+{{ r.completionTokens }}</td>
              <td class="preview"><AlertTriangle v-if="!r.ok" :size="11" /> {{ r.ok ? r.preview : r.error }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="!aiRecent.length" class="om-empty">暂无调用记录</div>
      </section>
    </main>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import {
  Activity, AlertTriangle, ArrowRight, Castle, Cpu, Crown, Flame, Globe, Info, Infinity as InfinityIcon, Map as MapIcon,
  Maximize2, MessageSquare, Minimize2, Pause, Play, RotateCcw, ScrollText, Settings, Sparkles, Square, StepForward,
  Sun, User, Users, Waves
} from 'lucide-vue-next';
import { useOpenAIStore } from '../stores/openAIStore';
import { notificationService } from '../services/notificationService';
import { collectedEmberCount, isTitan, returnedEmberCount, type TitanStatus } from '../core/omphalosWorldState';
import { getTitanProfile } from '../core/agent/titanProfiles';
import WorldMap from './sim/WorldMap.vue';
import AgentPanel from './sim/AgentPanel.vue';
import EventFeed from './sim/EventFeed.vue';
import { DISPOSITION_LABEL, getSimulation, saveSimConfig, tideLabel, useSimTick } from './sim/useSimulation';
import './sim/sim.css';

const openAIStore = useOpenAIStore();
const sim = getSimulation();
const tick = useSimTick(sim);

const expanded = ref(false);
const showSettings = ref(false);
const tab = ref<'world' | 'agents' | 'events' | 'chat' | 'era' | 'ai'>('world');
const selectedCity = ref('奥赫玛');
const selectedAgent = ref('');
const kindIcon: Record<string, unknown> = { heir: Sparkles, titan: Crown, npc: User };

const cfg = reactive({ ...sim.config });
watch(cfg, () => {
  sim.updateConfig({ ...cfg });
  saveSimConfig({ ...cfg });
});

const status = computed(() => { void tick.value; return sim.status; });
const statusText = computed(() => {
  void tick.value;
  const p = sim.progress;
  const label = { idle: '待机', running: '运行中', paused: '已暂停', stopping: '正在停止' }[sim.status];
  if (p.total) return `进程：${label} · ${p.phase} ${p.done}/${p.total}`;
  return p.phase && !p.phase.includes(label) ? `进程：${label} · ${p.phase}` : `进程：${label}`;
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
    ai: {
      calls: s.ai.calls,
      failures: s.ai.failures,
      promptTokens: s.ai.promptTokens,
      completionTokens: s.ai.completionTokens,
      avgMs: s.ai.calls ? Math.round(s.ai.totalMs / s.ai.calls) : 0
    }
  };
});

const estimatedCalls = computed(() => {
  const heirs = Object.values(sim.state.agents).filter(a => a.kind === 'heir').length;
  const base = heirs + cfg.npcCount * cfg.npcActivity + 3;
  return `${Math.round(base)}–${Math.round(base * (cfg.replyPhase ? 1.6 : 1.1))}`;
});

const city = computed(() => {
  void tick.value;
  const c = sim.state.cities[selectedCity.value];
  if (!c) return null;
  return {
    ...c,
    titans: c.titanIds.map(id => sim.state.agents[id] as TitanStatus).filter(Boolean),
    present: Object.values(sim.state.agents)
      .filter(a => a.location === c.id && !isTitan(a))
      .map(a => ({ id: a.id, name: a.name, kind: a.kind, subtitle: a.subtitle }))
  };
});

const chats = computed(() => {
  void tick.value;
  const s = sim.state;
  return s.messages.slice(-120).reverse().map(m => ({
    ...m,
    fromName: s.agents[m.from]?.name ?? m.from,
    toName: s.agents[m.to]?.name ?? m.to,
    fromKind: s.agents[m.from]?.kind ?? 'npc'
  }));
});

const embers = computed(() => {
  void tick.value;
  const s = sim.state;
  return Object.values(s.embers).map(e => ({
    id: e.id,
    name: e.name,
    state: e.returned ? 'returned' : e.holderId ? 'held' : 'guarded',
    holder: e.holderId ? s.agents[e.holderId]?.name : '',
    titan: s.agents[e.titanId]?.name ?? '',
    titanTitle: getTitanProfile(e.titanId)?.title ?? ''
  }));
});

const eraHistory = computed(() => { void tick.value; return [...sim.state.eraHistory].reverse(); });

const aiRecent = computed(() => {
  void tick.value;
  const s = sim.state;
  return s.ai.recent.slice().reverse().map(r => ({ ...r, agent: s.agents[r.agentId]?.name ?? r.agentId }));
});

const tabs = computed(() => [
  { id: 'world' as const, label: '世界', icon: Globe },
  { id: 'agents' as const, label: '电信号', icon: Users },
  { id: 'events' as const, label: '事件', icon: ScrollText },
  { id: 'chat' as const, label: '对话', icon: MessageSquare, badge: chats.value.length ? String(Math.min(chats.value.length, 99)) : '' },
  { id: 'era' as const, label: '纪元', icon: InfinityIcon },
  { id: 'ai' as const, label: '因果矩阵', icon: Cpu }
]);

const openAgent = (id: string) => {
  selectedAgent.value = id;
  tab.value = 'agents';
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

const start = () => {
  if (!ensureConnected()) return;
  void sim.start();
};

const step = () => {
  if (!ensureConnected()) return;
  void sim.step();
};

const reset = () => {
  sim.reset();
  selectedAgent.value = '';
};

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && expanded.value) expanded.value = false;
};

onMounted(() => {
  document.addEventListener('keydown', onKey);
  if (openAIStore.isConfigured() && !openAIStore.isConnected) void openAIStore.testConnection();
});
onUnmounted(() => document.removeEventListener('keydown', onKey));
</script>

<style scoped>
.omphalos-system {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-size: 13px;
  padding: 2px 4px 16px 2px;
  box-sizing: border-box;
}
.omphalos-system.expanded {
  position: fixed;
  inset: 0;
  z-index: 5000;
  padding: 20px max(20px, calc((100vw - 1400px) / 2));
  background:
    radial-gradient(ellipse at center, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%);
}

.top { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.section-label { position: relative; font-size: 18px; font-weight: bold; padding-bottom: 5px; }
.label-underline { position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background: linear-gradient(90deg, rgba(173, 216, 230, 0.6), transparent); }
.status { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--om-muted); }

.controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.spacer { flex: 1; }
.progress { margin-top: -6px; }

.notice { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 8px 12px; border: 1px dashed rgba(173, 216, 230, 0.4); border-radius: 4px; color: var(--om-text); }

.settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px 18px; }
.settings-grid label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--om-muted); }
.settings-grid input[type='range'] { flex: 1; accent-color: rgba(173, 216, 230, 0.9); }
.settings-grid b { color: var(--om-text); min-width: 42px; text-align: right; font-weight: normal; }
.settings-grid .check { grid-column: 1 / -1; }
.hint { margin: 10px 0 0; font-size: 11px; }

.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
.kpi { border: 1px solid var(--om-line); background: var(--om-fill); border-radius: 4px; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.kpi label { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--om-muted); }
.kpi b { font-size: 20px; font-variant-numeric: tabular-nums; text-shadow: 0 0 8px rgba(173, 216, 230, 0.35); }
.kpi small { font-size: 10px; color: var(--om-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kpi .om-bar { margin-top: 4px; }

.tabs { display: grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); gap: 8px; }
.tab { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; font-size: 12px; }
.tab.active { transform: translateY(-2px); }
.tab small { position: absolute; top: 4px; right: 6px; font-size: 10px; color: var(--om-muted); }

.world-tab { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 14px; align-items: start; }
@media (max-width: 1000px) { .world-tab { grid-template-columns: 1fr; } }
.desc { font-size: 12px; color: var(--om-muted); line-height: 1.7; margin: 0 0 10px; }
.city-stats { display: grid; grid-template-columns: 40px 1fr; gap: 4px 8px; font-size: 12px; margin: 12px 0; }
.city-stats dt { color: var(--om-muted); }
.city-stats dd { margin: 0; }
.titan { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; margin-bottom: 6px; }
.titan-name { font-weight: bold; }
.small { font-size: 11px; }
h5 { display: flex; align-items: center; gap: 5px; margin: 12px 0 6px; font-size: 12px; font-weight: normal; color: var(--om-muted); }
.present { display: flex; flex-wrap: wrap; gap: 6px; }
.person { padding: 4px 8px; font-size: 12px; display: flex; flex-direction: column; }
.person small { font-size: 10px; color: var(--om-muted); }

.chat-list { display: flex; flex-direction: column; gap: 8px; }
.bubble { border: 1px solid rgba(173, 216, 230, 0.08); border-left: 2px solid rgba(173, 216, 230, 0.3); border-radius: 4px; padding: 8px 12px; max-width: 760px; }
.bubble.heir { border-left-color: rgba(173, 216, 230, 0.8); }
.bubble.titan { border-left-color: rgba(173, 216, 230, 1); background: rgba(173, 216, 230, 0.05); }
.bubble-head { font-size: 11px; color: var(--om-muted); display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.bubble-head b, .bubble-head span { cursor: pointer; }
.bubble-head b { color: var(--om-text); }
.bubble-head small { margin-left: auto; color: var(--om-faint); }
.bubble-body { margin-top: 4px; line-height: 1.6; }

.era-tab { display: flex; flex-direction: column; gap: 14px; }
.ember-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; }
.ember-cell { display: flex; gap: 8px; align-items: center; border: 1px solid rgba(173, 216, 230, 0.08); border-radius: 4px; padding: 6px 8px; }
.ember-cell b { font-size: 12px; display: block; }
.ember-cell small { font-size: 11px; color: var(--om-muted); }
.ember-glyph { width: 14px; height: 14px; flex-shrink: 0; overflow: visible; }
.ember-glyph path { fill: none; stroke: rgba(173, 216, 230, 0.4); stroke-width: 0.3; }
.ember-cell.held { border-color: rgba(173, 216, 230, 0.4); }
.ember-cell.held path { stroke: rgba(173, 216, 230, 0.9); stroke-dasharray: 0.5 0.3; }
.ember-cell.returned { border-color: var(--om-active); box-shadow: var(--om-glow); }
.ember-cell.returned path { fill: rgba(173, 216, 230, 0.95); stroke: rgba(173, 216, 230, 1); }
.eras { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 8px; line-height: 1.6; }

.ai-stats { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; margin-bottom: 10px; }
.ai-table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
.ai-table th { text-align: left; font-weight: normal; color: var(--om-muted); border-bottom: 1px solid var(--om-line-strong); padding: 4px; }
.ai-table th:nth-child(1) { width: 36px; }
.ai-table th:nth-child(2) { width: 90px; }
.ai-table th:nth-child(3) { width: 72px; }
.ai-table th:nth-child(4) { width: 90px; }
.ai-table td { padding: 4px; border-bottom: 1px solid rgba(173, 216, 230, 0.05); }
.ai-table .preview { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--om-muted); }
.ai-table tr.fail td { color: var(--om-text); text-decoration: underline dotted rgba(173, 216, 230, 0.5); }
</style>
