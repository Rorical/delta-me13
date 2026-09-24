<template>
  <!-- 外层面板带有 transform/backdrop-filter，会困住 position:fixed，全屏时传送到 body -->
  <Teleport to="body" :disabled="!expanded">
  <div class="omphalos-system" :class="{ expanded }">
    <!-- 顶栏：状态 + 控制 -->
    <header class="toolbar">
      <div class="title">
        <span class="status-dot" :class="statusClass"></span>
        <div>
          <h2>翁法罗斯</h2>
          <div class="subtitle">{{ statusText }}</div>
        </div>
      </div>
      <div class="controls">
        <button v-if="status !== 'running'" class="btn primary" :disabled="status === 'stopping'" @click="start">
          {{ status === 'paused' ? '继续' : '启动仿真' }}
        </button>
        <button v-else class="btn" @click="sim.pause()">暂停</button>
        <button class="btn" :disabled="status === 'running' || status === 'stopping'" @click="step" title="仅推进一天">单步</button>
        <button class="btn" :disabled="status === 'idle'" @click="sim.stop()">停止</button>
        <button class="btn" :disabled="status === 'running' || status === 'stopping'" @click="reset">重置</button>
        <button class="btn icon" :class="{ on: showSettings }" @click="showSettings = !showSettings" title="仿真参数">⚙</button>
        <button class="btn icon" @click="expanded = !expanded" :title="expanded ? '收起 (Esc)' : '全屏展开'">{{ expanded ? '⤡' : '⤢' }}</button>
      </div>
    </header>

    <div class="progress" v-if="view.progress.total > 0 && status === 'running'">
      <div class="progress-fill" :style="{ width: (view.progress.done / view.progress.total * 100) + '%' }"></div>
    </div>

    <div v-if="!openAIStore.isConnected" class="notice">
      因果矩阵未连接 —— 请先在「再创世 / 因果矩阵」中配置模型端点与密钥。
    </div>
    <div v-if="sim.lastError" class="notice error">{{ sim.lastError }}</div>

    <!-- 参数 -->
    <section v-if="showSettings" class="settings">
      <label>并发请求
        <input type="range" min="1" max="12" v-model.number="cfg.concurrency" /> <b>{{ cfg.concurrency }}</b>
      </label>
      <label>居民活跃度
        <input type="range" min="0" max="1" step="0.1" v-model.number="cfg.npcActivity" /> <b>{{ Math.round(cfg.npcActivity * 100) }}%</b>
      </label>
      <label>每日间隔
        <input type="range" min="0" max="5000" step="250" v-model.number="cfg.dayDelayMs" /> <b>{{ (cfg.dayDelayMs / 1000).toFixed(2) }}s</b>
      </label>
      <label>居民数量（重置后生效）
        <input type="range" min="0" max="20" v-model.number="cfg.npcCount" /> <b>{{ cfg.npcCount }}</b>
      </label>
      <label class="check"><input type="checkbox" v-model="cfg.replyPhase" /> 被搭话者当日回应（对话更生动，调用更多）</label>
      <p class="hint">
        每天约 {{ estimatedCalls }} 次模型调用。并发越高越快，但可能触发端点限流。
      </p>
    </section>

    <!-- 指标 -->
    <div class="kpis">
      <div class="kpi"><label>纪元</label><b>{{ view.era }}</b></div>
      <div class="kpi"><label>天数</label><b>{{ view.day }}</b><small>累计 {{ view.totalDays }}</small></div>
      <div class="kpi ember"><label>火种</label><b>{{ view.embers }}/12</b>
        <div class="bar"><i :style="{ width: view.embers / 12 * 100 + '%' }"></i></div></div>
      <div class="kpi tide"><label>黑潮</label><b :style="{ color: tideColor(view.tide) }">{{ view.tide.toFixed(1) }}%</b>
        <div class="bar"><i :style="{ width: view.tide + '%', background: tideColor(view.tide) }"></i></div></div>
      <div class="kpi"><label>稳定度</label><b>{{ view.stability.toFixed(0) }}</b></div>
      <div class="kpi"><label>模型调用</label><b>{{ view.ai.calls }}</b><small>{{ view.ai.failures }} 失败 · {{ view.ai.avgMs }}ms</small></div>
    </div>

    <!-- 标签页 -->
    <nav class="tabs">
      <button v-for="t in tabs" :key="t.id" :class="{ active: tab === t.id }" @click="tab = t.id">
        {{ t.label }}<span v-if="t.badge" class="badge">{{ t.badge }}</span>
      </button>
    </nav>

    <main class="tab-body">
      <!-- 世界 -->
      <div v-if="tab === 'world'" class="world-tab">
        <WorldMap :state="sim.state" :tick="tick" :selected="selectedCity" @select="id => selectedCity = id" />
        <div v-if="city" class="city-card">
          <header>
            <h3>{{ city.name }} <small>{{ city.type }}</small></h3>
            <span class="tide-tag" :style="{ color: tideColor(city.darkTide) }">黑潮 {{ city.darkTide.toFixed(1) }}%{{ city.fallen ? ' · 已沦陷' : '' }}</span>
          </header>
          <p class="desc">{{ city.description }}</p>
          <div class="city-stats">
            <span>人口 {{ city.population.toLocaleString() }}</span>
            <span>繁荣 {{ city.prosperity }}</span>
            <span>城墙 {{ city.walls }} · 瞭望塔 {{ city.watchtowers }}</span>
            <span>食物 {{ city.resources.food }} · 材料 {{ city.resources.materials }} · 魔力 {{ city.resources.mana }}</span>
          </div>
          <div v-if="city.titan" class="city-titan">
            ◆ {{ city.titan.name }}（{{ city.titan.subtitle }}）
            <span :class="city.titan.disposition">{{ dispositionLabel[city.titan.disposition] }}</span>
            · HP {{ city.titan.hp }}/{{ city.titan.maxHp }}
            · {{ city.titan.condition === 'fallen' ? '已陨落' : city.titan.emberTaken ? '火种已被取走' : '守护着火种' }}
          </div>
          <div class="present">
            <button v-for="a in city.present" :key="a.id" class="person" :class="a.kind" @click="openAgent(a.id)">
              {{ a.name }}<small>{{ a.subtitle }}</small>
            </button>
            <span v-if="!city.present.length" class="muted">此地空无一人</span>
          </div>
        </div>
        <div v-else class="muted hint-center">点击地图上的城邦查看详情</div>
      </div>

      <!-- 电信号 -->
      <AgentPanel v-else-if="tab === 'agents'" :sim="sim" :tick="tick" :selected-id="selectedAgent"
        @select="id => selectedAgent = id" />

      <!-- 事件 -->
      <EventFeed v-else-if="tab === 'events'" :state="sim.state" :tick="tick" :agent-id="selectedAgent"
        @clear-agent="selectedAgent = ''" />

      <!-- 对话 -->
      <div v-else-if="tab === 'chat'" class="chat-list">
        <div v-for="m in chats" :key="m.id" class="bubble" :class="m.fromKind">
          <div class="bubble-head">
            <b @click="openAgent(m.from)">{{ m.fromName }}</b> → <span @click="openAgent(m.to)">{{ m.toName }}</span>
            <small>E{{ m.era }}·D{{ m.day }} · {{ m.location }}</small>
          </div>
          <div class="bubble-body">{{ m.content }}</div>
        </div>
        <div v-if="!chats.length" class="muted hint-center">还没有人开口说话</div>
      </div>

      <!-- 纪元 -->
      <div v-else-if="tab === 'era'" class="era-tab">
        <h4>火种</h4>
        <div class="ember-grid">
          <div v-for="e in embers" :key="e.id" class="ember-cell" :class="{ held: !!e.holder }">
            <b>{{ e.name }}</b>
            <small>{{ e.holder ? `持有者：${e.holder}` : `${e.titan} 守护中` }}</small>
          </div>
        </div>
        <h4>轮回史</h4>
        <ol class="eras">
          <li v-for="r in eraHistory" :key="r.era" :class="r.outcome">
            <b>第{{ r.era }}纪元</b> · {{ r.days }}天 · 火种 {{ r.embers }}/12 · {{ r.outcome === 'recreation' ? '再创世' : '黑潮吞没' }}
            <div class="muted">{{ r.summary }}</div>
          </li>
          <li v-if="!eraHistory.length" class="muted">这是第一个纪元。集齐十二火种可完成再创世；若黑潮吞没世界，一切将重新轮回。</li>
        </ol>
      </div>

      <!-- AI -->
      <div v-else-if="tab === 'ai'" class="ai-tab">
        <div class="ai-stats">
          <span>调用 {{ view.ai.calls }}</span>
          <span>失败 {{ view.ai.failures }}</span>
          <span>平均 {{ view.ai.avgMs }}ms</span>
          <span>输入 {{ view.ai.promptTokens.toLocaleString() }} tok</span>
          <span>输出 {{ view.ai.completionTokens.toLocaleString() }} tok</span>
        </div>
        <table class="ai-table">
          <thead><tr><th>天</th><th>代理</th><th>耗时</th><th>Token</th><th>结果</th></tr></thead>
          <tbody>
            <tr v-for="r in aiRecent" :key="r.id" :class="{ fail: !r.ok }">
              <td>{{ r.day }}</td>
              <td>{{ r.agent }}</td>
              <td :class="r.ms > 8000 ? 'slow' : r.ms > 3000 ? 'mid' : 'fast'">{{ r.ms }}ms</td>
              <td>{{ r.promptTokens }}+{{ r.completionTokens }}</td>
              <td class="preview">{{ r.ok ? r.preview : r.error }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="!aiRecent.length" class="muted hint-center">暂无调用记录</div>
      </div>
    </main>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useOpenAIStore } from '../stores/openAIStore';
import { notificationService } from '../services/notificationService';
import { collectedEmberCount, isTitan, type TitanStatus } from '../core/omphalosWorldState';
import WorldMap from './sim/WorldMap.vue';
import AgentPanel from './sim/AgentPanel.vue';
import EventFeed from './sim/EventFeed.vue';
import { getSimulation, saveSimConfig, tideColor, useSimTick } from './sim/useSimulation';

const openAIStore = useOpenAIStore();
const sim = getSimulation();
const tick = useSimTick(sim);

const expanded = ref(false);
const showSettings = ref(false);
const tab = ref<'world' | 'agents' | 'events' | 'chat' | 'era' | 'ai'>('world');
const selectedCity = ref('奥赫玛');
const selectedAgent = ref('');

const cfg = reactive({ ...sim.config });
watch(cfg, () => {
  sim.updateConfig({ ...cfg });
  saveSimConfig({ ...cfg });
});

const dispositionLabel = { benevolent: '仁慈', neutral: '审视', corrupted: '已被黑潮侵染' };

const status = computed(() => { void tick.value; return sim.status; });
const statusClass = computed(() => status.value);
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
  const agents = Object.values(sim.state.agents);
  const heirs = agents.filter(a => a.kind === 'heir').length;
  const npcs = cfg.npcCount * cfg.npcActivity;
  const base = heirs + npcs + 3;
  return `${Math.round(base)}–${Math.round(base * (cfg.replyPhase ? 1.6 : 1.1))}`;
});

const city = computed(() => {
  void tick.value;
  const c = sim.state.cities[selectedCity.value];
  if (!c) return null;
  return {
    ...c,
    titan: c.titanId ? sim.state.agents[c.titanId] as TitanStatus : undefined,
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
    id: e.id, name: e.name,
    holder: e.holderId ? s.agents[e.holderId]?.name : '',
    titan: s.agents[e.titanId]?.name ?? ''
  }));
});

const eraHistory = computed(() => { void tick.value; return [...sim.state.eraHistory].reverse(); });

const aiRecent = computed(() => {
  void tick.value;
  const s = sim.state;
  return s.ai.recent.slice().reverse().map(r => ({ ...r, agent: s.agents[r.agentId]?.name ?? r.agentId }));
});

const tabs = computed(() => [
  { id: 'world' as const, label: '世界' },
  { id: 'agents' as const, label: '电信号' },
  { id: 'events' as const, label: '事件' },
  { id: 'chat' as const, label: '对话', badge: chats.value.length ? String(Math.min(chats.value.length, 99)) : '' },
  { id: 'era' as const, label: '纪元' },
  { id: 'ai' as const, label: 'AI' }
]);

const openAgent = (id: string) => {
  selectedAgent.value = id;
  tab.value = 'agents';
};

// 连接模型并把最新配置交给仿真
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
  --text: rgba(224, 242, 254, 0.88);
  --muted: rgba(173, 216, 230, 0.6);
  --line: rgba(173, 216, 230, 0.14);
  --accent: #00d4ff;
  --gold: #f5c542;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 13px;
  padding: 4px 2px 16px;
  box-sizing: border-box;
}
.omphalos-system.expanded {
  position: fixed;
  inset: 0;
  z-index: 5000;
  padding: 16px max(16px, calc((100vw - 1400px) / 2));
  background: radial-gradient(ellipse at top, rgba(0, 212, 255, 0.08), transparent 60%), #070b1a;
}

.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.title { display: flex; align-items: center; gap: 10px; }
.title h2 { margin: 0; font-size: 18px; color: #e0f2fe; letter-spacing: 2px; }
.subtitle { font-size: 11px; color: var(--muted); }
.status-dot { width: 10px; height: 10px; border-radius: 50%; background: #64748b; box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.2); }
.status-dot.running { background: #34d399; box-shadow: 0 0 10px #34d399; animation: pulse 1.4s infinite; }
.status-dot.paused { background: #fbbf24; }
.status-dot.stopping { background: #f43f5e; }
@keyframes pulse { 50% { opacity: 0.4; } }
.controls { display: flex; gap: 6px; flex-wrap: wrap; }
.btn { background: rgba(173, 216, 230, 0.08); border: 1px solid rgba(173, 216, 230, 0.25); color: var(--text); padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: background 0.15s, border-color 0.15s; }
.btn:hover:not(:disabled) { background: rgba(0, 212, 255, 0.15); border-color: var(--accent); }
.btn:disabled { opacity: 0.35; cursor: not-allowed; }
.btn.primary { background: rgba(0, 212, 255, 0.2); border-color: var(--accent); color: #fff; }
.btn.icon { padding: 5px 9px; }
.btn.on { border-color: var(--accent); }

.progress { height: 2px; background: rgba(173, 216, 230, 0.1); border-radius: 1px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--accent); transition: width 0.2s; }

.notice { font-size: 12px; padding: 6px 10px; border-radius: 6px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); color: #fde68a; }
.notice.error { background: rgba(244, 63, 94, 0.1); border-color: rgba(244, 63, 94, 0.35); color: #fecdd3; }

.settings { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px 16px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: rgba(0, 0, 0, 0.2); }
.settings label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); }
.settings input[type='range'] { flex: 1; accent-color: var(--accent); }
.settings b { color: var(--text); min-width: 38px; text-align: right; font-weight: 500; }
.settings .check { grid-column: 1 / -1; }
.hint { grid-column: 1 / -1; margin: 0; font-size: 11px; color: var(--muted); }

.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 8px; }
.kpi { border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; background: rgba(173, 216, 230, 0.03); display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.kpi label { font-size: 10px; color: var(--muted); letter-spacing: 1px; }
.kpi b { font-size: 18px; font-weight: 600; color: #e0f2fe; font-variant-numeric: tabular-nums; }
.kpi small { font-size: 10px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kpi.ember b { color: var(--gold); }
.bar { height: 3px; background: rgba(255, 255, 255, 0.07); border-radius: 2px; overflow: hidden; margin-top: 3px; }
.bar i { display: block; height: 100%; background: var(--gold); transition: width 0.4s; }

.tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--line); overflow-x: auto; }
.tabs button { background: none; border: none; border-bottom: 2px solid transparent; color: var(--muted); padding: 6px 12px; cursor: pointer; font-size: 13px; white-space: nowrap; }
.tabs button.active { color: #e0f2fe; border-bottom-color: var(--accent); }
.tabs .badge { margin-left: 4px; font-size: 10px; background: rgba(0, 212, 255, 0.2); border-radius: 999px; padding: 0 5px; }
.tab-body { flex: 1; min-height: 0; }

.world-tab { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 12px; align-items: start; }
@media (max-width: 1000px) { .world-tab { grid-template-columns: 1fr; } }
.city-card { border: 1px solid var(--line); border-radius: 8px; padding: 12px; background: rgba(0, 0, 0, 0.2); }
.city-card header { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.city-card h3 { margin: 0; font-size: 16px; color: #e0f2fe; }
.city-card h3 small { font-size: 11px; color: var(--muted); font-weight: 400; margin-left: 6px; }
.tide-tag { font-size: 12px; }
.desc { font-size: 12px; color: var(--muted); line-height: 1.6; margin: 6px 0; }
.city-stats { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 11px; color: var(--muted); }
.city-titan { margin-top: 8px; font-size: 12px; color: var(--gold); }
.city-titan .corrupted { color: #e879f9; }
.city-titan .benevolent { color: #34d399; }
.city-titan .neutral { color: #7dd3fc; }
.present { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.person { background: rgba(173, 216, 230, 0.06); border: 1px solid var(--line); color: var(--text); border-radius: 6px; padding: 3px 8px; cursor: pointer; font-size: 12px; display: flex; flex-direction: column; align-items: flex-start; }
.person small { font-size: 10px; color: var(--muted); }
.person.heir { border-color: rgba(245, 197, 66, 0.5); }
.person:hover { border-color: var(--accent); }

.chat-list { display: flex; flex-direction: column; gap: 8px; }
.bubble { border: 1px solid var(--line); border-radius: 10px; padding: 8px 12px; background: rgba(173, 216, 230, 0.04); max-width: 720px; }
.bubble.heir { border-left: 3px solid var(--gold); }
.bubble.titan { border-left: 3px solid #e879f9; background: rgba(232, 121, 249, 0.05); }
.bubble-head { font-size: 11px; color: var(--muted); display: flex; gap: 6px; align-items: baseline; flex-wrap: wrap; }
.bubble-head b, .bubble-head span { cursor: pointer; }
.bubble-head b { color: #e0f2fe; }
.bubble-head small { margin-left: auto; }
.bubble-body { margin-top: 3px; line-height: 1.6; }

.era-tab h4 { margin: 4px 0 8px; font-size: 13px; color: var(--accent); }
.ember-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px; margin-bottom: 14px; }
.ember-cell { border: 1px solid var(--line); border-radius: 6px; padding: 6px 8px; display: flex; flex-direction: column; opacity: 0.6; }
.ember-cell.held { opacity: 1; border-color: rgba(245, 197, 66, 0.6); background: rgba(245, 197, 66, 0.07); }
.ember-cell b { color: var(--gold); font-size: 12px; }
.ember-cell small { font-size: 11px; color: var(--muted); }
.eras { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; line-height: 1.5; }
.eras .recreation b { color: var(--gold); }
.eras .collapse b { color: #f43f5e; }

.ai-stats { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 12px; color: var(--muted); margin-bottom: 8px; }
.ai-table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
.ai-table th { text-align: left; font-weight: 500; color: var(--muted); border-bottom: 1px solid var(--line); padding: 4px; }
.ai-table th:nth-child(1) { width: 36px; }
.ai-table th:nth-child(2) { width: 80px; }
.ai-table th:nth-child(3) { width: 70px; }
.ai-table th:nth-child(4) { width: 90px; }
.ai-table td { padding: 4px; border-bottom: 1px solid rgba(173, 216, 230, 0.05); }
.ai-table .preview { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--muted); }
.ai-table tr.fail td { color: #fda4af; }
.fast { color: #34d399; }
.mid { color: #fbbf24; }
.slow { color: #f43f5e; }

.muted { color: var(--muted); }
.hint-center { text-align: center; padding: 20px; font-size: 12px; }
</style>
