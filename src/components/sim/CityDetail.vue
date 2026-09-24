<template>
  <div v-if="city" class="city">
    <div class="head">
      <Castle :size="18" />
      <div class="head-text">
        <div class="name">{{ city.name }}</div>
        <div class="sub">{{ city.type }}</div>
      </div>
      <span class="om-tag" :class="{ strong: city.darkTide >= 45 }"><Waves :size="11" />{{ city.darkTide.toFixed(1) }}% · {{ city.fallen ? '已沦陷' : tideLabel(city.darkTide) }}</span>
    </div>
    <div class="om-inner desc">{{ city.description }}</div>
    <div class="om-bar" :class="{ hazard: city.darkTide >= 45 }"><i :style="{ width: city.darkTide + '%' }"></i></div>
    <dl>
      <dt>人口</dt><dd>{{ city.population.toLocaleString() }}</dd>
      <dt>繁荣</dt><dd>{{ city.prosperity }}</dd>
      <dt>城防</dt><dd>城墙 {{ city.walls }} · 瞭望塔 {{ city.watchtowers }}</dd>
      <dt>库存</dt><dd>食物 {{ city.resources.food }} · 材料 {{ city.resources.materials }} · 魔力 {{ city.resources.mana }}</dd>
      <dt>相邻</dt><dd><span v-for="n in city.neighbors" :key="n" class="link" @click="$emit('city', n)">{{ n }}</span></dd>
    </dl>
    <button v-for="t in city.titans" :key="t.id" class="om-item titan" @click="$emit('agent', t.id)">
      <Crown :size="15" />
      <div>
        <div class="titan-name">{{ t.subtitle }}</div>
        <div class="om-muted small">
          {{ DISPOSITION_LABEL[t.disposition] }} · HP {{ t.hp }}/{{ t.maxHp }} ·
          {{ t.condition === 'fallen' ? '已陨落' : t.emberTaken ? '火种已被取走' : '守护着火种' }}
        </div>
      </div>
    </button>
    <h5><Users :size="12" /> 此地之人 <small>{{ city.present.length }}</small></h5>
    <div class="present">
      <button v-for="a in city.present" :key="a.id" class="om-item person" :class="{ heir: a.kind === 'heir' }" @click="$emit('agent', a.id)">
        {{ a.name }}<small>{{ a.subtitle }}</small>
      </button>
      <span v-if="!city.present.length" class="om-muted small">此地空无一人</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Castle, Crown, Users, Waves } from 'lucide-vue-next';
import { isTitan, type OmphalosWorldState, type TitanStatus } from '../../core/omphalosWorldState';
import { DISPOSITION_LABEL, tideLabel } from './useSimulation';

const props = defineProps<{ state: OmphalosWorldState; tick: number; cityId: string }>();
defineEmits<{ (e: 'agent', id: string): void; (e: 'city', id: string): void }>();

const city = computed(() => {
  void props.tick;
  const c = props.state.cities[props.cityId];
  if (!c) return null;
  return {
    ...c,
    titans: c.titanIds.map(id => props.state.agents[id] as TitanStatus).filter(Boolean),
    present: Object.values(props.state.agents)
      .filter(a => a.location === c.id && !isTitan(a))
      .map(a => ({ id: a.id, name: a.name, kind: a.kind, subtitle: a.subtitle }))
  };
});
</script>

<style scoped>
.city { font-size: 13px; }
.head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.head-text { flex: 1; }
.name { font-size: 20px; font-weight: 600; }
.sub { color: var(--om-muted); font-size: 12px; }
.desc { font-size: 14px; line-height: 1.75; margin-bottom: 10px; }
dl { display: grid; grid-template-columns: 40px 1fr; gap: 5px 8px; margin: 12px 0; }
dt { color: var(--om-muted); }
dd { margin: 0; display: flex; flex-wrap: wrap; gap: 4px 10px; }
.link { cursor: pointer; text-decoration: underline dotted rgba(173, 216, 230, 0.5); }
.titan { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; margin-bottom: 6px; width: 100%; }
.titan-name { font-weight: 600; }
.small { font-size: 11px; }
h5 { display: flex; align-items: center; gap: 5px; margin: 14px 0 6px; font-size: 13px; font-weight: 600; }
h5 small { color: var(--om-muted); font-weight: normal; }
.present { display: flex; flex-wrap: wrap; gap: 6px; }
.person { padding: 4px 8px; font-size: 13px; display: flex; flex-direction: column; }
.person small { font-size: 10px; color: var(--om-muted); }
.person.heir { border-color: rgba(214, 240, 250, 0.55); }
</style>
