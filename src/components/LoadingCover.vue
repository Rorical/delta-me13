<template>
  <div class="loading-cover" :class="{ 'fade-out': !isVisible }">
    <div class="loading-background"></div>
    <div class="loading-content">
      <div class="logo-container">
        <img src="../assets/logo.png" alt="Logo" class="main-logo" />
        <div class="logo-glow"></div>
      </div>
      
      <div class="title-text">欢迎您，管理员</div>
      <div class="subtitle-text">δ-me13.exe</div>
      
      <button 
        class="enter-button" 
        :class="{ 'ready': isReady }"
        :disabled="!isReady"
        @click="handleEnter">
        <span class="button-text">{{ buttonText }}</span>
        <div class="button-glow"></div>
        <div class="button-particles">
          <div v-for="n in 8" :key="n" class="particle"></div>
        </div>
      </button>
      
      <div class="loading-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="progress-text">{{ Math.round(progress) }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const emit = defineEmits<{
  ready: []
}>()

const isVisible = ref(true)
const isReady = ref(false)
const progress = ref(0)

const buttonText = computed(() => {
  if (progress.value < 100) return '初始化中...'
  return '进入系统'
})

const handleEnter = () => {
  if (!isReady.value) return
  
  isVisible.value = false
  setTimeout(() => {
    emit('ready')
  }, 800) // Wait for fade out animation
}

// Simulate loading progress
const simulateLoading = () => {
  const interval = setInterval(() => {
    progress.value += Math.random() * 15 + 5
    
    if (progress.value >= 100) {
      progress.value = 100
      isReady.value = true
      clearInterval(interval)
    }
  }, 200)
}

onMounted(() => {
  // Start loading simulation
  setTimeout(() => {
    simulateLoading()
  }, 500)
})
</script>

<style scoped>
.loading-cover {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(20px);
  transition: all 0.8s ease-out;
}

.loading-cover.fade-out {
  opacity: 0;
  backdrop-filter: blur(0px);
  pointer-events: none;
}

.loading-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 30% 40%, rgba(173, 216, 230, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 70% 60%, rgba(173, 216, 230, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%);
  animation: background-pulse 4s ease-in-out infinite;
}

@keyframes background-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.loading-content {
  text-align: center;
  z-index: 2;
  position: relative;
}

.logo-container {
  position: relative;
  margin-bottom: 40px;
  display: inline-block;
}

.main-logo {
  width: 120px;
  height: 120px;
  filter: drop-shadow(0 0 20px rgba(173, 216, 230, 0.5));
  animation: logo-float 3s ease-in-out infinite;
}

@keyframes logo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.logo-glow {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: radial-gradient(circle, rgba(173, 216, 230, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.title-text {
  font-size: 32px;
  font-weight: bold;
  color: rgba(173, 216, 230, 0.9);
  margin-bottom: 10px;
  text-shadow: 0 0 20px rgba(173, 216, 230, 0.5);
  animation: text-appear 1s ease-out 0.5s both;
}

.subtitle-text {
  font-size: 18px;
  color: rgba(173, 216, 230, 0.6);
  margin-bottom: 60px;
  font-family: 'Courier New', monospace;
  animation: text-appear 1s ease-out 0.7s both;
}

@keyframes text-appear {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.enter-button {
  position: relative;
  background: rgba(173, 216, 230, 0.1);
  border: 2px solid rgba(173, 216, 230, 0.3);
  color: rgba(173, 216, 230, 0.7);
  padding: 15px 40px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: not-allowed;
  transition: all 0.3s ease;
  overflow: hidden;
  margin-bottom: 40px;
  backdrop-filter: blur(10px);
}

.enter-button.ready {
  background: rgba(173, 216, 230, 0.15);
  border-color: rgba(173, 216, 230, 0.8);
  color: rgba(173, 216, 230, 1);
  cursor: pointer;
  box-shadow: 0 0 30px rgba(173, 216, 230, 0.3);
}

.enter-button.ready:hover {
  background: rgba(173, 216, 230, 0.2);
  box-shadow: 0 0 40px rgba(173, 216, 230, 0.5);
  transform: translateY(-2px);
}

.button-text {
  position: relative;
  z-index: 2;
}

.button-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(173, 216, 230, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.enter-button.ready .button-glow {
  opacity: 1;
  animation: button-shine 2s ease-in-out infinite;
}

@keyframes button-shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.button-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(173, 216, 230, 0.8);
  border-radius: 50%;
  opacity: 0;
}

.enter-button.ready .particle {
  animation: particle-float 3s ease-in-out infinite;
}

.particle:nth-child(1) { top: 20%; left: 10%; animation-delay: 0s; }
.particle:nth-child(2) { top: 30%; left: 80%; animation-delay: 0.5s; }
.particle:nth-child(3) { top: 60%; left: 20%; animation-delay: 1s; }
.particle:nth-child(4) { top: 70%; left: 70%; animation-delay: 1.5s; }
.particle:nth-child(5) { top: 40%; left: 50%; animation-delay: 2s; }
.particle:nth-child(6) { top: 80%; left: 30%; animation-delay: 2.5s; }
.particle:nth-child(7) { top: 15%; left: 60%; animation-delay: 3s; }
.particle:nth-child(8) { top: 50%; left: 90%; animation-delay: 3.5s; }

@keyframes particle-float {
  0%, 100% { 
    opacity: 0; 
    transform: translateY(0); 
  }
  50% { 
    opacity: 1; 
    transform: translateY(-10px); 
  }
}

.loading-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: text-appear 1s ease-out 1s both;
}

.progress-bar {
  width: 300px;
  height: 4px;
  background: rgba(173, 216, 230, 0.1);
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid rgba(173, 216, 230, 0.2);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, 
    rgba(173, 216, 230, 0.3), 
    rgba(173, 216, 230, 0.8), 
    rgba(173, 216, 230, 0.3)
  );
  border-radius: 2px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: progress-shine 1.5s ease-in-out infinite;
}

@keyframes progress-shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  font-size: 14px;
  color: rgba(173, 216, 230, 0.7);
  font-family: 'Courier New', monospace;
}
</style> 