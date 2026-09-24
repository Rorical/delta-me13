<template>
  <div class="board">
    <div class="ember-grid">
      <button v-for="e in embers" :key="e.id" class="ember-cell" :class="e.state" @click="$emit('agent', e.holderId || e.titanId)">
        <svg viewBox="-2 -2 4 4" class="glyph"><path d="M0,-1.8 L1.4,0 L0,1.8 L-1.4,0 Z" /></svg>
        <div>
          <b>{{ e.name }}</b>
          <small>{{ e.state === 'returned' ? `${e.owner}已成为半神` : e.state === 'stolen' ? '被盗火行者夺走' : e.state === 'held' ? `${e.holder} 携带中` : `${e.titan}守护中` }}</small>
        </div>
      </button>
    </div>
    <h5><InfinityIcon :size="12" /> 永劫回归</h5>
    <ol class="eras">
      <li v-for="r in eras" :key="r.era">
        <b>第{{ r.era }}纪元</b> · {{ r.days }}天 · 归还 {{ r.embers }}/12 · {{ OUTCOME_LABEL[r.outcome] }}
        <div class="om-muted">{{ r.summary }}</div>
      </li>
      <li v-if="!eras.length" class="om-muted">第一个纪元。十二火种归还创世涡心后，铁墓将会降临；击碎铁墓才能打破永劫回归。若黑潮吞没世界或最终之战落败，轮回重启并留下轮回印记。</li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Infinity as InfinityIcon } from 'lucide-vue-next';
import { isEnemy, type OmphalosWorldState } from '../../core/omphalosWorldState';

const OUTCOME_LABEL: Record<string, string> = { recreation: '再创世', collapse: '永劫回归', liberation: '打破轮回' };

const props = defineProps<{ state: OmphalosWorldState; tick: number }>();
defineEmits<{ (e: 'agent', id: string): void }>();

const embers = computed(() => {
  void props.tick;
  const s = props.state;
  return Object.values(s.embers).map(e => ({
    id: e.id,
    name: e.name,
    state: e.returned ? 'returned' : e.holderId ? (isEnemy(s.agents[e.holderId]) ? 'stolen' : 'held') : 'guarded',
    holderId: e.holderId,
    titanId: e.titanId,
    holder: e.holderId ? s.agents[e.holderId]?.name : '',
    titan: s.agents[e.titanId]?.name ?? '',
    owner: Object.values(s.agents).find(a => a.kind === 'heir' && a.path === e.path)?.name ?? '主人'
  }));
});

const eras = computed(() => { void props.tick; return [...props.state.eraHistory].reverse(); });
</script>

<style scoped>
.ember-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.ember-cell { display: flex; gap: 8px; align-items: center; border: 1px solid var(--om-line); background: transparent; padding: 6px 8px; text-align: left; color: var(--om-text); font-family: inherit; cursor: pointer; }
.ember-cell:hover { background: rgba(173, 216, 230, 0.08); }
.ember-cell b { font-size: 12px; display: block; }
.ember-cell small { font-size: 11px; color: var(--om-muted); }
.glyph { width: 14px; height: 14px; flex-shrink: 0; overflow: visible; }
.glyph path { fill: none; stroke: rgba(173, 216, 230, 0.4); stroke-width: 0.3; }
.held { border-color: rgba(173, 216, 230, 0.45); }
.held path { stroke: rgba(173, 216, 230, 0.95); stroke-dasharray: 0.5 0.3; }
.returned { background: var(--ui-select); border-color: var(--ui-select); color: var(--ui-select-text); }
.returned:hover { background: var(--ui-accent); }
.returned small { color: rgba(11, 22, 51, 0.68); }
.stolen { border-style: dashed; border-color: rgba(173, 216, 230, 0.6); }
.stolen path { stroke-dasharray: 0.2 0.3; }
.returned path { fill: var(--ui-select-text); stroke: var(--ui-select-text); }
h5 { display: flex; align-items: center; gap: 5px; margin: 16px 0 6px; font-size: 13px; font-weight: 600; }
.eras { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 8px; line-height: 1.6; font-size: 13px; }
</style>
