<template>
  <div class="board">
    <div class="ember-grid">
      <button v-for="e in embers" :key="e.id" class="ember-cell" :class="e.state" @click="$emit('agent', e.holderId || e.titanId)">
        <svg viewBox="-2 -2 4 4" class="glyph"><path d="M0,-1.8 L1.4,0 L0,1.8 L-1.4,0 Z" /></svg>
        <div>
          <b>{{ e.name }}</b>
          <small>{{ e.state === 'returned' ? `已由${e.holder}归还` : e.state === 'held' ? `${e.holder} 携带中` : `${e.titan}守护中` }}</small>
        </div>
      </button>
    </div>
    <h5><InfinityIcon :size="12" /> 永劫回归</h5>
    <ol class="eras">
      <li v-for="r in eras" :key="r.era">
        <b>第{{ r.era }}纪元</b> · {{ r.days }}天 · 归还 {{ r.embers }}/12 · {{ r.outcome === 'recreation' ? '再创世' : '黑潮吞没' }}
        <div class="om-muted">{{ r.summary }}</div>
      </li>
      <li v-if="!eras.length" class="om-muted">第一个纪元。十二火种尽数归还创世涡心即完成再创世；若黑潮吞没世界，永劫回归将再度开启。</li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Infinity as InfinityIcon } from 'lucide-vue-next';
import type { OmphalosWorldState } from '../../core/omphalosWorldState';

const props = defineProps<{ state: OmphalosWorldState; tick: number }>();
defineEmits<{ (e: 'agent', id: string): void }>();

const embers = computed(() => {
  void props.tick;
  const s = props.state;
  return Object.values(s.embers).map(e => ({
    id: e.id,
    name: e.name,
    state: e.returned ? 'returned' : e.holderId ? 'held' : 'guarded',
    holderId: e.holderId,
    titanId: e.titanId,
    holder: e.holderId ? s.agents[e.holderId]?.name : '',
    titan: s.agents[e.titanId]?.name ?? ''
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
.returned path { fill: var(--ui-select-text); stroke: var(--ui-select-text); }
h5 { display: flex; align-items: center; gap: 5px; margin: 16px 0 6px; font-size: 13px; font-weight: 600; }
.eras { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 8px; line-height: 1.6; font-size: 13px; }
</style>
