<template>
  <div class="feed">
    <div class="chips">
      <button v-for="t in typeOptions" :key="t" class="om-chip" :class="{ active: activeTypes.has(t) }" @click="toggle(t)">
        <component :is="LOG_ICON[t]" :size="12" /> {{ LOG_TYPE_LABEL[t] }}
      </button>
      <label class="important"><input type="checkbox" v-model="importantOnly" /> 仅重要</label>
    </div>
    <div v-if="agentName" class="agent-filter">
      仅显示与 <b>{{ agentName }}</b> 相关的事件
      <button class="om-btn" @click="$emit('clear-agent')"><X :size="12" /> 清除</button>
    </div>
    <ol class="entries">
      <li v-for="l in entries" :key="l.id" class="entry" :class="[l.type, l.importance]">
        <span class="day">E{{ l.era }}·D{{ l.day }}</span>
        <component :is="LOG_ICON[l.type]" :size="13" class="type-icon" :title="LOG_TYPE_LABEL[l.type]" />
        <span class="msg">{{ l.message }}</span>
      </li>
      <li v-if="!entries.length" class="om-empty">暂无事件。启动仿真后，世界的每一次心跳都会记录在此。</li>
    </ol>
    <div class="foot">显示最新 {{ entries.length }} 条 / 共 {{ total }} 条</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { X } from 'lucide-vue-next';
import type { LogType, OmphalosWorldState } from '../../core/omphalosWorldState';
import { LOG_TYPE_LABEL } from './useSimulation';
import { LOG_ICON } from './icons';

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
.important { margin-left: auto; font-size: 12px; font-weight: normal; display: flex; align-items: center; gap: 4px; cursor: pointer; color: var(--om-muted); }
.chips { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; }
.agent-filter { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 8px; color: var(--om-muted); }
.agent-filter b { color: var(--om-text); }
.entries { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.entry { display: grid; grid-template-columns: 64px 16px 1fr; gap: 8px; align-items: start; font-size: 13px; line-height: 1.6; padding: 4px 6px; border-left: 2px solid transparent; }
.entry:hover { background: rgba(173, 216, 230, 0.05); }
.day { color: var(--om-faint); font-variant-numeric: tabular-nums; }
.type-icon { margin-top: 2px; color: var(--om-muted); }
.msg { color: var(--om-muted); word-break: break-all; }
.entry.medium .msg { color: rgba(173, 216, 230, 0.75); }
.entry.high .msg { color: var(--om-text); }
.entry.critical { border-left-color: rgba(173, 216, 230, 0.9); background: rgba(173, 216, 230, 0.06); }
.entry.critical .msg { color: rgba(225, 242, 250, 1); font-weight: bold; }
.entry.critical .type-icon { color: var(--om-text); }
.entry.system.high { border-top: 1px solid rgba(173, 216, 230, 0.12); margin-top: 6px; padding-top: 6px; }
.foot { font-size: 11px; color: var(--om-faint); text-align: right; margin-top: 8px; }
</style>
