<template>
  <div class="roster">
    <div class="controls">
      <input v-model="query" class="om-input search" placeholder="搜索名字 / 城邦" />
      <div class="chips">
        <button v-for="k in kinds" :key="k.value" class="om-chip" :class="{ active: kind === k.value }" @click="kind = k.value">
          {{ k.label }} <span class="count">{{ counts[k.value] }}</span>
        </button>
      </div>
    </div>
    <div class="rows">
      <button v-for="a in rows" :key="a.id" class="om-item row" :class="[a.kind, { active: a.id === selectedId, down: a.condition !== 'active' }]"
        @click="$emit('select', a.id === selectedId ? '' : a.id)">
        <div class="row-main">
          <component :is="kindIcon[a.kind]" :size="14" class="kind-icon" />
          <span class="name">{{ a.name }}</span>
          <span v-if="a.embers" class="om-tag strong" :title="`身上有${a.embers}枚火种`"><Flame :size="11" />{{ a.embers }}</span>
          <span v-if="a.demigod" class="om-tag strong" title="已成为半神"><Sparkles :size="11" />半神</span>
          <span v-if="a.condition !== 'active'" class="om-tag">{{ a.condition === 'fallen' ? '陨落' : '倒下' }}</span>
        </div>
        <div class="row-meta">
          <span class="loc"><MapPin :size="11" />{{ a.location }}</span>
          <div class="om-bar hp" :class="{ hazard: a.hpPct < 30 }"><i :style="{ width: a.hpPct + '%' }"></i></div>
          <span class="hp-text">{{ a.hp }}/{{ a.maxHp }}</span>
        </div>
        <div v-if="a.lastThought" class="thought">「{{ a.lastThought }}」</div>
      </button>
      <div v-if="!rows.length" class="om-empty">没有匹配的电信号</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Crown, Flame, MapPin, Sparkles, User } from 'lucide-vue-next';
import type { OmphalosSimulation } from '../../core/llmSimulation';
import { isHeir } from '../../core/omphalosWorldState';

const props = defineProps<{ sim: OmphalosSimulation; tick: number; selectedId?: string }>();
defineEmits<{ (e: 'select', id: string): void }>();

const kindIcon = { heir: Sparkles, titan: Crown, npc: User };
const kinds = [
  { value: 'all', label: '全部' },
  { value: 'heir', label: '黄金裔' },
  { value: 'titan', label: '泰坦' },
  { value: 'npc', label: '居民' }
] as const;
const kind = ref<'all' | 'heir' | 'titan' | 'npc'>('heir');
const query = ref('');

const agents = computed(() => { void props.tick; return Object.values(props.sim.state.agents); });

const counts = computed(() => {
  const c: Record<string, number> = { all: 0, heir: 0, titan: 0, npc: 0 };
  for (const a of agents.value) { c.all++; c[a.kind]++; }
  return c;
});

const rows = computed(() => {
  const q = query.value.trim();
  return agents.value
    .filter(a => kind.value === 'all' || a.kind === kind.value)
    .filter(a => !q || a.name.includes(q) || a.location.includes(q) || a.subtitle.includes(q))
    .map(a => ({
      id: a.id, name: a.name, kind: a.kind, location: a.location,
      hp: a.hp, maxHp: a.maxHp, hpPct: Math.max(0, Math.round((a.hp / a.maxHp) * 100)),
      condition: a.condition, lastThought: a.lastThought,
      embers: isHeir(a) ? a.embers.length : 0,
      demigod: isHeir(a) && a.demigod.length > 0
    }));
});
</script>

<style scoped>
.roster { display: flex; flex-direction: column; gap: 10px; min-height: 0; }
.controls { display: flex; flex-direction: column; gap: 8px; }
.search { width: 100%; box-sizing: border-box; }
.chips { display: flex; gap: 5px; flex-wrap: wrap; }
.count { opacity: 0.6; }
.rows { display: flex; flex-direction: column; gap: 5px; }
.row { padding: 7px 9px; display: flex; flex-direction: column; gap: 3px; }
.row.down { opacity: 0.5; }
.row-main { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.kind-icon { opacity: 0.7; }
.name { font-weight: 600; font-size: 14px; }
.row-meta { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--om-muted); }
.loc { display: inline-flex; align-items: center; gap: 3px; min-width: 84px; }
.hp { flex: 1; }
.hp-text { font-variant-numeric: tabular-nums; }
.thought { font-size: 11px; color: var(--om-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
