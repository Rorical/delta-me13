<template>
  <div class="left-panel">
    <div class="panel-title">记录扇区</div>
    <div class="list">
      <!-- 左侧滚动轨道与指示块，随选中项移动 -->
      <div class="track"><i class="thumb" :style="{ transform: `translateY(${selectedFile * 100}%)`, height: `${100 / Math.max(files.length, 1)}%` }"></i></div>
      <div class="items">
        <button v-for="(file, index) in files" :key="index"
             class="file-item"
             :class="{ active: selectedFile === index }"
             @click="$emit('select-file', index)"
             @mouseenter="$emit('file-hover', index)"
             @mouseleave="$emit('file-leave')">
          <span class="accent"></span>
          <span class="file-name">{{ file.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  background: var(--ui-fill);
  border: 1px solid var(--ui-line);
  border-radius: 2px;
  padding: 22px 22px 22px 18px;
  box-sizing: border-box;
  overflow: hidden;
  min-width: 260px;
  max-width: 300px;
  flex-shrink: 0;
}

.panel-title {
  font-size: 17px;
  line-height: 1.35;
  color: var(--ui-text);
  padding-left: 30px;
  margin-bottom: 14px;
}

.list {
  display: flex;
  gap: 14px;
}

.track {
  position: relative;
  width: 3px;
  margin-left: 6px;
  background: rgba(173, 216, 230, 0.18);
}

.thumb {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  background: var(--ui-accent);
  box-shadow: 0 0 6px rgba(173, 216, 230, 0.6);
  transition: transform 0.3s ease;
}

.items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-family: inherit;
  font-size: 17px;
  text-align: left;
  color: var(--ui-text);
  background: transparent;
  border: none;
  border-radius: 0;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.file-item:hover {
  background: rgba(173, 216, 230, 0.1);
}

/* 选中：实色填充块 + 左侧强调条 */
.file-item.active {
  background: var(--ui-select);
  color: var(--ui-select-text);
  box-shadow: 0 0 14px rgba(173, 216, 230, 0.25);
}

.accent {
  position: absolute;
  left: -8px;
  top: 0;
  bottom: 0;
  width: 4px;
  background: transparent;
  transition: background 0.2s ease;
}

.file-item.active .accent {
  background: var(--ui-select);
}

.file-name {
  position: relative;
}

@media (max-width: 768px) {
  .left-panel {
    min-width: auto;
    max-width: none;
    width: 100%;
  }
}
</style>
