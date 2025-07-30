<template>
  <div class="progress-section">
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        <div class="progress-glow" :style="{ left: progress + '%' }"></div>
        <div class="progress-particles">
          <div v-for="n in 5" :key="n" class="progress-particle" 
               :style="{ animationDelay: (n * 0.2) + 's' }"></div>
        </div>
      </div>
      <div class="progress-text">{{ Math.round(progress) }}%</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  progress: number
}

defineProps<Props>()
</script>

<style scoped>
.progress-section {
  margin-bottom: 30px;
}

.progress-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(173, 216, 230, 0.03);
  border: 1px solid rgba(173, 216, 230, 0.08);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(173, 216, 230, 0.2), rgba(173, 216, 230, 0.4));
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-glow {
  position: absolute;
  top: 0;
  width: 4px;
  height: 100%;
  background: rgba(173, 216, 230, 0.8);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(173, 216, 230, 0.6);
  transition: left 0.3s ease;
}

.progress-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.progress-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(173, 216, 230, 0.8);
  border-radius: 50%;
  top: 50%;
  transform: translateY(-50%);
  animation: particle-move 3s infinite linear;
  box-shadow: 0 0 8px rgba(173, 216, 230, 0.6);
}

@keyframes particle-move {
  0% { left: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 100%; opacity: 0; }
}

@keyframes progress-shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  position: absolute;
  right: 0;
  top: -25px;
  font-size: 12px;
  color: rgba(173, 216, 230, 0.8);
  text-shadow: 0 0 10px rgba(173, 216, 230, 0.5);
}
</style> 