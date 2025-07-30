<template>
  <div class="left-panel panel-3d">
    <div class="panel-header">
      <span class="header-icon">
        <BarChart3 :size="18" />
      </span>
      记录扇区
      <div class="header-line"></div>
    </div>
    <div class="file-list">
      <div v-for="(file, index) in files" :key="index" 
           class="file-item"
           :class="{ active: selectedFile === index }"
           @click="$emit('select-file', index)"
           @mouseenter="$emit('file-hover', index)"
           @mouseleave="$emit('file-leave')">
        <div class="file-icon">
          <FileText :size="16" />
        </div>
        <span class="file-name">{{ file.name }}</span>
        <div class="file-hologram"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BarChart3, FileText } from 'lucide-vue-next'

interface FileData {
  name: string
  content: string
}

interface Props {
  files: FileData[]
  selectedFile: number
}

defineProps<Props>()

defineEmits<{
  'select-file': [index: number]
  'file-hover': [index: number]
  'file-leave': []
}>()
</script>

<style scoped>
.left-panel {
  background: rgba(173, 216, 230, 0.03);
  border: 1px solid rgba(173, 216, 230, 0.1);
  border-radius: 8px;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
  backdrop-filter: blur(1px);
  min-width: 280px;
  max-width: 300px;
  flex-shrink: 0;
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

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
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

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(173, 216, 230, 0.03);
  border: 1px solid rgba(173, 216, 230, 0.08);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform: translateX(0) translateZ(0);
  overflow: hidden;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  opacity: 0.7;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  position: relative;
  z-index: 2;
  color: rgba(173, 216, 230, 0.9);
}

.file-hologram {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(173, 216, 230, 0.08), transparent);
  transition: left 0.5s ease;
}

.file-item:hover, .file-item.active {
  background: rgba(173, 216, 230, 0.08);
  border-color: rgba(173, 216, 230, 0.9);
  box-shadow: 0 0 15px rgba(173, 216, 230, 0.15);
  transform: translateX(5px) translateZ(5px);
}

.file-item:hover .file-hologram, .file-item.active .file-hologram {
  left: 100%;
}

.file-item:hover .file-icon, .file-item.active .file-icon {
  opacity: 1;
  transform: scale(1.1);
}

.file-item:active {
  transform: translateX(2px) translateZ(2px) scale(0.98);
  transition: all 0.1s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .left-panel {
    min-width: auto;
    max-width: none;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .left-panel {
    padding: 15px;
  }
}
</style> 