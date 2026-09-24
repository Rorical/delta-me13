<template>
  <div class="agent-panel" :class="{ 'has-detail': !!detail }">
    <section class="om-panel roster">
      <div class="om-panel-header">
        <Users :size="16" /> 电信号名册 <div class="om-line"></div>
        <input v-model="query" class="om-input search" placeholder="搜索名字 / 城邦" />
      </div>
      <div class="chips">
        <button v-for="k in kinds" :key="k.value" class="om-chip" :class="{ active: kind === k.value }" @click="kind = k.value">
          {{ k.label }} <span class="count">{{ counts[k.value] }}</span>
        </button>
      </div>
      <div class="rows">
        <button v-for="a in rows" :key="a.id" class="om-item slide row" :class="[a.kind, { active: a.id === selectedId, down: a.condition !== 'active' }]"
          @click="$emit('select', a.id === selectedId ? '' : a.id)">
          <div class="row-main">
            <component :is="kindIcon[a.kind]" :size="14" class="kind-icon" />
            <span class="name">{{ a.name }}</span>
            <span class="sub">{{ a.subtitle }}</span>
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
    </section>

    <aside v-if="detail" class="om-panel detail">
      <div class="om-panel-header">
        <component :is="kindIcon[detail.kind]" :size="16" />
        {{ detail.name }}
        <small v-if="detail.codename">{{ detail.codename }}</small>
        <div class="om-line"></div>
        <button class="om-btn icon-only" @click="$emit('select', '')" aria-label="关闭"><X :size="14" /></button>
      </div>
      <div class="sub-line">{{ detail.subtitle }} · {{ KIND_LABEL[detail.kind] }}</div>
      <div class="stat-grid">
        <div><label>位置</label><span>{{ detail.location }}</span></div>
        <div><label>生命</label><span>{{ detail.hp }}/{{ detail.maxHp }}</span></div>
        <div><label>攻击</label><span>{{ detail.atk }}</span></div>
        <div><label>防御</label><span>{{ detail.def }}</span></div>
        <div v-if="detail.level"><label>等级</label><span>{{ detail.level }}</span></div>
        <div v-if="detail.embersText"><label>火种</label><span>{{ detail.embersText }}</span></div>
      </div>
      <p v-if="detail.lastThought" class="quote">「{{ detail.lastThought }}」</p>
      <dl>
        <template v-if="detail.demigodText"><dt>神权</dt><dd>{{ detail.demigodText }}</dd></template>
        <template v-if="detail.gear"><dt>装备</dt><dd>{{ detail.gear }}</dd></template>
        <dt>背包</dt><dd>{{ detail.inventory || '空' }}</dd>
        <template v-if="detail.allies"><dt>盟友</dt><dd>{{ detail.allies }}</dd></template>
        <template v-if="detail.relations"><dt>关系</dt><dd>{{ detail.relations }}</dd></template>
        <template v-if="detail.respect"><dt>认可</dt><dd>{{ detail.respect }}</dd></template>
      </dl>
      <template v-if="detail.lastActions.length">
        <h5><Activity :size="12" /> 最近行动</h5>
        <ul><li v-for="(t, i) in detail.lastActions" :key="i">{{ t }}</li></ul>
      </template>
      <template v-if="detail.summary">
        <h5><ScrollText :size="12" /> 往事</h5>
        <p class="om-muted">{{ detail.summary }}</p>
      </template>
      <template v-if="detail.memory.length">
        <h5><Brain :size="12" /> 记忆</h5>
        <ul class="memory"><li v-for="(m, i) in detail.memory" :key="i"><b>D{{ m.day }}</b> {{ m.text }}</li></ul>
      </template>
      <div class="counters">
        行动 {{ detail.counters.actions }} / 失败 {{ detail.counters.failures }} / 伤害 {{ detail.counters.damageDealt }} / 发言 {{ detail.counters.chats }}
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Activity, Brain, Crown, Flame, MapPin, ScrollText, Sparkles, User, Users, X } from 'lucide-vue-next';
import type { OmphalosSimulation } from '../../core/llmSimulation';
import { isHeir, isTitan } from '../../core/omphalosWorldState';
import { GOLDEN_HEIRS } from '../../core/agent/goldenHeirProfiles';
import { KIND_LABEL } from './useSimulation';

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
      id: a.id, name: a.name, kind: a.kind, subtitle: a.subtitle, location: a.location,
      hp: a.hp, maxHp: a.maxHp, hpPct: Math.max(0, Math.round((a.hp / a.maxHp) * 100)),
      condition: a.condition, lastThought: a.lastThought,
      embers: isHeir(a) ? a.embers.length : 0,
      demigod: isHeir(a) && a.demigod.length > 0
    }));
});

const detail = computed(() => {
  void props.tick;
  const s = props.sim.state;
  const a = props.selectedId ? s.agents[props.selectedId] : undefined;
  if (!a) return null;
  const nameOf = (id: string) => s.agents[id]?.name ?? id;
  const mem = props.sim.memoryOf(a.id);
  return {
    ...a,
    codename: isHeir(a) ? GOLDEN_HEIRS.find(h => h.id === a.id)?.codename : '',
    atk: props.sim.engine.attackPower(a),
    def: props.sim.engine.defensePower(a),
    level: isHeir(a) ? a.level : 0,
    embersText: isHeir(a) ? (a.embers.map(id => s.embers[id]?.name).join('、') || '无')
      : isTitan(a) ? `${s.embers[a.emberId]?.name}（${a.emberTaken ? '已失去' : '守护中'}）` : '',
    demigodText: isHeir(a) && a.demigod.length ? `「${a.demigod.join('」「')}」` : '',
    gear: [a.weapon, a.armor].filter(Boolean).join('、'),
    inventory: Object.entries(a.inventory).map(([k, n]) => `${k}×${n}`).join('、'),
    allies: a.allies.map(nameOf).join('、'),
    relations: Object.entries(a.relations).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 8)
      .map(([id, v]) => `${nameOf(id)} ${v > 0 ? '+' : ''}${v}`).join('、'),
    respect: isTitan(a) ? Object.entries(a.respect).map(([id, v]) => `${nameOf(id)} ${v}`).join('、') : '',
    lastActions: a.lastActions ?? [],
    summary: mem.getSummary(),
    memory: mem.recent(12).reverse()
  };
});
</script>

<style scoped>
.agent-panel { display: grid; grid-template-columns: 1fr; gap: 12px; }
.agent-panel.has-detail { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
@media (max-width: 900px) { .agent-panel.has-detail { grid-template-columns: 1fr; } }
.search { width: 150px; font-weight: normal; }
.chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.count { opacity: 0.6; }
.rows { display: flex; flex-direction: column; gap: 6px; }
.row { padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; }
.row.down { opacity: 0.5; }
.row-main { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; position: relative; z-index: 1; }
.kind-icon { opacity: 0.7; }
.name { font-weight: bold; font-size: 13px; }
.sub { font-size: 11px; color: var(--om-muted); }
.row-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--om-muted); }
.loc { display: inline-flex; align-items: center; gap: 3px; min-width: 96px; }
.hp { flex: 1; max-width: 160px; }
.hp-text { font-variant-numeric: tabular-nums; }
.thought { font-size: 11px; color: var(--om-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.detail { align-self: start; position: sticky; top: 0; max-height: 75vh; overflow-y: auto; font-size: 12px; }
.sub-line { color: var(--om-muted); margin: -4px 0 10px; }
.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px; }
.stat-grid div { border: 1px solid rgba(173, 216, 230, 0.08); border-radius: 4px; padding: 4px 6px; display: flex; flex-direction: column; min-width: 0; }
.stat-grid label { font-size: 10px; color: var(--om-muted); }
.stat-grid span { overflow: hidden; text-overflow: ellipsis; }
.quote { border-left: 2px solid rgba(173, 216, 230, 0.6); padding-left: 8px; margin: 8px 0 12px; }
dl { display: grid; grid-template-columns: 44px 1fr; gap: 4px 8px; margin: 0 0 8px; }
dt { color: var(--om-muted); }
dd { margin: 0; word-break: break-all; }
h5 { display: flex; align-items: center; gap: 5px; margin: 12px 0 4px; font-size: 12px; color: var(--om-text); border-bottom: 1px solid rgba(173, 216, 230, 0.1); padding-bottom: 3px; }
ul { margin: 0; padding-left: 16px; line-height: 1.6; }
p { margin: 0; line-height: 1.6; }
.memory b { font-weight: normal; color: var(--om-muted); }
.counters { margin-top: 12px; font-size: 11px; color: var(--om-faint); }
</style>
