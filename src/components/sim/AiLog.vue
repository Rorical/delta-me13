<template>
  <div>
    <div class="stats om-muted">
      <span>调用 {{ s.calls }}</span>
      <span>失败 {{ s.failures }}</span>
      <span>平均 {{ s.avgMs }}ms</span>
      <span>输入 {{ s.promptTokens.toLocaleString() }} tok</span>
      <span>输出 {{ s.completionTokens.toLocaleString() }} tok</span>
    </div>
    <table class="ai-table">
      <thead><tr><th>天</th><th>电信号</th><th>耗时</th><th>Token</th><th>结果</th></tr></thead>
      <tbody>
        <tr v-for="r in rows" :key="r.id" :class="{ fail: !r.ok }">
          <td>{{ r.day }}</td>
          <td>{{ r.agent }}</td>
          <td>{{ r.ms }}ms</td>
          <td>{{ r.promptTokens }}+{{ r.completionTokens }}</td>
          <td class="preview"><AlertTriangle v-if="!r.ok" :size="11" /> {{ r.ok ? r.preview : r.error }}</td>
        </tr>
      </tbody>
    </table>
    <div v-if="!rows.length" class="om-empty">暂无调用记录</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AlertTriangle } from 'lucide-vue-next';
import type { OmphalosWorldState } from '../../core/omphalosWorldState';

const props = defineProps<{ state: OmphalosWorldState; tick: number }>();

const s = computed(() => {
  void props.tick;
  const ai = props.state.ai;
  return { ...ai, avgMs: ai.calls ? Math.round(ai.totalMs / ai.calls) : 0 };
});

const rows = computed(() => {
  void props.tick;
  const st = props.state;
  return st.ai.recent.slice().reverse().map(r => ({ ...r, agent: st.agents[r.agentId]?.name ?? r.agentId }));
});
</script>

<style scoped>
.stats { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; margin-bottom: 10px; }
.ai-table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
.ai-table th { text-align: left; font-weight: normal; color: var(--om-muted); border-bottom: 1px solid var(--om-line-strong); padding: 4px; }
.ai-table th:nth-child(1) { width: 36px; }
.ai-table th:nth-child(2) { width: 90px; }
.ai-table th:nth-child(3) { width: 72px; }
.ai-table th:nth-child(4) { width: 90px; }
.ai-table td { padding: 4px; border-bottom: 1px solid rgba(173, 216, 230, 0.05); }
.preview { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--om-muted); }
.fail td { color: var(--om-text); text-decoration: underline dotted rgba(173, 216, 230, 0.5); }
</style>
