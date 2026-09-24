<template>
  <div class="feed">
    <div class="feed-controls">
      <div class="chips">
        <button v-for="t in typeOptions" :key="t" class="chip" :class="{ active: activeTypes.has(t) }" @click="toggle(t)">
          {{ LOG_TYPE_LABEL[t] }}
        </button>
      </div>
      <label class="important"><input type="checkbox" v-model="importantOnly" /> 仅重要</label>
    </div>
    <div v-if="agentName" class="agent-filter">
      仅显示与 <b>{{ agentName }}</b> 相关的事件 <button @click="$emit('clear-agent')">清除</button>
    </div>
    <ol class="entries">
      <li v-for="l in entries" :key="l.id" class="entry" :class="[l.type, l.importance]">
        <span class="day">E{{ l.era }}·D{{ l.day }}</span>
        <span class="type">{{ LOG_TYPE_LABEL[l.type] }}</span>
        <span class="msg">{{ l.message }}</span>
      </li>
      <li v-if="!entries.length" class="empty">暂无事件。启动仿真后，世界的每一次心跳都会记录在此。</li>
    </ol>
    <div class="foot">显示最新 {{ entries.length }} 条 / 共 {{ total }} 条</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { LogType, OmphalosWorldState } from '../../core/omphalosWorldState';
import { LOG_TYPE_LABEL } from './useSimulation';

const props = defineProps<{ state: OmphalosWorldState; tick: number; agentId?: string }>();
defineEmits<{ (e: 'clear-agent'): void }>();

const typeOptions: LogType[] = ['combat', 'ember', 'chat', 'tide', 'event', 'era', 'social', 'economy', 'move', 'failure', 'system'];
const activeTypes = ref(new Set<LogType>(['combat', 'ember', 'chat', 'tide', 'event', 'era', 'social', 'economy', 'move', 'system']));
const importantOnly = ref(false);

const toggle = (t: LogType) => {
  const next = new Set(activeTypes.value);
  next.has(t) ? next.delete(t) : next.add(t);
  activeTypes.value = next;
};

const agentName = computed(() => (props.agentId ? props.state.agents[props.agentId]?.name : ''));
const total = computed(() => { void props.tick; return props.state.logs.length; });

// 最新在上，只渲染最近 200 条，避免长时间运行后 DOM 膨胀
const entries = computed(() => {
  void props.tick;
  const logs = props.state.logs;
  const out = [];
  for (let i = logs.length - 1; i >= 0 && out.length < 200; i--) {
    const l = logs[i];
    if (!activeTypes.value.has(l.type)) continue;
    if (importantOnly.value && (l.importance === 'low' || l.importance === 'medium')) continue;
    if (props.agentId && l.agentId !== props.agentId && l.targetId !== props.agentId) continue;
    out.push(l);
  }
  return out;
});
</script>

<style scoped>
.feed { display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.feed-controls { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; align-items: center; }
.chips { display: flex; gap: 4px; flex-wrap: wrap; }
.chip { background: rgba(173, 216, 230, 0.05); border: 1px solid rgba(173, 216, 230, 0.18); color: rgba(173, 216, 230, 0.55); padding: 2px 8px; border-radius: 999px; font-size: 11px; cursor: pointer; }
.chip.active { color: #e0f2fe; border-color: rgba(0, 212, 255, 0.6); background: rgba(0, 212, 255, 0.12); }
.important { font-size: 12px; display: flex; align-items: center; gap: 4px; cursor: pointer; }
.agent-filter { font-size: 12px; background: rgba(0, 212, 255, 0.08); border-radius: 6px; padding: 4px 8px; }
.agent-filter button { margin-left: 8px; background: none; border: 1px solid rgba(173, 216, 230, 0.3); color: inherit; border-radius: 4px; cursor: pointer; font-size: 11px; }
.entries { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.entry { display: grid; grid-template-columns: 62px 34px 1fr; gap: 6px; font-size: 12px; line-height: 1.5; padding: 3px 6px; border-radius: 4px; }
.entry:hover { background: rgba(173, 216, 230, 0.05); }
.day { color: rgba(173, 216, 230, 0.45); font-variant-numeric: tabular-nums; }
.type { color: rgba(173, 216, 230, 0.55); font-size: 11px; }
.msg { color: rgba(224, 242, 254, 0.85); word-break: break-all; }
.entry.low .msg { color: rgba(224, 242, 254, 0.55); }
.entry.high .msg { color: #e0f2fe; }
.entry.critical { background: rgba(245, 197, 66, 0.08); }
.entry.critical .msg { color: #fde68a; font-weight: 600; }
.entry.combat .type { color: #fb7185; }
.entry.ember .type { color: #f5c542; }
.entry.chat .type { color: #7dd3fc; }
.entry.tide .type { color: #c084fc; }
.entry.event .type { color: #34d399; }
.entry.failure .type { color: #94a3b8; }
.entry.system.high { border-top: 1px solid rgba(173, 216, 230, 0.12); margin-top: 4px; }
.empty { font-size: 12px; opacity: 0.6; padding: 12px; }
.foot { font-size: 11px; opacity: 0.45; text-align: right; }
</style>
