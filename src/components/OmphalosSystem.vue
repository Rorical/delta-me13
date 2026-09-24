<template>
  <!-- 档案面板内只放入口卡片；仿真本体在全屏工作台中运行 -->
  <div class="launcher om-root">
    <div class="om-inner intro">
      <p>「翁法罗斯」多代理仿真。十二位黄金裔踏上逐火之旅，挑战或说服十二泰坦，取得火种并在创世涡心归还；
        黑潮则在城邦之间蔓延。每个电信号都由因果矩阵（大语言模型）驱动决策。</p>
    </div>

    <div class="status-row">
      <span class="om-dot" :class="{ live: view.status === 'running' }"></span>
      <span>{{ view.statusLabel }}</span>
      <span class="om-muted">· 第{{ view.era }}纪元 第{{ view.day }}天</span>
    </div>

    <div class="mini-kpis">
      <div><label><Flame :size="12" /> 火种归还</label><b>{{ view.returned }}/12</b></div>
      <div><label><Waves :size="12" /> 黑潮</label><b>{{ view.tide.toFixed(1) }}%</b></div>
      <div><label><Activity :size="12" /> 稳定度</label><b>{{ view.stability.toFixed(0) }}</b></div>
      <div><label><Cpu :size="12" /> 模型调用</label><b>{{ view.calls }}</b></div>
    </div>

    <div v-if="!openAIStore.isConnected" class="notice"><Info :size="14" /> 因果矩阵未连接 —— 请先在「因果矩阵」中配置模型端点与密钥。</div>

    <button class="om-btn primary enter" @click="open = true">
      <Maximize2 :size="16" /> 进入翁法罗斯
    </button>

    <Teleport to="body">
      <SimWorkspace v-if="open" @close="open = false" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Activity, Cpu, Flame, Info, Maximize2, Waves } from 'lucide-vue-next';
import { useOpenAIStore } from '../stores/openAIStore';
import { returnedEmberCount } from '../core/omphalosWorldState';
import SimWorkspace from './sim/SimWorkspace.vue';
import { getSimulation, useSimTick } from './sim/useSimulation';
import './sim/sim.css';

const openAIStore = useOpenAIStore();
const sim = getSimulation();
const tick = useSimTick(sim);
const open = ref(false);

const view = computed(() => {
  void tick.value;
  const s = sim.state;
  return {
    status: sim.status,
    statusLabel: { idle: '待机', running: '运行中', paused: '已暂停', stopping: '正在停止' }[sim.status],
    era: s.era,
    day: s.day,
    returned: returnedEmberCount(s),
    tide: s.darkTide.global,
    stability: s.worldStability,
    calls: s.ai.calls
  };
});

onMounted(() => {
  if (openAIStore.isConfigured() && !openAIStore.isConnected) void openAIStore.testConnection();
});
</script>

<style scoped>
.launcher { display: flex; flex-direction: column; gap: 16px; font-size: 14px; }
.intro p { margin: 0; line-height: 1.8; font-size: 15px; }
.status-row { display: flex; align-items: center; gap: 8px; }
.mini-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.mini-kpis div { border: 1px solid var(--om-line-strong); background: var(--om-fill); padding: 8px 12px; display: flex; flex-direction: column; }
.mini-kpis label { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--om-muted); }
.mini-kpis b { font-size: 22px; font-weight: 600; font-variant-numeric: tabular-nums; }
.notice { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--om-line-strong); border-left: 4px solid var(--ui-select); background: var(--ui-fill-inner); font-size: 13px; }
.enter { align-self: flex-start; padding: 10px 26px; font-size: 16px; }
@media (max-width: 700px) { .mini-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
