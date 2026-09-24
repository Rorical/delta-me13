<template>
  <div class="chat-list">
    <div v-for="m in chats" :key="m.id" class="bubble" :class="m.fromKind">
      <div class="bubble-head">
        <component :is="kindIcon[m.fromKind]" :size="12" />
        <b @click="$emit('agent', m.from)">{{ m.fromName }}</b>
        <ArrowRight :size="11" />
        <span @click="$emit('agent', m.to)">{{ m.toName }}</span>
        <small>E{{ m.era }}·D{{ m.day }} · {{ m.location }}</small>
      </div>
      <div class="bubble-body">「{{ m.content }}」</div>
    </div>
    <div v-if="!chats.length" class="om-empty">{{ agentId ? '此人还没有说过话' : '还没有人开口说话' }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowRight, Crown, Sparkles, User } from 'lucide-vue-next';
import type { OmphalosWorldState } from '../../core/omphalosWorldState';

const props = defineProps<{ state: OmphalosWorldState; tick: number; agentId?: string }>();
defineEmits<{ (e: 'agent', id: string): void }>();

const kindIcon: Record<string, unknown> = { heir: Sparkles, titan: Crown, npc: User };

const chats = computed(() => {
  void props.tick;
  const s = props.state;
  return s.messages
    .filter(m => !props.agentId || m.from === props.agentId || m.to === props.agentId)
    .slice(-150).reverse()
    .map(m => ({
      ...m,
      fromName: s.agents[m.from]?.name ?? m.from,
      toName: s.agents[m.to]?.name ?? m.to,
      fromKind: s.agents[m.from]?.kind ?? 'npc'
    }));
});
</script>

<style scoped>
.chat-list { display: flex; flex-direction: column; gap: 8px; }
.bubble { border: 1px solid var(--om-line); border-left: 3px solid rgba(173, 216, 230, 0.3); background: var(--ui-fill-inner); padding: 8px 12px; }
.bubble.heir { border-left-color: rgba(173, 216, 230, 0.8); }
.bubble.titan { border-left-color: rgba(236, 248, 253, 1); }
.bubble-head { font-size: 12px; color: var(--om-muted); display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.bubble-head b, .bubble-head span { cursor: pointer; }
.bubble-head b { color: var(--om-text); }
.bubble-head small { margin-left: auto; color: var(--om-faint); }
.bubble-body { margin-top: 4px; line-height: 1.65; font-size: 14px; }
</style>
