<template>
  <div class="auto-pilot-panel">
    <div class="auto-pilot-header">
      <h2 class="auto-pilot-title">Auto-Pilot</h2>
      <div class="auto-pilot-status-bar">
        <span class="status-dot" :class="overallStatus" />
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>

    <div class="auto-pilot-section">
      <label class="auto-pilot-label">Set a goal for the autonomous agents</label>
      <div class="auto-pilot-input-row">
        <input
          v-model="goalInput"
          class="auto-pilot-input"
          type="text"
          placeholder="e.g. Check git status, fix lint errors, then commit..."
          @keydown.enter.prevent="submitGoal"
        />
        <button class="auto-pilot-submit-btn" :disabled="!goalInput.trim() || submitting" @click="submitGoal">
          <span v-if="submitting" class="spinner" />
          <span v-else>Go</span>
        </button>
      </div>
    </div>

    <div class="auto-pilot-section">
      <h3 class="auto-pilot-section-title">Active Goals</h3>
      <div v-if="activePlans.length === 0" class="auto-pilot-empty">No active goals. Submit a goal above.</div>
      <div v-for="plan in activePlans" :key="plan.id" class="auto-pilot-card">
        <div class="auto-pilot-card-header">
          <span class="auto-pilot-card-goal">{{ plan.goal }}</span>
          <span class="auto-pilot-card-status" :class="plan.status">{{ plan.status }}</span>
          <button v-if="plan.status === 'active'" class="auto-pilot-card-cancel" @click="cancelGoal(plan.id)" title="Cancel goal">&times;</button>
        </div>
        <div v-if="goalTasks[plan.id] && goalTasks[plan.id].length > 0" class="auto-pilot-card-tasks">
          <div v-for="task in goalTasks[plan.id]" :key="task.id" class="auto-pilot-task-row" :class="task.status">
            <span class="task-icon">{{ taskIcon(task.status) }}</span>
            <span class="task-desc">{{ taskDesc(task) }}</span>
            <span class="task-status-tag">{{ task.status }}</span>
            <span v-if="task.status === 'failed' && task.error" class="task-error" :title="task.error">!</span>
            <button v-if="task.status === 'failed'" class="task-retry-btn" @click="retryTask(task.id)">Retry</button>
          </div>
        </div>
        <div class="auto-pilot-card-time">{{ formatTime(plan.createdAt) }}</div>
      </div>
    </div>

    <div class="auto-pilot-section auto-pilot-section-compact">
      <h3 class="auto-pilot-section-title">Agents</h3>
      <div v-if="agents.length === 0" class="auto-pilot-empty">No agents registered.</div>
      <div v-for="agent in agents" :key="agent.id" class="auto-pilot-agent-row">
        <span class="status-dot" :class="agent.status" />
        <span class="agent-name">{{ agent.name }}</span>
        <span class="agent-capabilities">{{ agent.capabilities.join(', ') }}</span>
        <span class="agent-tasks">{{ agent.activeTasks.length }} tasks</span>
      </div>
    </div>

    <div class="auto-pilot-section auto-pilot-section-compact">
      <h3 class="auto-pilot-section-title">Maintenance</h3>
      <div class="auto-pilot-button-row">
        <button class="auto-pilot-action-btn" @click="runHealthCheck" :disabled="healthLoading">
          {{ healthLoading ? 'Checking...' : 'Run Health Check' }}
        </button>
        <button class="auto-pilot-action-btn" @click="runAutoUpdate" :disabled="updateLoading">
          {{ updateLoading ? 'Updating...' : 'Check for Updates' }}
        </button>
      </div>
      <div v-if="lastHealth" class="auto-pilot-health-report">
        <div>Memory: {{ lastHealth.memory.usedPercent }}% | CPU: {{ lastHealth.cpu.cores }} cores</div>
        <div v-if="lastHealth.disk">Disk: {{ lastHealth.disk.usedPercent }}% used</div>
        <div>Ollama: {{ lastHealth.ollama?.running ? 'Running' : 'Not detected' }}</div>
        <div v-if="lastHealth.git">Git: {{ lastHealth.git.branch }} ({{ lastHealth.git.behind }} behind, {{ lastHealth.git.ahead }} ahead)</div>
      </div>
      <div v-if="lastUpdate" class="auto-pilot-health-report">
        <div v-if="lastUpdate.updatesAvailable">Updates available: pulled={{ lastUpdate.pulled }}, rebuilt={{ lastUpdate.rebuilt }}</div>
        <div v-if="!lastUpdate.updatesAvailable && lastUpdate.checked">Up to date.</div>
        <div v-if="lastUpdate.error" class="health-error">{{ lastUpdate.error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const goalInput = ref('')
const submitting = ref(false)
const healthLoading = ref(false)
const updateLoading = ref(false)
const lastHealth = ref<any>(null)
const lastUpdate = ref<any>(null)

interface Agent {
  id: string
  name: string
  type: string
  capabilities: string[]
  status: string
  activeTasks: string[]
}

interface Task {
  id: string
  type: string
  goalId: string
  agentId: string
  status: string
  input: string
  error?: string
  retryCount: number
  maxRetries: number
  createdAt: string
}

interface Plan {
  id: string
  goal: string
  steps: any[]
  status: string
  createdAt: string
}

const agents = ref<Agent[]>([])
const activePlans = ref<Plan[]>([])
const goalTasks = ref<Record<string, Task[]>>({})
let eventSource: EventSource | null = null

const overallStatus = ref('idle')
const statusText = ref('Idle')

function taskIcon(status: string): string {
  if (status === 'queued') return '\u23F3'
  if (status === 'running') return '\u25B6'
  if (status === 'completed') return '\u2713'
  if (status === 'failed') return '\u2717'
  if (status === 'cancelled') return '\u2297'
  return '\u25CB'
}

function taskDesc(task: Task): string {
  try {
    const input = JSON.parse(task.input)
    return input.description || input.action || task.type || task.id.slice(0, 8)
  } catch {
    return task.type || task.id.slice(0, 8)
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString()
  } catch { return iso }
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

async function loadStatus() {
  try {
    const data = await fetchJson('/codex-api/agent/status')
    agents.value = data.agents || []

    const hasActive = data.agents?.some((a: Agent) => a.status === 'busy')
    const hasError = data.agents?.some((a: Agent) => a.status === 'error')
    if (hasError) { overallStatus.value = 'error'; statusText.value = 'Error' }
    else if (hasActive) { overallStatus.value = 'busy'; statusText.value = 'Processing' }
    else { overallStatus.value = 'idle'; statusText.value = 'Idle' }
  } catch { /* ignore */ }
}

async function loadPlans() {
  try {
    const data = await fetchJson('/codex-api/agent/goals')
    activePlans.value = (data.plans || []).filter((p: Plan) => p.status === 'active')
    for (const plan of activePlans.value) {
      loadTasks(plan.id)
    }
  } catch { /* ignore */ }
}

async function loadTasks(planId: string) {
  try {
    const data = await fetchJson(`/codex-api/agent/tasks?goalId=${planId}`)
    goalTasks.value[planId] = data.tasks || []
  } catch { /* ignore */ }
}

async function submitGoal() {
  const goal = goalInput.value.trim()
  if (!goal || submitting.value) return
  submitting.value = true
  try {
    await fetchJson('/codex-api/agent/goal', { method: 'POST', body: JSON.stringify({ goal }) })
    goalInput.value = ''
    await loadPlans()
  } catch (err: any) {
    alert(`Failed to submit goal: ${err.message}`)
  } finally {
    submitting.value = false
  }
}

async function cancelGoal(planId: string) {
  try {
    await fetchJson(`/codex-api/agent/goal/${planId}/cancel`, { method: 'POST' })
    await loadPlans()
  } catch { /* ignore */ }
}

async function retryTask(taskId: string) {
  try {
    await fetchJson(`/codex-api/agent/task/${taskId}/retry`, { method: 'POST' })
    await loadPlans()
  } catch { /* ignore */ }
}

async function runHealthCheck() {
  healthLoading.value = true
  try {
    const report = await fetchJson('/codex-api/agent/self-heal/check', { method: 'POST' })
    lastHealth.value = report
  } catch (err: any) {
    alert(`Health check failed: ${err.message}`)
  } finally {
    healthLoading.value = false
  }
}

async function runAutoUpdate() {
  updateLoading.value = true
  try {
    const result = await fetchJson('/codex-api/agent/self-heal/update', { method: 'POST' })
    lastUpdate.value = result
  } catch (err: any) {
    alert(`Update check failed: ${err.message}`)
  } finally {
    updateLoading.value = false
  }
}

function connectSSE() {
  eventSource = new EventSource('/codex-api/agent/events')
  eventSource.onmessage = () => {
    loadStatus()
    loadPlans()
  }
  eventSource.onerror = () => {
    eventSource?.close()
    setTimeout(connectSSE, 5000)
  }
}

onMounted(() => {
  loadStatus()
  loadPlans()
  connectSSE()

  const int = setInterval(() => {
    loadStatus()
    loadPlans()
  }, 5000)
  onUnmounted(() => {
    clearInterval(int)
    eventSource?.close()
  })
})
</script>

<style scoped>
.auto-pilot-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.auto-pilot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.auto-pilot-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.auto-pilot-status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.status-dot.idle { background: #22c55e; }
.status-dot.busy { background: #f59e0b; }
.status-dot.error { background: #ef4444; }
.status-dot.monitoring { background: #3b82f6; }
.status-dot.paused { background: #6b7280; }

.status-text {
  text-transform: capitalize;
}

.auto-pilot-section {
  background: color-mix(in srgb, currentColor 4%, transparent);
  border-radius: 12px;
  padding: 16px;
}

.auto-pilot-section-compact {
  padding: 12px 16px;
}

.auto-pilot-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  opacity: 0.8;
}

.auto-pilot-input-row {
  display: flex;
  gap: 8px;
}

.auto-pilot-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 14px;
  outline: none;
}
.auto-pilot-input:focus {
  border-color: color-mix(in srgb, currentColor 40%, transparent);
}

.auto-pilot-submit-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #6366f1;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.auto-pilot-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auto-pilot-section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
}

.auto-pilot-empty {
  font-size: 13px;
  opacity: 0.5;
  padding: 8px 0;
}

.auto-pilot-card {
  border: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}

.auto-pilot-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.auto-pilot-card-goal {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
}

.auto-pilot-card-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 700;
}
.auto-pilot-card-status.active { background: #dbeafe; color: #1d4ed8; }
.auto-pilot-card-status.completed { background: #dcfce7; color: #16a34a; }
.auto-pilot-card-status.failed { background: #fee2e2; color: #dc2626; }

.auto-pilot-card-cancel {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  opacity: 0.5;
  padding: 0 4px;
}
.auto-pilot-card-cancel:hover { opacity: 1; }

.auto-pilot-card-tasks {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.auto-pilot-task-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: color-mix(in srgb, currentColor 3%, transparent);
}
.auto-pilot-task-row.completed { opacity: 0.6; }
.auto-pilot-task-row.failed { background: color-mix(in srgb, #ef4444 8%, transparent); }
.auto-pilot-task-row.running { background: color-mix(in srgb, #f59e0b 6%, transparent); }

.task-icon { font-size: 14px; width: 16px; text-align: center; }
.task-desc { flex: 1; }
.task-status-tag { font-size: 10px; padding: 1px 6px; border-radius: 3px; background: color-mix(in srgb, currentColor 10%, transparent); }
.task-error { color: #ef4444; font-weight: bold; cursor: help; }
.task-retry-btn {
  font-size: 10px;
  padding: 2px 8px;
  border: 1px solid currentColor;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  opacity: 0.6;
}
.task-retry-btn:hover { opacity: 1; }

.auto-pilot-card-time {
  font-size: 11px;
  opacity: 0.4;
}

.auto-pilot-agent-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 6%, transparent);
}
.auto-pilot-agent-row:last-child { border-bottom: none; }

.agent-name { font-weight: 600; min-width: 80px; }
.agent-capabilities { flex: 1; font-size: 11px; opacity: 0.6; }
.agent-tasks { font-size: 11px; opacity: 0.5; }

.auto-pilot-button-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.auto-pilot-action-btn {
  padding: 8px 16px;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}
.auto-pilot-action-btn:hover {
  background: color-mix(in srgb, currentColor 6%, transparent);
}
.auto-pilot-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auto-pilot-health-report {
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.7;
  line-height: 1.6;
}

.health-error { color: #ef4444; }

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

:root.dark .auto-pilot-card-status.active { background: #1e3a5f; color: #93c5fd; }
:root.dark .auto-pilot-card-status.completed { background: #14532d; color: #86efac; }
:root.dark .auto-pilot-card-status.failed { background: #7f1d1d; color: #fca5a5; }
</style>
