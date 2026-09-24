<template>
  <div class="world-map" :class="{ fill }">
    <svg viewBox="0 0 106 78" class="map-svg" role="img" aria-label="翁法罗斯地图">
      <defs>
        <pattern id="om-grid" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M6 0H0V6" fill="none" stroke="rgba(173,216,230,0.06)" stroke-width="0.2" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="106" height="78" fill="url(#om-grid)" />
      <line v-for="([a, b], i) in edges" :key="i"
        :x1="cities[a].map.x" :y1="cities[a].map.y" :x2="cities[b].map.x" :y2="cities[b].map.y"
        class="edge" />
      <g v-for="c in cityList" :key="c.id" class="city-node" :class="{ selected: c.id === selected, fallen: c.fallen }"
        :transform="`translate(${c.map.x}, ${c.map.y})`" @click="$emit('select', c.id)">
        <title>{{ c.name }} · 黑潮 {{ c.darkTide.toFixed(0) }}%</title>
        <circle :r="4 + c.darkTide / 25" class="halo" :style="{ opacity: tideAlpha(c.darkTide) }" />
        <circle r="3" class="core" />
        <circle v-if="c.fallen" r="4.4" class="fallen-ring" />
        <!-- 泰坦：实心菱形=火种仍在守护；空心=火种已被取走；虚线=失神 -->
        <g v-for="(t, i) in c.titans" :key="t.id" :transform="`translate(${(i - (c.titans.length - 1) / 2) * 3.2}, 0)`">
          <path :d="diamond" class="titan-mark"
            :class="{ taken: t.emberTaken, corrupted: t.disposition === 'corrupted', fallen: t.condition === 'fallen' }" />
        </g>
        <path v-if="c.id === RECREATION_SITE" :d="star" class="site-mark" />
        <text y="8.2" class="label">{{ c.name }}</text>
        <g v-if="c.people > 0" transform="translate(3.6,-3.4)">
          <rect x="-2.2" y="-1.6" width="4.4" height="3.2" rx="0.6" class="badge" :class="{ heir: c.heirs > 0 }" />
          <text y="0.8" class="badge-text">{{ c.people }}</text>
        </g>
      </g>
    </svg>
    <div class="legend">
      <span><svg viewBox="-2 -2 4 4"><path :d="diamond" class="titan-mark" /></svg>泰坦守护火种</span>
      <span><svg viewBox="-2 -2 4 4"><path :d="diamond" class="titan-mark taken" /></svg>火种已取走</span>
      <span><svg viewBox="-2 -2 4 4"><path :d="diamond" class="titan-mark corrupted" /></svg>失神泰坦</span>
      <span><svg viewBox="-3 -3 6 6"><circle r="2.6" class="halo" style="opacity:.6" /></svg>光晕越浓，黑潮越深</span>
      <span><svg viewBox="-3 -2 6 4"><rect x="-2.2" y="-1.6" width="4.4" height="3.2" rx="0.6" class="badge heir" /></svg>在场人数（含黄金裔）</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { OmphalosWorldState, TitanStatus } from '../../core/omphalosWorldState';
import { getCityEdges, RECREATION_SITE } from '../../core/config/cities';
import { tideAlpha } from './useSimulation';

const props = defineProps<{ state: OmphalosWorldState; tick: number; selected?: string; fill?: boolean }>();
defineEmits<{ (e: 'select', id: string): void }>();

const edges = getCityEdges();
const diamond = 'M0,-1.8 L1.4,0 L0,1.8 L-1.4,0 Z';
const star = 'M0,-2 L0.5,-0.5 L2,0 L0.5,0.5 L0,2 L-0.5,0.5 L-2,0 L-0.5,-0.5 Z';
const cities = computed(() => { void props.tick; return props.state.cities; });

const cityList = computed(() => {
  void props.tick;
  const agents = Object.values(props.state.agents);
  return Object.values(props.state.cities).map(c => {
    const present = agents.filter(a => a.location === c.id && a.condition === 'active' && a.kind !== 'titan');
    return {
      ...c,
      titans: c.titanIds.map(id => props.state.agents[id] as TitanStatus).filter(Boolean),
      heirs: present.filter(a => a.kind === 'heir').length,
      people: present.length
    };
  });
});
</script>

<style scoped>
.world-map { display: flex; flex-direction: column; gap: 8px; }
.world-map.fill { height: 100%; }
.world-map.fill .map-svg { flex: 1; min-height: 0; height: 100%; max-height: none; }
.map-svg { width: 100%; max-height: 480px; border: 1px solid var(--ui-line); background: rgba(0, 0, 0, 0.12); }
.edge { stroke: rgba(173, 216, 230, 0.25); stroke-width: 0.3; stroke-dasharray: 1 0.8; }
.city-node { cursor: pointer; }
.halo { fill: rgba(173, 216, 230, 1); transition: opacity 0.6s ease, r 0.6s ease; }
.core { fill: #0d1330; stroke: rgba(173, 216, 230, 0.6); stroke-width: 0.35; transition: stroke 0.3s ease; }
.city-node:hover .core, .city-node.selected .core { stroke: rgba(173, 216, 230, 1); stroke-width: 0.6; filter: drop-shadow(0 0 1.5px rgba(173, 216, 230, 0.9)); }
.fallen-ring { fill: none; stroke: rgba(173, 216, 230, 0.9); stroke-width: 0.3; stroke-dasharray: 0.6 0.6; }
.city-node.fallen .core { fill: rgba(173, 216, 230, 0.25); }
.titan-mark { fill: rgba(173, 216, 230, 0.95); stroke: #0d1330; stroke-width: 0.25; }
.titan-mark.taken { fill: #0d1330; stroke: rgba(173, 216, 230, 0.8); stroke-width: 0.3; }
.titan-mark.corrupted { stroke: rgba(173, 216, 230, 0.95); stroke-width: 0.35; stroke-dasharray: 0.5 0.35; fill: rgba(173, 216, 230, 0.35); }
.titan-mark.fallen { opacity: 0.35; }
.site-mark { fill: rgba(173, 216, 230, 0.95); }
.label { font-size: 2.4px; fill: rgba(173, 216, 230, 0.85); text-anchor: middle; pointer-events: none; font-family: var(--ui-font); }
.city-node.selected .label { fill: rgba(220, 240, 250, 1); }
.badge { fill: #0d1330; stroke: rgba(173, 216, 230, 0.5); stroke-width: 0.2; }
.badge.heir { stroke: rgba(173, 216, 230, 1); fill: rgba(173, 216, 230, 0.25); }
.badge-text { font-size: 2.1px; fill: rgba(220, 240, 250, 1); text-anchor: middle; pointer-events: none; font-family: var(--ui-font); }
.legend { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 11px; color: rgba(173, 216, 230, 0.6); }
.legend span { display: inline-flex; align-items: center; gap: 5px; }
.legend svg { width: 12px; height: 12px; overflow: visible; }
</style>
