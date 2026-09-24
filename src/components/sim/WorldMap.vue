<template>
  <div class="world-map">
    <svg viewBox="0 0 106 76" class="map-svg" role="img" aria-label="翁法罗斯地图">
      <line v-for="([a, b], i) in edges" :key="i"
        :x1="cities[a].map.x" :y1="cities[a].map.y" :x2="cities[b].map.x" :y2="cities[b].map.y"
        class="edge" />
      <g v-for="c in cityList" :key="c.id" class="city-node" :class="{ selected: c.id === selected, fallen: c.fallen }"
        @click="$emit('select', c.id)" :transform="`translate(${c.map.x}, ${c.map.y})`">
        <circle r="5.2" class="halo" :style="{ fill: tideColor(c.darkTide), opacity: 0.12 + c.darkTide / 250 }" />
        <circle r="3.1" class="core" :style="{ stroke: tideColor(c.darkTide) }" />
        <path v-if="c.titan" :d="diamond" class="titan-mark"
          :class="{ taken: c.titan.emberTaken, corrupted: c.titan.disposition === 'corrupted', fallen: c.titan.condition === 'fallen' }" />
        <text y="8.6" class="label">{{ c.name }}</text>
        <g v-if="c.heirs + c.others > 0" transform="translate(3.4,-3.6)">
          <circle r="2.1" class="badge" :class="{ heir: c.heirs > 0 }" />
          <text y="0.75" class="badge-text">{{ c.heirs + c.others }}</text>
        </g>
      </g>
    </svg>
    <div class="legend">
      <span><i class="dot" style="background:#38bdf8"></i>黑潮低</span>
      <span><i class="dot" style="background:#c084fc"></i>侵蚀</span>
      <span><i class="dot" style="background:#f43f5e"></i>危急</span>
      <span><i class="diamond gold"></i>火种在守</span>
      <span><i class="diamond grey"></i>火种已取</span>
      <span><i class="badge-dot"></i>在场人数</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { OmphalosWorldState, TitanStatus } from '../../core/omphalosWorldState';
import { getCityEdges } from '../../core/config/cities';
import { tideColor } from './useSimulation';

const props = defineProps<{ state: OmphalosWorldState; tick: number; selected?: string }>();
defineEmits<{ (e: 'select', id: string): void }>();

const edges = getCityEdges();
const diamond = 'M0,-1.9 L1.6,0 L0,1.9 L-1.6,0 Z';
const cities = computed(() => { void props.tick; return props.state.cities; });

const cityList = computed(() => {
  void props.tick;
  const agents = Object.values(props.state.agents);
  return Object.values(props.state.cities).map(c => {
    const present = agents.filter(a => a.location === c.id && a.condition === 'active' && a.kind !== 'titan');
    return {
      ...c,
      titan: c.titanId ? props.state.agents[c.titanId] as TitanStatus : undefined,
      heirs: present.filter(a => a.kind === 'heir').length,
      others: present.filter(a => a.kind !== 'heir').length
    };
  });
});
</script>

<style scoped>
.world-map { display: flex; flex-direction: column; gap: 8px; }
.map-svg { width: 100%; max-height: 460px; background: radial-gradient(ellipse at 50% 45%, rgba(0, 212, 255, 0.07), transparent 70%); border-radius: 8px; }
.edge { stroke: rgba(173, 216, 230, 0.22); stroke-width: 0.35; stroke-dasharray: 1 0.8; }
.city-node { cursor: pointer; }
.city-node .core { fill: #0b1226; stroke-width: 0.7; transition: r 0.2s; }
.city-node:hover .core, .city-node.selected .core { r: 3.8; }
.city-node.selected .core { fill: rgba(0, 212, 255, 0.25); }
.city-node.fallen .core { fill: #3b0a1a; }
.titan-mark { fill: #f5c542; stroke: #0b1226; stroke-width: 0.3; }
.titan-mark.corrupted { fill: #e879f9; }
.titan-mark.taken { fill: #64748b; }
.titan-mark.fallen { opacity: 0.4; }
.label { font-size: 2.5px; fill: rgba(220, 238, 255, 0.85); text-anchor: middle; pointer-events: none; }
.badge { fill: #1e293b; stroke: rgba(173, 216, 230, 0.6); stroke-width: 0.25; }
.badge.heir { fill: #b45309; stroke: #f5c542; }
.badge-text { font-size: 2.2px; fill: #fff; text-anchor: middle; pointer-events: none; }
.legend { display: flex; flex-wrap: wrap; gap: 10px; font-size: 11px; color: rgba(173, 216, 230, 0.65); }
.legend span { display: inline-flex; align-items: center; gap: 4px; }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.diamond { width: 7px; height: 7px; transform: rotate(45deg); display: inline-block; }
.diamond.gold { background: #f5c542; }
.diamond.grey { background: #64748b; }
.badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #b45309; border: 1px solid #f5c542; display: inline-block; }
</style>
