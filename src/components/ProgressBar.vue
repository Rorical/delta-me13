<template>
  <div class="progress-section">
    <div class="track">
      <div class="fill" :style="{ width: progress + '%' }"></div>
      <div class="marker" :style="{ left: progress + '%' }"></div>
    </div>
    <div class="cap">
      <svg class="spinner" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" class="ring-bg" />
        <path d="M12 3 A9 9 0 0 1 21 12" class="ring-arc" />
      </svg>
      <span class="percent">{{ Math.round(progress) }}<small>%</small></span>
      <span class="label">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ progress: number; label?: string }>(), { label: '进程：再创世…' });
</script>

<style scoped>
.progress-section {
  display: flex;
  align-items: stretch;
  height: 34px;
  margin-bottom: 26px;
  border-top: 1px solid var(--ui-line);
  border-bottom: 1px solid var(--ui-line);
  background: rgba(10, 16, 40, 0.35);
}

.track {
  position: relative;
  flex: 1;
  overflow: hidden;
}

/* 斜条纹填充，与游戏内进度条一致 */
.fill {
  position: absolute;
  inset: 5px auto 5px 0;
  background: repeating-linear-gradient(115deg,
    rgba(196, 230, 244, 0.85) 0 6px,
    rgba(196, 230, 244, 0.25) 6px 11px);
  box-shadow: 0 0 12px rgba(173, 216, 230, 0.35);
  transition: width 0.3s ease;
}

.marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--ui-accent);
  box-shadow: 0 0 8px var(--ui-accent);
  transition: left 0.3s ease;
}

.cap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  background: rgba(5, 10, 28, 0.85);
  border-left: 1px solid var(--ui-line);
  white-space: nowrap;
}

.spinner {
  width: 24px;
  height: 24px;
  animation: spin 1.6s linear infinite;
}

.ring-bg {
  fill: none;
  stroke: rgba(173, 216, 230, 0.2);
  stroke-width: 2;
}

.ring-arc {
  fill: none;
  stroke: var(--ui-accent);
  stroke-width: 2;
  stroke-linecap: round;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.percent {
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
  color: var(--ui-accent);
  text-shadow: 0 0 10px rgba(173, 216, 230, 0.5);
  font-variant-numeric: tabular-nums;
}

.percent small {
  font-size: 18px;
}

.label {
  font-size: 13px;
  color: var(--ui-muted);
}

@media (max-width: 600px) {
  .label { display: none; }
}
</style>
