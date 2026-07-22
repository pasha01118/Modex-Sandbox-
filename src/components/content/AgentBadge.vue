<template>
  <span class="agent-badge" :class="[`agent-badge--${size}`, { 'agent-badge--clickable': clickable }]" :style="badgeStyle" @click="handleClick" :title="`${name} (Lvl ${level || 1})`">
    <span class="agent-badge-avatar">{{ avatar }}</span>
    <span v-if="size !== 'sm'" class="agent-badge-name">{{ name }}</span>
    <span v-if="showLevel && level" class="agent-badge-level">L{{ level }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  agentId: string
  name: string
  avatar: string
  color: string
  level?: number
  size?: 'sm' | 'md' | 'lg'
  showLevel?: boolean
  clickable?: boolean
}>()

const emit = defineEmits<{ click: [agentId: string] }>()

const badgeStyle = computed(() => ({
  '--badge-color': props.color || '#8b5cf6',
}))

function handleClick() {
  if (props.clickable) emit('click', props.agentId)
}
</script>

<style scoped>
.agent-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--badge-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--badge-color) 25%, transparent);
  font-size: 12px;
  color: var(--badge-color);
  white-space: nowrap;
  line-height: 1.4;
}
.agent-badge--sm {
  padding: 1px 6px;
  font-size: 11px;
}
.agent-badge--lg {
  padding: 4px 12px;
  font-size: 14px;
}
.agent-badge--clickable {
  cursor: pointer;
  transition: all 0.15s;
}
.agent-badge--clickable:hover {
  background: color-mix(in srgb, var(--badge-color) 22%, transparent);
  border-color: var(--badge-color);
}
.agent-badge-avatar {
  font-size: 14px;
  line-height: 1;
}
.agent-badge--sm .agent-badge-avatar {
  font-size: 12px;
}
.agent-badge--lg .agent-badge-avatar {
  font-size: 18px;
}
.agent-badge-name {
  font-weight: 600;
}
.agent-badge-level {
  font-size: 10px;
  font-weight: 700;
  background: var(--badge-color);
  color: #fff;
  padding: 0 4px;
  border-radius: 4px;
}
</style>
