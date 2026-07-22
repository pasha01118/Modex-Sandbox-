<template>
  <div class="alive-agents-panel">
    <div class="alive-agents-tabs">
      <button class="alive-agents-tab" :class="{ active: activeTab === 'chat' }" @click="activeTab = 'chat'">💬 Team Chat</button>
      <button class="alive-agents-tab" :class="{ active: activeTab === 'market' }" @click="activeTab = 'market'">🏪 Agent Market</button>
      <button class="alive-agents-tab" :class="{ active: activeTab === 'learning' }" @click="activeTab = 'learning'">📈 Growth</button>
    </div>

    <div v-if="activeTab === 'chat'" class="alive-agents-chat">
      <div class="alive-agents-status-bar">
        <span v-for="agent in onlineAgents" :key="agent.id" class="alive-agents-status-dot" :style="{ background: agent.color }" :title="`${agent.name}: ${agent.status}`">
          {{ agent.avatar }}
        </span>
      </div>
      <div ref="chatContainer" class="alive-agents-messages">
        <AgentChatBubble v-for="msg in messages" :key="msg.id" :message="msg" />
        <div v-if="typingAgents.length > 0" class="alive-agents-typing">
          <span v-for="t in typingAgents" :key="t" class="alive-agents-typing-agent">{{ getAgentName(t) }} is typing...</span>
        </div>
      </div>
      <div class="alive-agents-command-bar">
        <div class="alive-agents-command-buttons">
          <button v-for="cmd in quickCommands" :key="cmd.cmd" class="alive-agents-quick-cmd" @click="sendCommand(cmd.cmd)" :title="cmd.label">{{ cmd.icon }}</button>
        </div>
      </div>
      <div class="alive-agents-input">
        <input v-model="inputText" class="alive-agents-input-field" type="text" placeholder="Type a message or @agent to mention..." @keydown.enter="sendUserMessage" />
        <button class="alive-agents-send" :disabled="!inputText.trim()" @click="sendUserMessage">▶</button>
      </div>
    </div>

    <div v-else-if="activeTab === 'market'" class="alive-agents-market">
      <div class="alive-agents-market-header">
        <button v-if="!showCreateForm" class="alive-agents-create-btn" @click="showCreateForm = true">+ Create Agent</button>
        <input v-model="searchQuery" class="alive-agents-search" type="text" placeholder="Search agents..." />
      </div>
      <AgentCreationForm v-if="showCreateForm" @created="onAgentCreated" @cancel="showCreateForm = false" />
      <div class="alive-agents-grid">
        <div v-for="agent in filteredAgents" :key="agent.agentId" class="alive-agent-card" :style="{ '--card-color': agent.color }">
          <div class="alive-agent-card-header">
            <AgentBadge :agent-id="agent.agentId" :name="agent.name" :avatar="agent.avatar" :color="agent.color" :size="'lg'" />
          </div>
          <p class="alive-agent-card-role">{{ agent.role }}</p>
          <p class="alive-agent-card-desc">{{ agent.description }}</p>
          <div class="alive-agent-card-skills">
            <span v-for="skill in agent.skills.slice(0, 4)" :key="skill" class="alive-agent-skill-tag">{{ skill }}</span>
          </div>
          <div class="alive-agent-card-actions">
            <button v-if="agent.isCustom" class="alive-agent-delete" @click="deleteAgent(agent.agentId)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'learning'" class="alive-agents-learning">
      <div class="alive-agents-leaderboard">
        <h3>Agent Leaderboard</h3>
        <div v-for="(entry, i) in leaderboard" :key="entry.agentId" class="alive-agents-lb-entry">
          <span class="alive-agents-lb-rank">#{{ i + 1 }}</span>
          <AgentBadge :agent-id="entry.agentId" :name="getAgentName(entry.agentId)" :avatar="getAgentAvatar(entry.agentId)" :color="getAgentColor(entry.agentId)" :size="'md'" :show-level="true" :level="entry.level" />
          <span class="alive-agents-lb-xp">{{ entry.xp }} XP</span>
          <span class="alive-agents-lb-tasks">{{ entry.totalTasks }} tasks</span>
          <span class="alive-agents-lb-success">{{ entry.successRate }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import AgentChatBubble from './AgentChatBubble.vue'
import AgentBadge from './AgentBadge.vue'
import AgentCreationForm from './AgentCreationForm.vue'
import type { AgentMessage, AgentMessageType } from '../../server/agent/agentMessageBroker'
import type { AgentIdentity } from '../../server/agent/agentIdentities'

const activeTab = ref<'chat' | 'market' | 'learning'>('chat')
const messages = ref<AgentMessage[]>([])
const agents = ref<AgentIdentity[]>([])
const typingAgents = ref<string[]>([])
const inputText = ref('')
const searchQuery = ref('')
const showCreateForm = ref(false)
const leaderboard = ref<any[]>([])
const chatContainer = ref<HTMLElement | null>(null)
let eventSource: EventSource | null = null

const quickCommands = [
  { cmd: 'stop', icon: '⏹', label: 'Stop all agents' },
  { cmd: 'wait', icon: '⏸', label: 'Pause all agents' },
  { cmd: 'resume', icon: '▶️', label: 'Resume all agents' },
  { cmd: 'status', icon: '📊', label: 'Get team status' },
]

const onlineAgents = computed(() => agents.value.filter(a => a.status !== 'error'))
const filteredAgents = computed(() => {
  if (!searchQuery.value) return agents.value.map(a => ({ ...a, agentId: a.id, isInstalled: true, description: `${a.role} — ${a.personality.slice(0, 80)}` }))
  const q = searchQuery.value.toLowerCase()
  return agents.value.filter(a => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || a.skills.some(s => s.toLowerCase().includes(q))).map(a => ({ ...a, agentId: a.id, isInstalled: true, description: `${a.role} — ${a.personality.slice(0, 80)}` }))
})

function getAgentName(id: string) { return agents.value.find(a => a.id === id)?.name || id }
function getAgentAvatar(id: string) { return agents.value.find(a => a.id === id)?.avatar || '🤖' }
function getAgentColor(id: string) { return agents.value.find(a => a.id === id)?.color || '#8b5cf6' }

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  })
}

async function loadMessages() {
  try {
    const res = await fetch('/api/agents/chat/history?limit=200')
    if (res.ok) {
      const data = await res.json()
      messages.value = data.messages || []
      scrollToBottom()
    }
  } catch {}
}

async function loadAgents() {
  try {
    const res = await fetch('/api/agents/identities')
    if (res.ok) {
      const data = await res.json()
      agents.value = data.agents || []
    }
  } catch {}
}

async function loadLeaderboard() {
  try {
    const res = await fetch('/api/agents/learning/leaderboard')
    if (res.ok) {
      const data = await res.json()
      leaderboard.value = data.leaderboard || []
    }
  } catch {}
}

async function sendUserMessage() {
  const content = inputText.value.trim()
  if (!content) return
  inputText.value = ''
  try {
    await fetch('/api/agents/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
  } catch {}
}

async function sendCommand(cmd: string) {
  try {
    await fetch('/api/agents/chat/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd }),
    })
  } catch {}
}

async function deleteAgent(agentId: string) {
  try {
    await fetch(`/api/agents/identity/${agentId}`, { method: 'DELETE' })
    await loadAgents()
  } catch {}
}

function onAgentCreated(agent: AgentIdentity) {
  showCreateForm.value = false
  loadAgents()
}

function connectSSE() {
  eventSource = new EventSource('/api/agents/chat/events')
  eventSource.addEventListener('agent:message', (e) => {
    try {
      const msg = JSON.parse(e.data) as AgentMessage
      messages.value.push(msg)
      scrollToBottom()
    } catch {}
  })
  eventSource.addEventListener('agent:typing', (e) => {
    try {
      const data = JSON.parse(e.data)
      if (data.typing) {
        if (!typingAgents.value.includes(data.agentId)) typingAgents.value.push(data.agentId)
      } else {
        typingAgents.value = typingAgents.value.filter(id => id !== data.agentId)
      }
    } catch {}
  })
  eventSource.addEventListener('connected', (e) => {
    try {
      const data = JSON.parse(e.data)
      if (data.agents) {
        for (const a of data.agents) {
          const existing = agents.value.find(ag => ag.id === a.id)
          if (existing) Object.assign(existing, { status: a.status })
        }
      }
    } catch {}
  })
  eventSource.addEventListener('agent:command', () => { loadMessages() })
}

onMounted(() => {
  loadMessages()
  loadAgents()
  loadLeaderboard()
  connectSSE()
})

onUnmounted(() => {
  eventSource?.close()
})

watch(activeTab, (tab) => {
  if (tab === 'learning') loadLeaderboard()
})
</script>

<style scoped>
.alive-agents-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.alive-agents-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  background: var(--bg-secondary, #f8f9fa);
}
.alive-agents-tab {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
}
.alive-agents-tab.active {
  opacity: 1;
  border-bottom: 2px solid var(--accent-color, #8b5cf6);
}
.alive-agents-chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.alive-agents-status-bar {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  flex-wrap: wrap;
}
.alive-agents-status-dot {
  font-size: 16px;
  cursor: default;
}
.alive-agents-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.alive-agents-typing {
  padding: 4px 0;
  font-size: 12px;
  opacity: 0.6;
}
.alive-agents-typing-agent {
  margin-right: 12px;
}
.alive-agents-command-bar {
  display: flex;
  gap: 4px;
  padding: 4px 12px;
  border-top: 1px solid var(--border-color, #e0e0e0);
}
.alive-agents-quick-cmd {
  padding: 4px 8px;
  border: 1px solid var(--border-color, #d0d0d0);
  border-radius: 6px;
  background: var(--bg-secondary, #f5f5f5);
  cursor: pointer;
  font-size: 14px;
}
.alive-agents-quick-cmd:hover {
  background: var(--bg-tertiary, #eee);
}
.alive-agents-input {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-color, #e0e0e0);
}
.alive-agents-input-field {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #d0d0d0);
  background: var(--bg-primary, #fff);
  font-size: 13px;
  color: inherit;
}
.alive-agents-send {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: #8b5cf6;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
.alive-agents-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.alive-agents-market {
  padding: 12px;
  overflow-y: auto;
  flex: 1;
}
.alive-agents-market-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.alive-agents-create-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #8b5cf6;
  background: transparent;
  color: #8b5cf6;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
.alive-agents-search {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #d0d0d0);
  background: var(--bg-primary, #fff);
  font-size: 13px;
  color: inherit;
}
.alive-agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.alive-agent-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--card-color) 25%, transparent);
  background: color-mix(in srgb, var(--card-color) 5%, transparent);
}
.alive-agent-card-header {
  margin-bottom: 8px;
}
.alive-agent-card-role {
  font-size: 12px;
  font-weight: 600;
  color: var(--card-color);
  margin: 4px 0;
}
.alive-agent-card-desc {
  font-size: 12px;
  opacity: 0.7;
  margin: 0 0 8px;
}
.alive-agent-card-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.alive-agent-skill-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--card-color) 12%, transparent);
  color: var(--card-color);
}
.alive-agent-card-actions {
  margin-top: 8px;
}
.alive-agent-delete {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ef4444;
  background: transparent;
  color: #ef4444;
  font-size: 11px;
  cursor: pointer;
}
.alive-agents-learning {
  padding: 12px;
  overflow-y: auto;
  flex: 1;
}
.alive-agents-leaderboard h3 {
  margin: 0 0 12px;
}
.alive-agents-lb-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 6px;
  background: var(--bg-secondary, #f8f9fa);
}
.alive-agents-lb-rank {
  font-weight: 700;
  font-size: 14px;
  min-width: 30px;
}
.alive-agents-lb-xp,
.alive-agents-lb-tasks,
.alive-agents-lb-success {
  font-size: 12px;
  opacity: 0.6;
}
</style>
