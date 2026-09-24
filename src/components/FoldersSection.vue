<template>
  <div class="rack" @mouseleave="hovered = -1; $emit('folder-leave')">
    <div class="scanlines"></div>
    <i v-for="(g, i) in glitches" :key="'g' + i" class="glitch" :style="g"></i>

    <svg class="frames" viewBox="0 0 1000 180" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="rack-plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgb(173,216,230)" stop-opacity="0.10" />
          <stop offset="1" stop-color="rgb(173,216,230)" stop-opacity="0.02" />
        </linearGradient>
        <linearGradient id="rack-plate-group" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgb(150,205,235)" stop-opacity="0.30" />
          <stop offset="1" stop-color="rgb(150,205,235)" stop-opacity="0.08" />
        </linearGradient>
        <linearGradient id="rack-plate-active" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="rgb(170,220,245)" stop-opacity="0.55" />
          <stop offset="0.6" stop-color="rgb(90,160,215)" stop-opacity="0.30" />
          <stop offset="1" stop-color="rgb(60,120,190)" stop-opacity="0.18" />
        </linearGradient>
        <radialGradient id="rack-glow">
          <stop offset="0" stop-color="rgb(190,232,250)" stop-opacity="0.75" />
          <stop offset="0.45" stop-color="rgb(120,190,235)" stop-opacity="0.25" />
          <stop offset="1" stop-color="rgb(120,190,235)" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- 选中组背后的光晕 -->
      <ellipse :cx="activeCenter * 10" cy="105" rx="95" ry="85" fill="url(#rack-glow)" class="glow" />

      <g v-for="f in frames" :key="f.i" class="frame" :class="f.state" :style="{ transform: f.transform }">
        <path :d="f.outer" class="plate" />
        <path :d="f.inner" class="inset" />
      </g>
    </svg>

    <!-- 选中组：光束、星芒、文件夹图标与标注 -->
    <div class="beam" :style="{ left: activeCenter + '%' }"></div>
    <div class="sparkle" :style="{ left: activeCenter + '%' }"></div>
    <div class="active-icon" :style="{ left: activeCenter + '%' }">
      <FolderOpen :size="46" :stroke-width="1.4" />
    </div>
    <div class="callout" :style="{ left: activeCenter + '%' }">
      <span>{{ folders[selectedFolder]?.name }}</span>
      <i class="pointer"></i>
    </div>

    <!-- 每个文件夹组的点击区域；未选中组显示小图标与悬停标签 -->
    <button v-for="(folder, index) in folders" :key="folder.name" class="hit"
      :class="{ active: index === selectedFolder }"
      :style="{ left: groupLeft(index) + '%', width: groupWidth + '%' }"
      :aria-label="folder.name" :aria-pressed="index === selectedFolder"
      @click="$emit('select-folder', index)"
      @mouseenter="hovered = index; $emit('folder-hover', index)">
      <Folder v-if="index !== selectedFolder" :size="22" :stroke-width="1.4" class="small-icon" />
      <span v-if="index !== selectedFolder" class="hover-label" :class="{ show: hovered === index }">{{ folder.name }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Folder, FolderOpen } from 'lucide-vue-next'
import { GROUP_SIZE, RACK_SLOTS, groupCenterPercent, groupStartSlot } from './archiveRack'

interface FolderData {
  name: string
  icon: string
  files: Array<{ name: string; content: string }>
}

const props = defineProps<{ folders: FolderData[]; selectedFolder: number }>()

defineEmits<{
  'select-folder': [index: number]
  'folder-hover': [index: number]
  'folder-leave': []
}>()

const hovered = ref(-1)
const slotW = 1000 / RACK_SLOTS
const groupWidth = (GROUP_SIZE / RACK_SLOTS) * 100

const groupLeft = (index: number) => (groupStartSlot(index, props.folders.length) / RACK_SLOTS) * 100
const activeCenter = computed(() => groupCenterPercent(props.selectedFolder, props.folders.length))

// 带切角的档案板：左缘最高，顶边微微下斜，右上角切角
function plate(x: number, w: number, top: number, bottom: number, inset = 0): string {
  const l = x + inset, r = x + w - inset
  const t = top + inset, b = bottom - inset
  const chamfer = Math.min(18, (b - t) * 0.14)
  return `M${l},${t} L${r - chamfer * 0.9},${t + 4} L${r},${t + 4 + chamfer} L${r},${b - 3} L${l},${b} Z`
}

const frames = computed(() => {
  const count = props.folders.length
  const owner = new Map<number, number>()
  props.folders.forEach((_, g) => {
    const start = groupStartSlot(g, count)
    for (let k = 0; k < GROUP_SIZE; k++) owner.set(start + k, g)
  })
  return Array.from({ length: RACK_SLOTS }, (_, i) => {
    const g = owner.get(i)
    const state = g === undefined ? 'idle' : g === props.selectedFolder ? 'active' : hovered.value === g ? 'group hover' : 'group'
    const x = i * slotW + 2
    const w = slotW * 1.05
    const transform = state === 'active' ? 'scale(1.1, 1.2)' : state.includes('hover') ? 'scale(1.03, 1.08)' : 'none'
    return { i, state, transform, outer: plate(x, w, 44, 172), inner: plate(x, w, 44, 172, 4) }
  })
})

// 零星闪烁的故障色块
const glitches = Array.from({ length: 7 }, (_, i) => ({
  left: `${(i * 37 + 11) % 96}%`,
  top: `${(i * 23 + 8) % 80}%`,
  width: `${14 + (i * 13) % 40}px`,
  height: `${3 + (i % 3) * 3}px`,
  animationDelay: `${(i * 0.7) % 4}s`
}))
</script>

<style scoped>
.rack {
  position: relative;
  height: 172px;
  margin: 12px 0 0;
  overflow: visible;
}

.scanlines {
  position: absolute;
  inset: 14px 0 0;
  background: repeating-linear-gradient(0deg, rgba(173, 216, 230, 0.035) 0 1px, transparent 1px 4px);
  pointer-events: none;
}

.glitch {
  position: absolute;
  background: rgba(173, 216, 230, 0.18);
  animation: blink 4.5s steps(1) infinite;
  pointer-events: none;
}

@keyframes blink {
  0%, 100% { opacity: 0.2; }
  8% { opacity: 0.9; }
  12% { opacity: 0.1; }
  55% { opacity: 0.5; }
}

.frames {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.glow {
  transition: cx 0.45s ease;
  animation: glow-pulse 3s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}

.frame {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.plate {
  fill: url(#rack-plate);
  stroke: rgba(196, 230, 244, 0.28);
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}

.inset {
  fill: none;
  stroke: rgba(196, 230, 244, 0.12);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.frame.group .plate {
  fill: url(#rack-plate-group);
  stroke: rgba(210, 238, 250, 0.7);
  stroke-width: 1.6;
}

.frame.group .inset {
  stroke: rgba(210, 238, 250, 0.3);
}

.frame.active .plate {
  fill: url(#rack-plate-active);
  stroke: rgba(236, 248, 253, 0.95);
  stroke-width: 2.2;
  filter: drop-shadow(0 0 6px rgba(173, 216, 230, 0.8));
}

.frame.active .inset {
  stroke: rgba(236, 248, 253, 0.55);
}

.beam {
  position: absolute;
  top: 16px;
  bottom: -40px;
  width: 1px;
  background: linear-gradient(180deg, rgba(236, 248, 253, 0.9), rgba(236, 248, 253, 0.6));
  box-shadow: 0 0 6px rgba(173, 216, 230, 0.9);
  transition: left 0.45s ease;
  pointer-events: none;
  z-index: 3;
}

.sparkle {
  position: absolute;
  top: 92px;
  width: 150px;
  height: 150px;
  margin: -75px 0 0 -75px;
  background:
    linear-gradient(90deg, transparent 0 49%, rgba(236, 248, 253, 0.55) 50%, transparent 51%) center / 100% 2px no-repeat,
    linear-gradient(0deg, transparent 0 49%, rgba(236, 248, 253, 0.35) 50%, transparent 51%) center / 2px 100% no-repeat;
  clip-path: polygon(50% 0, 56% 44%, 100% 50%, 56% 56%, 50% 100%, 44% 56%, 0 50%, 44% 44%);
  opacity: 0.8;
  transition: left 0.45s ease;
  animation: sparkle-spin 9s linear infinite;
  pointer-events: none;
  z-index: 2;
}

@keyframes sparkle-spin {
  from { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(45deg) scale(0.85); }
  to { transform: rotate(90deg) scale(1); }
}

.active-icon {
  position: absolute;
  top: 92px;
  transform: translate(-50%, -50%);
  color: #fff;
  filter: drop-shadow(0 0 10px rgba(190, 232, 250, 0.95));
  transition: left 0.45s ease;
  pointer-events: none;
  z-index: 4;
}

.active-icon :deep(svg) {
  fill: rgba(255, 255, 255, 0.92);
}

.callout {
  position: absolute;
  top: -12px;
  transform: translateX(-50%);
  padding: 4px 26px;
  font-size: 15px;
  white-space: nowrap;
  color: var(--ui-text);
  background: rgba(173, 216, 230, 0.16);
  border: 1px solid rgba(173, 216, 230, 0.2);
  transition: left 0.45s ease;
  pointer-events: none;
  z-index: 5;
}

.pointer {
  position: absolute;
  left: 50%;
  bottom: -9px;
  margin-left: -8px;
  border: 8px solid transparent;
  border-bottom: none;
  border-top-color: rgba(236, 248, 253, 0.95);
}

.hit {
  position: absolute;
  top: 38px;
  bottom: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  z-index: 6;
}

.hit.active {
  cursor: default;
}

.small-icon {
  position: absolute;
  left: 50%;
  top: 62%;
  transform: translate(-50%, -50%);
  color: rgba(214, 240, 250, 0.85);
  filter: drop-shadow(0 0 4px rgba(173, 216, 230, 0.6));
  transition: transform 0.25s ease;
}

.hit:hover .small-icon {
  transform: translate(-50%, -50%) scale(1.15);
}

.hover-label {
  position: absolute;
  left: 50%;
  top: -24px;
  transform: translateX(-50%);
  font-size: 14px;
  white-space: nowrap;
  color: var(--ui-muted);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.hover-label.show {
  opacity: 1;
}

@media (max-width: 768px) {
  .rack { height: 148px; }
  .sparkle, .active-icon { top: 80px; }
  .sparkle { width: 110px; height: 110px; margin: -55px 0 0 -55px; }
  .callout { font-size: 13px; padding: 3px 14px; }
}
</style>
