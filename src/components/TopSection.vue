<template>
  <div class="top-section">
    <div class="section-label">
      <span class="label-text">实验档案</span>
      <div class="label-underline"></div>
    </div>
    <div class="progress-status">
      <span class="status-indicator"></span>
      进程：再创世
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or reactive data needed for this component
</script>

<style scoped>
.top-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.section-label {
  position: relative;
  font-size: 18px;
  font-weight: bold;
  color: rgba(173, 216, 230, 0.9);
  padding-bottom: 5px;
}

.label-text {
  position: relative;
  z-index: 2;
}

.label-underline {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, rgba(173, 216, 230, 0.6), transparent);
  animation: underline-pulse 2s ease-in-out infinite;
}

@keyframes underline-glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.progress-status {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(173, 216, 230, 0.7);
}

.status-indicator {
  width: 8px;
  height: 8px;
  background: rgba(173, 216, 230, 0.8);
  border-radius: 50%;
  animation: status-pulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(173, 216, 230, 0.8);
}

@keyframes status-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style> 