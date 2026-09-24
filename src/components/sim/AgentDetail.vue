<template>
  <div v-if="d" class="detail">
    <div class="head">
      <component :is="kindIcon[d.kind]" :size="18" />
      <div class="head-text">
        <div class="name">{{ d.name }} <small v-if="d.codename">{{ d.codename }}</small></div>
        <div class="sub">{{ d.subtitle }} · {{ KIND_LABEL[d.kind] }}</div>
      </div>
      <button class="om-btn icon-only" @click="$emit('close')" aria-label="关闭"><X :size="14" /></button>
    </div>
    <div class="stat-grid">
      <div><label>位置</label><span class="link" @click="$emit('city', d.location)">{{ d.location }}</span></div>
      <div><label>生命</label><span>{{ d.hp }}/{{ d.maxHp }}</span></div>
      <div><label>攻击 / 防御</label><span>{{ d.atk }} / {{ d.def }}</span></div>
      <div v-if="d.level"><label>等级</label><span>{{ d.level }}</span></div>
      <div v-if="d.embersText" class="wide"><label>火种</label><span>{{ d.embersText }}</span></div>
    </div>
    <p v-if="d.lastThought" class="om-inner quote">「{{ d.lastThought }}」</p>
    <dl>
      <template v-if="d.demigodText"><dt>神权</dt><dd>{{ d.demigodText }}</dd></template>
      <template v-if="d.gear"><dt>装备</dt><dd>{{ d.gear }}</dd></template>
      <dt>背包</dt><dd>{{ d.inventory || '空' }}</dd>
      <template v-if="d.allies"><dt>盟友</dt><dd>{{ d.allies }}</dd></template>
      <template v-if="d.relations"><dt>关系</dt><dd>{{ d.relations }}</dd></template>
      <template v-if="d.respect"><dt>认可</dt><dd>{{ d.respect }}</dd></template>
    </dl>
    <template v-if="d.lastActions.length">
      <h5><Activity :size="12" /> 最近行动</h5>
      <ul><li v-for="(t, i) in d.lastActions" :key="i">{{ t }}</li></ul>
    </template>
    <template v-if="d.summary">
      <h5><ScrollText :size="12" /> 往事</h5>
      <p class="om-muted">{{ d.summary }}</p>
    </template>
    <template v-if="d.memory.length">
      <h5><Brain :size="12" /> 记忆</h5>
      <ul class="memory"><li v-for="(m, i) in d.memory" :key="i"><b>D{{ m.day }}</b> {{ m.text }}</li></ul>
    </template>
    <div class="counters">
      行动 {{ d.counters.actions }} / 失败 {{ d.counters.failures }} / 伤害 {{ d.counters.damageDealt }} / 发言 {{ d.counters.chats }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Activity, Brain, Crown, ScrollText, Sparkles, User, X } from 'lucide-vue-next';
import type { OmphalosSimulation } from '../../core/llmSimulation';
import { isHeir, isTitan } from '../../core/omphalosWorldState';
import { GOLDEN_HEIRS } from '../../core/agent/goldenHeirProfiles';
import { KIND_LABEL } from './useSimulation';

const props = defineProps<{ sim: OmphalosSimulation; tick: number; agentId: string }>();
defineEmits<{ (e: 'close'): void; (e: 'city', id: string): void }>();

const kindIcon = { heir: Sparkles, titan: Crown, npc: User };

const d = computed(() => {
  void props.tick;
  const s = props.sim.state;
  const a = s.agents[props.agentId];
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
    memory: mem.recent(14).reverse()
  };
});
</script>

<style scoped>
.detail { font-size: 13px; }
.head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.head-text { flex: 1; min-width: 0; }
.name { font-size: 20px; font-weight: 600; }
.name small { font-size: 12px; font-weight: normal; color: var(--om-muted); margin-left: 6px; }
.sub { color: var(--om-muted); font-size: 12px; }
.stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 10px; }
.stat-grid div { border: 1px solid var(--om-line-strong); background: var(--ui-fill-inner); padding: 5px 8px; display: flex; flex-direction: column; min-width: 0; }
.stat-grid .wide { grid-column: 1 / -1; }
.stat-grid label { font-size: 11px; color: var(--om-muted); }
.link { cursor: pointer; text-decoration: underline dotted rgba(173, 216, 230, 0.5); }
.quote { margin: 0 0 12px; font-size: 14px; line-height: 1.6; }
dl { display: grid; grid-template-columns: 40px 1fr; gap: 5px 8px; margin: 0 0 8px; }
dt { color: var(--om-muted); }
dd { margin: 0; word-break: break-all; }
h5 { display: flex; align-items: center; gap: 5px; margin: 14px 0 5px; font-size: 13px; font-weight: 600; border-bottom: 1px solid var(--om-line); padding-bottom: 4px; }
ul { margin: 0; padding-left: 16px; line-height: 1.65; }
p { margin: 0; line-height: 1.65; }
.memory b { font-weight: normal; color: var(--om-muted); }
.counters { margin-top: 14px; font-size: 11px; color: var(--om-faint); }
</style>
