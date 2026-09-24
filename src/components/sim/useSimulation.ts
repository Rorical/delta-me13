import { markRaw, onMounted, onUnmounted, ref } from 'vue';
import { OmphalosSimulation, DEFAULT_SIM_CONFIG, type SimConfig } from '../../core/llmSimulation';

const CONFIG_KEY = 'omphalos-sim-config';

function loadConfig(): SimConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_SIM_CONFIG, ...JSON.parse(raw) };
  } catch { /* 忽略 */ }
  return { ...DEFAULT_SIM_CONFIG };
}

export function saveSimConfig(config: SimConfig) {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch { /* 忽略 */ }
}

// 仿真实例是全局单例：切换左侧文件不会中断正在运行的世界。
// 它不放进 Vue 的响应式系统（markRaw），UI 通过节流后的 tick 刷新派生视图。
let instance: OmphalosSimulation | null = null;

export function getSimulation(): OmphalosSimulation {
  if (!instance) instance = markRaw(new OmphalosSimulation(loadConfig()));
  return instance;
}

export function useSimTick(sim: OmphalosSimulation, intervalMs = 150) {
  const tick = ref(0);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let unsubscribe: (() => void) | null = null;
  onMounted(() => {
    unsubscribe = sim.subscribe(() => {
      if (timer) return;
      timer = setTimeout(() => { timer = null; tick.value++; }, intervalMs);
    });
  });
  onUnmounted(() => {
    unsubscribe?.();
    if (timer) clearTimeout(timer);
  });
  return tick;
}

export function tideColor(v: number): string {
  if (v < 25) return '#38bdf8';
  if (v < 50) return '#818cf8';
  if (v < 75) return '#c084fc';
  return '#f43f5e';
}

export const KIND_LABEL: Record<string, string> = { heir: '黄金裔', titan: '泰坦', npc: '居民' };

export const LOG_TYPE_LABEL: Record<string, string> = {
  system: '系统', move: '移动', chat: '对话', combat: '战斗', ember: '火种', economy: '经济',
  social: '社交', tide: '黑潮', event: '异象', failure: '失败', era: '纪元'
};
