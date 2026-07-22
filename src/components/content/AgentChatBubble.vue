<template>
  <div class="agent-chat-bubble" :class="`agent-chat-bubble--${message.type}`" :style="bubbleStyle">
    <div class="agent-chat-bubble-header">
      <AgentBadge :agent-id="message.senderId" :name="message.senderName" :avatar="message.senderAvatar" :color="message.senderColor" :size="'sm'" />
      <span class="agent-chat-bubble-type" :class="`type-${message.type}`">{{ typeLabel }}</span>
      <span class="agent-chat-bubble-time">{{ timeLabel }}</span>
    </div>
    <div class="agent-chat-bubble-content" v-html="formattedContent" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AgentBadge from './AgentBadge.vue'
import type { AgentMessage, AgentMessageType } from '../../server/agent/agentMessageBroker'

const props = defineProps<{ message: AgentMessage }>()

const bubbleStyle = computed(() => ({
  '--agent-color': props.message.senderColor || '#8b5cf6',
}))

const typeLabel = computed(() => {
  const labels: Record<AgentMessageType, string> = {
    chat: '💬', action: '⚡', milestone: '🎯', system: '🔧', typing: '⏳',
    command: '⚡', guidance: '🧭', escalation: '🚨', status: '📊', evaluation: '📝', audit: '🔍',
  }
  return labels[props.message.type] || '💬'
})

const formattedContent = computed(() => {
  let content = props.message.content
  content = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  content = content.replace(/`([^`]+)`/g, '<code>$1</code>')
  content = content.replace(/@(\w+)/g, '<span class="agent-chat-mention">@$1</span>')
  content = content.replace(/\n/g, '<br>')
  return content
})

const timeLabel = computed(() => {
  const d = new Date(props.message.timestamp)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
</script>

<style scoped>
.agent-chat-bubble {
  padding: 10px 14px;
  margin: 4px 0;
  border-radius: 12px;
  background: color-mix(in srgb, var(--agent-color) 8%, transparent);
  border-left: 3px solid var(--agent-color);
  max-width: 95%;
}
.agent-chat-bubble--command {
  border-left-color: #ff6600;
  background: color-mix(in srgb, #ff6600 8%, transparent);
}
.agent-chat-bubble--audit {
  border-left-color: #6366f1;
  background: color-mix(in srgb, #6366f1 8%, transparent);
}
.agent-chat-bubble--milestone {
  border-left-color: #22c55e;
  background: color-mix(in srgb, #22c55e 8%, transparent);
}
.agent-chat-bubble-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.agent-chat-bubble-type {
  font-size: 11px;
}
.agent-chat-bubble-time {
  font-size: 11px;
  opacity: 0.5;
  margin-left: auto;
}
.agent-chat-bubble-content {
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}
.agent-chat-mention {
  color: var(--agent-color);
  font-weight: 600;
}
</style>
