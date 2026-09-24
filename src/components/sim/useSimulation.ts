import { markRaw, onMounted, onUnmounted, reactive, ref, shallowRef, toRaw, type Component } from 'vue';
import { Crown, Skull, Sparkles, User } from 'lucide-vue-next';
import { OmphalosSimulation, DEFAULT_SIM_CONFIG, type SimConfig, type SimSnapshot } from '../../core/llmSimulation';
import type { Play } from '../../core/theater';
import { idbGet, idbSet } from '../../services/worldStorage';

const CONFIG_KEY = 'omphalos-sim-config';
const LEGACY_WORLD_KEY = 'omphalos-world';
const WORLD_KEY = 'world';
const THEATER_KEY = 'theaters';

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
let ready: Promise<void> = Promise.resolve();

export function getSimulation(): OmphalosSimulation {
  if (!instance) {
    const sim = markRaw(new OmphalosSimulation(loadConfig()));
    instance = sim;
    ready = loadSaved(sim).finally(() => { sim.onCheckpoint = () => void saveWorld(sim); });
  }
  return instance;
}

/** 本地存档读取完毕（启动仿真前应等待） */
export function simReady(): Promise<void> {
  getSimulation();
  return ready;
}

// ---------- 本地存档（IndexedDB，仅保存在本机浏览器） ----------
export const persistence = reactive({ lastSaved: 0, error: '' });

// 小剧场列表：浅层响应，替换整个数组以触发更新（深层代理无法写入 IndexedDB）
export const theaters = shallowRef<Play[]>([]);

async function loadSaved(sim: OmphalosSimulation) {
  try {
    let snap = await idbGet<SimSnapshot>(WORLD_KEY);
    if (!snap) {
      // 旧版本把存档放在 localStorage，迁移后删除
      const legacy = localStorage.getItem(LEGACY_WORLD_KEY);
      if (legacy) snap = JSON.parse(legacy);
    }
    if (snap && sim.restore(snap)) persistence.lastSaved = snap.savedAt ?? 0;
    localStorage.removeItem(LEGACY_WORLD_KEY);
    theaters.value = (await idbGet<Play[]>(THEATER_KEY)) ?? [];
  } catch (err: any) {
    persistence.error = `读取存档失败：${String(err?.message ?? err).slice(0, 80)}`;
  }
}

export async function saveWorld(sim: OmphalosSimulation) {
  try {
    const snap = sim.snapshot();
    await idbSet(WORLD_KEY, snap);
    persistence.lastSaved = snap.savedAt;
    persistence.error = '';
  } catch (err: any) {
    persistence.error = `自动存档失败：${String(err?.message ?? err).slice(0, 80)}`;
  }
}

export async function saveTheaters(list: Play[]) {
  theaters.value = list;
  try {
    await idbSet(THEATER_KEY, list.map(p => toRaw(p)));
  } catch (err: any) {
    persistence.error = `小剧场保存失败：${String(err?.message ?? err).slice(0, 80)}`;
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
