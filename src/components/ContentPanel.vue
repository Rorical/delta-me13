<template>
  <div class="right-panel">
    <div class="panel-header">
      <CirclePlus :size="15" class="panel-icon" />
      <span class="panel-title">{{ title }}</span>
      <div class="header-line"></div>
    </div>
    <div class="panel-content">
      <SystemDashboard v-if="isSystemStatus" />
      <AISettings v-else-if="isCausalMatrix" />
      <OmphalosSystem v-else-if="isOmphalos" />
      <!-- 普通档案：正文放入内框，与游戏内记录详情一致 -->
      <div v-else class="record-box">
        <p v-for="(line, idx) in content.split('\n')" :key="idx">{{ line }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CirclePlus } from 'lucide-vue-next'
import SystemDashboard from './SystemDashboard.vue'
import AISettings from './Settings.vue'
import OmphalosSystem from './OmphalosSystem.vue'

interface Props {
  content: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), { title: '实验内容' })

const isSystemStatus = computed(() => props.content.includes('状态监控'))
const isCausalMatrix = computed(() => props.content.includes('因果矩阵'))
const isOmphalos = computed(() => props.content.includes('交互协议'))
</script>

<style scoped>
.right-panel {
  background: var(--ui-fill);
  border: 1px solid var(--ui-line);
  border-radius: 2px;
  padding: 22px 26px;
  box-sizing: border-box;
  overflow: hidden;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  color: var(--ui-text);
}

.panel-icon {
  color: var(--ui-muted);
  flex-shrink: 0;
}

.panel-title {
  font-size: 22px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.header-line {
  flex: 1;
  height: 1px;
  background: var(--ui-line);
  margin-left: 12px;
}

.panel-content {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.record-box {
  border: 1px solid var(--ui-line);
  background: var(--ui-fill-inner);
  padding: 20px 24px;
  box-shadow: inset 0 0 0 4px rgba(173, 216, 230, 0.03);
}

.record-box p {
  color: var(--ui-text);
  font-size: 16px;
  line-height: 1.75;
  margin: 0 0 0.6em;
}

@media (max-width: 480px) {
  .right-panel { padding: 16px; }
  .panel-title { font-size: 18px; }
  .record-box { padding: 14px; }
}
</style>
