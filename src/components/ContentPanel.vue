<template>
  <div class="right-panel panel-3d">
    <div class="panel-header">
      <span class="panel-icon">
        <Settings :size="18" />
      </span>
      <span>实验内容</span>
      <div class="header-line"></div>
      <span class="panel-dots">
        <MoreHorizontal :size="16" />
      </span>
    </div>
    <div class="panel-content" ref="panelContent">
      <div class="content-hologram"></div>
      <!-- Show SystemDashboard for system status content -->
      <SystemDashboard v-if="isSystemStatus" />
      <!-- Show Settings for causal matrix content -->
      <AISettings v-else-if="isCausalMatrix" />
      <!-- Show OmphalosSystem for omphalos content -->
      <OmphalosSystem v-else-if="isOmphalos" />
      <!-- Show regular content for other files -->
      <div v-else>
        <p v-for="(line, idx) in content.split('\n')" :key="idx">{{ line }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Settings, MoreHorizontal } from 'lucide-vue-next'
import SystemDashboard from './SystemDashboard.vue'
import AISettings from './Settings.vue'
import OmphalosSystem from './OmphalosSystem.vue'

interface Props {
  content: string
}

const props = defineProps<Props>()

const panelContent = ref<HTMLElement>()

// Check if this is the system status content
const isSystemStatus = computed(() => {
  return props.content.includes('状态监控')
})

// Check if this is the causal matrix content
const isCausalMatrix = computed(() => {
  return props.content.includes('因果矩阵')
})

// Check if this is the omphalos content
const isOmphalos = computed(() => {
  return props.content.includes('交互协议')
})
</script>

<style scoped>
.right-panel {
  background: rgba(173, 216, 230, 0.03);
  border: 1px solid rgba(173, 216, 230, 0.1);
  border-radius: 8px;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
  backdrop-filter: blur(1px);
  flex: 1;
  min-width: 0;
}

.panel-3d {
  transform-style: preserve-3d;
  transition: all 0.3s ease;
}

.panel-3d:hover {
  transform: translateZ(10px);
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.2);
}

.panel-header {
  display: flex;
  align-items: center;
  position: relative;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(173, 216, 230, 0.15);
  color: rgba(173, 216, 230, 0.9);
  gap: 8px;
}

.panel-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  animation: icon-float 3s ease-in-out infinite;
}

@keyframes icon-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.header-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(173, 216, 230, 0.3), transparent);
  margin: 0 10px;
}

.panel-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  color: rgba(173, 216, 230, 0.5);
  animation: dots-pulse 2s ease-in-out infinite;
}

@keyframes dots-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.panel-content {
  position: relative;
  height: calc(100% - 70px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.panel-content p {
  color: rgba(173, 216, 230, 0.9);
  line-height: 1.6;
  margin: 0;
  flex: 1;
}

.uid {
  position: absolute;
  bottom: 0;
  left: 0;
  font-size: 10px;
  color: rgba(173, 216, 230, 0.4);
}

.content-hologram {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.05) 0%, transparent 70%);
  pointer-events: none;
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 480px) {
  .right-panel {
    padding: 15px;
  }
  
  .panel-content {
    height: auto;
    min-height: 200px;
    max-height: none;
  }
}
</style> 