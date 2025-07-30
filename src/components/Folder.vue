<template>
  <div class="folder" 
       :class="{ active: isActive }"
       @click="$emit('select')"
       @mouseenter="$emit('hover')"
       @mouseleave="$emit('leave')">
    <div class="folder-3d">
      <div class="folder-front">
        <div class="folder-icon">
          <component :is="iconComponent" :size="32" />
        </div>
        <div class="folder-name">{{ name }}</div>
        <div class="folder-glow"></div>
      </div>
      <div class="folder-back"></div>
      <div class="folder-sides">
        <div class="folder-side folder-side-left"></div>
        <div class="folder-side folder-side-right"></div>
        <div class="folder-side folder-side-top"></div>
        <div class="folder-side folder-side-bottom"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Database, Settings, Shield, Archive, Code, Zap } from 'lucide-vue-next'

interface Props {
  name: string
  icon: string
  isActive: boolean
}

const props = defineProps<Props>()

defineEmits<{
  select: []
  hover: []
  leave: []
}>()

const iconComponent = computed(() => {
  const iconMap = {
    Database,
    Settings,
    Shield,
    Archive,
    Code,
    Zap
  }
  return iconMap[props.icon as keyof typeof iconMap] || Database
})
</script>

<style scoped>
.folder {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
  height: 100px;
  cursor: pointer;
  perspective: 200px;
}

.folder-3d {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.folder-front {
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 15px;
  background: rgba(173, 216, 230, 0.05);
  border: 1px solid rgba(173, 216, 230, 0.1);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  box-sizing: border-box;
}

.folder-back {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(173, 216, 230, 0.08);
  border: 1px solid rgba(173, 216, 230, 0.15);
  border-radius: 8px;
  transform: rotateY(180deg);
  backface-visibility: hidden;
}

.folder-sides {
  position: absolute;
  width: 100%;
  height: 100%;
}

.folder-side {
  position: absolute;
  background: rgba(173, 216, 230, 0.03);
  border: 1px solid rgba(173, 216, 230, 0.08);
}

.folder-side-left {
  width: 10px;
  height: 100%;
  left: -5px;
  transform: rotateY(-90deg);
  transform-origin: right;
}

.folder-side-right {
  width: 10px;
  height: 100%;
  right: -5px;
  transform: rotateY(90deg);
  transform-origin: left;
}

.folder-side-top {
  width: 100%;
  height: 10px;
  top: -5px;
  transform: rotateX(90deg);
  transform-origin: bottom;
}

.folder-side-bottom {
  width: 100%;
  height: 10px;
  bottom: -5px;
  transform: rotateX(-90deg);
  transform-origin: top;
}

.folder-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(173, 216, 230, 0.15) 0%, transparent 70%);
  border-radius: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.folder:hover, .folder.active {
  z-index: 10;
}

.folder:hover .folder-3d, .folder.active .folder-3d {
  transform: translateY(-5px) rotateX(5deg) rotateY(2deg) scale(1.02);
}

.folder:hover .folder-front, .folder.active .folder-front {
  background: rgba(173, 216, 230, 0.1);
  border-color: rgba(173, 216, 230, 0.9);
  box-shadow: 0 0 20px rgba(173, 216, 230, 0.2);
}

.folder:hover .folder-glow, .folder.active .folder-glow {
  opacity: 1;
}

.folder:active .folder-3d {
  transform: translateY(-2px) rotateX(3deg) scale(0.98);
  transition: all 0.1s ease;
}

.folder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 8px;
  filter: drop-shadow(0 0 10px rgba(173, 216, 230, 0.4));
  color: rgba(173, 216, 230, 0.9);
}

.folder-name {
  font-size: 12px;
  text-align: center;
  color: rgba(173, 216, 230, 0.9);
}

/* Responsive */
@media (max-width: 768px) {
  .folder {
    min-width: 100px;
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .folder {
    min-width: 80px;
    padding: 10px;
  }
  
  .folder-name {
    font-size: 11px;
  }
}
</style> 