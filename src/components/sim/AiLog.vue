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
        <template v-for="r in rows" :key="r.id">
          <tr :class="{ fail: !r.ok, expandable: !!r.reasoning, open: open.has(r.id) }" @click="toggle(r.id, !!r.reasoning)">
            <td>{{ r.day }}</td>
            <td>{{ r.agent }}</td>
            <td>{{ r.ms }}ms</td>
            <td>{{ r.promptTokens }}+{{ r.completionTokens }}</td>
            <td class="preview">
              <AlertTriangle v-if="!r.ok" :size="11" />
              <Brain v-else-if="r.reasoning" :size="11" class="think" />
              {{ r.ok ? r.preview : r.error }}
            </td>
          </tr>
          <tr v-if="open.has(r.id)" class="reasoning-row">
            <td colspan="5"><div class="om-inner reasoning">{{ r.reasoning }}</div></td>
          </tr>
        </template>
      </tbody>
    </table>
    <div v-if="!rows.length" class="om-empty">暂无调用记录</div>
    <p v-else class="om-muted hint"><Brain :size="11" /> 标记的调用带有模型思考内容，点击展开。</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { AlertTriangle, Brain } from 'lucide-vue-next';
import type { OmphalosWorldState } from '../../core/omphalosWorldState';

const props = defineProps<{ state: OmphalosWorldState; tick: number }>();

const open = ref(new Set<number>());
const toggle = (id: number, hasReasoning: boolean) => {
  if (!hasReasoning) return;
  const next = new Set(open.value);
  next.has(id) ? next.delete(id) : next.add(id);
  open.value = next;
};

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
.expandable { cursor: pointer; }
.expandable:hover td, .open td { background: rgba(173, 216, 230, 0.06); }
.think { color: var(--om-text); }
.reasoning-row td { padding: 0 4px 8px; }
.reasoning { font-size: 12px; line-height: 1.7; white-space: pre-wrap; max-height: 240px; overflow-y: auto; }
.hint { display: flex; align-items: center; gap: 4px; font-size: 11px; margin: 8px 0 0; }
</style>
