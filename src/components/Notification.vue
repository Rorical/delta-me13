<template>
  <Transition name="notification" appear>
    <div class="notification" :class="type">
      <div class="notification-content">
        <div class="notification-header">
          <div class="notification-icon">
            <component :is="iconComponent" :size="16" />
          </div>
          <div class="notification-title">{{ title }}</div>
          <button class="notification-close" @click="close">
            <X :size="14" />
          </button>
        </div>
        <div class="notification-message">{{ message }}</div>
      </div>
      <div class="notification-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
        </div>
      </div>
      <div class="notification-glow"></div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-vue-next'

export interface NotificationProps {
  id: string
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const props = withDefaults(defineProps<NotificationProps>(), {
  type: 'info',
  duration: 5000
})

const emit = defineEmits<{
  close: [id: string]
}>()

const iconComponent = computed(() => {
  const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info
  }
  return iconMap[props.type] || Info
})

const progressWidth = ref(100)
let progressInterval: number | null = null
let closeTimeout: number | null = null

const close = () => {
  emit('close', props.id)
}

const startProgress = () => {
  const startTime = Date.now()
  
  progressInterval = window.setInterval(() => {
    const now = Date.now()
    const elapsed = now - startTime
    const remaining = Math.max(0, props.duration - elapsed)
    progressWidth.value = (remaining / props.duration) * 100
    
    if (remaining <= 0) {
      close()
    }
  }, 16) // ~60fps
}

const stopProgress = () => {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
}

onMounted(() => {
  startProgress()
})

onUnmounted(() => {
  stopProgress()
})
</script>

<style scoped>
.notification {
  position: relative;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(173, 216, 230, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  min-width: 320px;
  max-width: 400px;
  backdrop-filter: blur(10px);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.notification::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(173, 216, 230, 0.3), transparent);
}

.notification-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(173, 216, 230, 0.05), transparent);
  pointer-events: none;
  border-radius: 8px;
}

.notification.success {
  border-color: rgba(100, 255, 100, 0.3);
  box-shadow: 0 4px 20px rgba(100, 255, 100, 0.1);
}

.notification.error {
  border-color: rgba(255, 100, 100, 0.3);
  box-shadow: 0 4px 20px rgba(255, 100, 100, 0.1);
}

.notification.warning {
  border-color: rgba(255, 200, 100, 0.3);
  box-shadow: 0 4px 20px rgba(255, 200, 100, 0.1);
}

.notification.info {
  border-color: rgba(173, 216, 230, 0.3);
  box-shadow: 0 4px 20px rgba(173, 216, 230, 0.1);
}

.notification-content {
  position: relative;
  z-index: 1;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(173, 216, 230, 0.1);
  color: rgba(173, 216, 230, 0.8);
  flex-shrink: 0;
}

.notification.success .notification-icon {
  background: rgba(100, 255, 100, 0.1);
  color: rgba(100, 255, 100, 0.8);
}

.notification.error .notification-icon {
  background: rgba(255, 100, 100, 0.1);
  color: rgba(255, 100, 100, 0.8);
}

.notification.warning .notification-icon {
  background: rgba(255, 200, 100, 0.1);
  color: rgba(255, 200, 100, 0.8);
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(173, 216, 230, 0.9);
  flex: 1;
}

.notification-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: rgba(173, 216, 230, 0.5);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.notification-close:hover {
  background: rgba(173, 216, 230, 0.1);
  color: rgba(173, 216, 230, 0.8);
}

.notification-message {
  font-size: 13px;
  color: rgba(173, 216, 230, 0.7);
  line-height: 1.4;
  margin-bottom: 12px;
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(173, 216, 230, 0.1);
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.progress-bar {
  width: 100%;
  height: 100%;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(173, 216, 230, 0.8), rgba(173, 216, 230, 0.4));
  transition: width 0.1s linear;
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
  animation: progress-shimmer 2s infinite;
}

@keyframes progress-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.notification.success .progress-fill {
  background: linear-gradient(90deg, rgba(100, 255, 100, 0.8), rgba(100, 255, 100, 0.4));
}

.notification.error .progress-fill {
  background: linear-gradient(90deg, rgba(255, 100, 100, 0.8), rgba(255, 100, 100, 0.4));
}

.notification.warning .progress-fill {
  background: linear-gradient(90deg, rgba(255, 200, 100, 0.8), rgba(255, 200, 100, 0.4));
}

/* Transition animations */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.notification-enter-to,
.notification-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
}
</style> 