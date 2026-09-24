import { markRaw, onMounted, onUnmounted, ref, type Component } from 'vue';
import { Crown, Skull, Sparkles, User } from 'lucide-vue-next';
import { OmphalosSimulation, DEFAULT_SIM_CONFIG, type SimConfig, type SimSnapshot } from '../../core/llmSimulation';

const CONFIG_KEY = 'omphalos-sim-config';
const WORLD_KEY = 'omphalos-world';

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
  if (!instance) {
    const sim = markRaw(new OmphalosSimulation(loadConfig()));
    const snap = loadWorld();
    if (snap && !sim.restore(snap)) clearWorld();
    sim.onCheckpoint = () => saveWorld(sim);
    instance = sim;
  }
  return instance;
}

// ---------- 世界存档（仅保存在本机浏览器） ----------
function loadWorld(): SimSnapshot | null {
  try {
    const raw = localStorage.getItem(WORLD_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearWorld() {
  try { localStorage.removeItem(WORLD_KEY); } catch { /* 忽略 */ }
}

function saveWorld(sim: OmphalosSimulation) {
  const snap = sim.snapshot();
  try {
    localStorage.setItem(WORLD_KEY, JSON.stringify(snap));
  } catch {
    // 超出存储配额：丢弃思考内容与较早的日志后重试
    try {
      const s = snap.state;
      const slim = {
        ...snap,
        state: { ...s, logs: s.logs.slice(-300), messages: s.messages.slice(-120), ai: { ...s.ai, recent: s.ai.recent.map(r => ({ ...r, reasoning: undefined })) } }
      };
      localStorage.setItem(WORLD_KEY, JSON.stringify(slim));
    } catch { /* 放弃本次存档 */ }
  }
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

// 单色体系：黑潮越深，光晕越浓
export function tideAlpha(v: number): number {
  return 0.08 + Math.min(100, Math.max(0, v)) / 100 * 0.55;
}

export function tideLabel(v: number): string {
  if (v >= 90) return '沦陷';
  if (v >= 70) return '危急';
  if (v >= 45) return '侵蚀';
  if (v >= 20) return '波动';
  return '安定';
}

export const KIND_LABEL: Record<string, string> = { heir: '黄金裔', titan: '泰坦', npc: '居民', enemy: '敌对' };

export const KIND_ICON: Record<string, Component> = { heir: Sparkles, titan: Crown, npc: User, enemy: Skull };

export const DISPOSITION_LABEL: Record<string, string> = { benevolent: '仍记神谕', neutral: '火种试炼', corrupted: '失神 · 黑潮侵染' };

export const LOG_TYPE_LABEL: Record<string, string> = {
  system: '系统', move: '移动', chat: '对话', combat: '战斗', ember: '火种', economy: '经济',
  social: '社交', tide: '黑潮', event: '异象', failure: '失败', era: '纪元'
};
