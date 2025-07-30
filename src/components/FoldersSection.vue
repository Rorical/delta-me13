<template>
  <div class="folders-section">
    <div class="folders-background"></div>
    <div class="folders-container" ref="foldersContainer">
      <Folder 
        v-for="(folder, index) in folders" 
        :key="index"
        :name="folder.name"
        :icon="folder.icon"
        :is-active="selectedFolder === index"
        @select="$emit('select-folder', index)"
        @hover="$emit('folder-hover', index)"
        @leave="$emit('folder-leave')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Folder from './Folder.vue'

interface FolderData {
  name: string
  icon: string
  files: Array<{
    name: string
    content: string
  }>
}

interface Props {
  folders: FolderData[]
  selectedFolder: number
}

defineProps<Props>()

defineEmits<{
  'select-folder': [index: number]
  'folder-hover': [index: number]
  'folder-leave': []
}>()

const foldersContainer = ref<HTMLElement>()
</script>

<style scoped>
.folders-section {
  position: relative;
  margin-bottom: 30px;
}

.folders-background {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: rgba(173, 216, 230, 0.02);
  border: 1px solid rgba(173, 216, 230, 0.08);
  border-radius: 12px;
  backdrop-filter: blur(1px);
}

.folders-container {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 10px 0;
  padding-left: 20px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 212, 255, 0.5) transparent;
}

.folders-container::-webkit-scrollbar {
  height: 6px;
}

.folders-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.folders-container::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.5);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.folders-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 212, 255, 0.8);
}

/* Responsive */
@media (max-width: 768px) {
  .folders-container {
    gap: 15px;
  }
}
</style> 