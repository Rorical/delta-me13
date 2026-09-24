<template>
  <div class="top-section">
    <h2 class="section-title">实验档案</h2>
    <div class="title-rule"></div>
  </div>
</template>

<script setup lang="ts">
// 纯展示组件
</script>

<style scoped>
.top-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 10px;
  padding-left: 16%;
}

.section-title {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--ui-text);
  text-shadow: 0 0 12px rgba(173, 216, 230, 0.35);
  white-space: nowrap;
}

.title-rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--ui-line), rgba(173, 216, 230, 0.05));
}

@media (max-width: 768px) {
  .top-section { padding-left: 0; }
  .section-title { font-size: 20px; }
}
</style>
