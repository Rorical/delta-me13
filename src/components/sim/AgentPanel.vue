<template>
  <div class="agent-panel" :class="{ 'has-detail': !!detail }">
    <div class="roster">
      <div class="roster-controls">
        <div class="chips">
          <button v-for="k in kinds" :key="k.value" class="chip" :class="{ active: kind === k.value }" @click="kind = k.value">
            {{ k.label }} <span class="count">{{ counts[k.value] }}</span>
          </button>
        </div>
        <input v-model="query" class="search" placeholder="搜索名字 / 城邦" />
      </div>
      <div class="rows">
        <button v-for="a in rows" :key="a.id" class="row" :class="[a.kind, { selected: a.id === selectedId, down: a.condition !== 'active' }]"
          @click="$emit('select', a.id === selectedId ? '' : a.id)">
          <div class="row-main">
            <span class="name">{{ a.name }}</span>
            <span class="sub">{{ a.subtitle }}</span>
            <span v-if="a.embers" class="embers" :title="`持有${a.embers}枚火种`">🔥{{ a.embers }}</span>
            <span v-if="a.condition !== 'active'" class="tag-down">{{ a.condition === 'fallen' ? '陨落' : '倒下' }}</span>
          </div>
          <div class="row-meta">
            <span class="loc">📍{{ a.location }}</span>
            <div class="hp"><div class="hp-fill" :style="{ width: a.hpPct + '%', background: hpColor(a.hpPct) }"></div></div>
            <span class="hp-text">{{ a.hp }}/{{ a.maxHp }}</span>
          </div>
          <div v-if="a.lastThought" class="thought">“{{ a.lastThought }}”</div>
        </button>
        <div v-if="!rows.length" class="empty">没有匹配的电信号</div>
      </div>
    </div>

    <aside v-if="detail" class="detail">
      <header>
        <div>
          <h4>{{ detail.name }}</h4>
          <div class="sub">{{ detail.subtitle }} · {{ KIND_LABEL[detail.kind] }}</div>
        </div>
        <button class="close" @click="$emit('select', '')" aria-label="关闭">✕</button>
      </header>
      <div class="stat-grid">
        <div><label>位置</label><span>{{ detail.location }}</span></div>
        <div><label>生命</label><span>{{ detail.hp }}/{{ detail.maxHp }}</span></div>
        <div><label>攻击</label><span>{{ detail.atk }}</span></div>
        <div><label>防御</label><span>{{ detail.def }}</span></div>
        <div v-if="detail.level"><label>等级</label><span>{{ detail.level }}</span></div>
        <div v-if="detail.embersText"><label>火种</label><span>{{ detail.embersText }}</span></div>
      </div>
      <p v-if="detail.lastThought" class="quote">“{{ detail.lastThought }}”</p>
      <section v-if="detail.gear"><h5>装备</h5><p>{{ detail.gear }}</p></section>
      <section><h5>背包</h5><p>{{ detail.inventory || '空' }}</p></section>
      <section v-if="detail.allies"><h5>盟友</h5><p>{{ detail.allies }}</p></section>
      <section v-if="detail.relations"><h5>关系</h5><p>{{ detail.relations }}</p></section>
      <section v-if="detail.respect"><h5>对黄金裔的认可</h5><p>{{ detail.respect }}</p></section>
      <section v-if="detail.lastActions.length">
        <h5>最近行动</h5>
        <ul><li v-for="(t, i) in detail.lastActions" :key="i">{{ t }}</li></ul>
      </section>
      <section v-if="detail.summary"><h5>往事</h5><p class="muted">{{ detail.summary }}</p></section>
      <section v-if="detail.memory.length">
        <h5>记忆</h5>
        <ul class="memory"><li v-for="(m, i) in detail.memory" :key="i"><b>D{{ m.day }}</b> {{ m.text }}</li></ul>
      </section>
      <div class="counters">
        行动 {{ detail.counters.actions }} · 失败 {{ detail.counters.failures }} · 伤害 {{ detail.counters.damageDealt }} · 发言 {{ detail.counters.chats }}
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { OmphalosSimulation } from '../../core/llmSimulation';
import { isHeir, isTitan } from '../../core/omphalosWorldState';
import { KIND_LABEL } from './useSimulation';

const props = defineProps<{ sim: OmphalosSimulation; tick: number; selectedId?: string }>();
defineEmits<{ (e: 'select', id: string): void }>();

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
      embers: isHeir(a) ? a.embers.length : 0
    }));
});

const hpColor = (pct: number) => pct > 60 ? '#34d399' : pct > 30 ? '#fbbf24' : '#f43f5e';

const detail = computed(() => {
  void props.tick;
  const s = props.sim.state;
  const a = props.selectedId ? s.agents[props.selectedId] : undefined;
  if (!a) return null;
  const nameOf = (id: string) => s.agents[id]?.name ?? id;
  const mem = props.sim.memoryOf(a.id);
  return {
    ...a,
    atk: props.sim.engine.attackPower(a),
    def: props.sim.engine.defensePower(a),
    level: isHeir(a) ? a.level : 0,
    embersText: isHeir(a) ? (a.embers.map(id => s.embers[id]?.name).join('、') || '无')
      : isTitan(a) ? `${s.embers[a.emberId]?.name}（${a.emberTaken ? '已失去' : '守护中'}）` : '',
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
.agent-panel { display: grid; grid-template-columns: 1fr; gap: 12px; min-height: 0; }
.agent-panel.has-detail { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
@media (max-width: 900px) { .agent-panel.has-detail { grid-template-columns: 1fr; } }
.roster { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.roster-controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; }
.chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip { background: rgba(173, 216, 230, 0.06); border: 1px solid rgba(173, 216, 230, 0.2); color: rgba(173, 216, 230, 0.8); padding: 3px 10px; border-radius: 999px; font-size: 12px; cursor: pointer; }
.chip.active { background: rgba(0, 212, 255, 0.18); border-color: #00d4ff; color: #e0f7ff; }
.count { opacity: 0.6; margin-left: 2px; }
.search { background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(173, 216, 230, 0.2); color: #e0f2fe; border-radius: 6px; padding: 4px 8px; font-size: 12px; min-width: 120px; flex: 1; max-width: 200px; }
.rows { display: flex; flex-direction: column; gap: 6px; }
.row { text-align: left; background: rgba(173, 216, 230, 0.04); border: 1px solid rgba(173, 216, 230, 0.1); border-left: 3px solid rgba(173, 216, 230, 0.3); border-radius: 6px; padding: 7px 10px; cursor: pointer; color: inherit; font: inherit; display: flex; flex-direction: column; gap: 4px; }
.row:hover { background: rgba(173, 216, 230, 0.08); }
.row.selected { border-color: #00d4ff; background: rgba(0, 212, 255, 0.1); }
.row.heir { border-left-color: #f5c542; }
.row.titan { border-left-color: #e879f9; }
.row.down { opacity: 0.55; }
.row-main { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.name { font-weight: 600; color: #e0f2fe; font-size: 13px; }
.sub { font-size: 11px; color: rgba(173, 216, 230, 0.6); }
.embers { font-size: 11px; color: #f5c542; }
.tag-down { font-size: 10px; color: #f43f5e; border: 1px solid #f43f5e; border-radius: 4px; padding: 0 4px; }
.row-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; color: rgba(173, 216, 230, 0.7); }
.loc { min-width: 84px; }
.hp { flex: 1; height: 4px; background: rgba(255, 255, 255, 0.08); border-radius: 2px; overflow: hidden; max-width: 160px; }
.hp-fill { height: 100%; transition: width 0.3s; }
.hp-text { font-variant-numeric: tabular-nums; }
.thought { font-size: 11px; color: rgba(186, 230, 253, 0.6); font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty { font-size: 12px; opacity: 0.6; padding: 12px; }
.detail { background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(0, 212, 255, 0.25); border-radius: 8px; padding: 12px; font-size: 12px; align-self: start; position: sticky; top: 0; max-height: 70vh; overflow-y: auto; min-width: 0; }
.detail header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.detail h4 { margin: 0; color: #e0f2fe; font-size: 16px; }
.close { background: none; border: none; color: rgba(173, 216, 230, 0.7); cursor: pointer; font-size: 14px; }
.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; }
.stat-grid div { background: rgba(173, 216, 230, 0.05); border-radius: 4px; padding: 4px 6px; display: flex; flex-direction: column; }
.stat-grid label { font-size: 10px; opacity: 0.6; }
.stat-grid span { color: #e0f2fe; }
.quote { font-style: italic; color: #bae6fd; border-left: 2px solid #00d4ff; padding-left: 8px; margin: 8px 0; }
.detail section { margin-top: 8px; }
.detail h5 { margin: 0 0 3px; font-size: 11px; color: rgba(0, 212, 255, 0.8); font-weight: 600; }
.detail p { margin: 0; line-height: 1.5; word-break: break-all; }
.detail ul { margin: 0; padding-left: 16px; line-height: 1.5; }
.memory b { color: rgba(0, 212, 255, 0.7); font-weight: 500; }
.muted { opacity: 0.75; }
.counters { margin-top: 10px; font-size: 11px; opacity: 0.55; }
</style>
