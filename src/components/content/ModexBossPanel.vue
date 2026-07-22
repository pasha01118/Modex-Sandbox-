<template>
  <div class="modex-panel">
    <div class="modex-header">
      <div class="modex-header-row">
        <h2 class="modex-title">MODEX</h2>
        <span class="modex-badge">HOD</span>
      </div>
      <p class="modex-subtitle">Head of Department — Project Guardian</p>
    </div>

    <!-- No project state -->
    <div v-if="!activeProject" class="modex-section">
      <div class="modex-empty-state">
        <div class="modex-empty-icon">🎯</div>
        <h3>No Active Project</h3>
        <p>Create a new project to start the roadmap-controlled development workflow.</p>
        <div class="modex-create-row">
          <input v-model="newProjectId" class="modex-input" placeholder="project-id" />
          <input v-model="newProjectTitle" class="modex-input" placeholder="Project Title" />
          <button class="modex-btn modex-btn-primary" :disabled="!newProjectId || !newProjectTitle" @click="createProject">
            Create Project
          </button>
        </div>
      </div>
    </div>

    <!-- Active project dashboard -->
    <template v-else>
      <!-- Health & Workflow bar -->
      <div class="modex-section modex-health-bar">
        <div class="modex-health-left">
          <span class="modex-health-dot" :class="healthLevel" />
          <span class="modex-health-label">{{ healthLevel.toUpperCase() }}</span>
          <span class="modex-health-score">{{ Math.round(healthScore * 100) }}%</span>
        </div>
        <div class="modex-health-center" v-if="workflow">
          <span class="modex-step-badge" :class="workflow.currentStep">{{ workflow.currentStep }}</span>
          <span class="modex-phase-label">{{ workflow.currentPhase }}</span>
          <span class="modex-progress-text">{{ workflow.tasksCompleted }}/{{ workflow.tasksInPhase }} tasks</span>
        </div>
        <div class="modex-health-right">
          <button class="modex-btn modex-btn-sm" @click="refresh">Refresh</button>
        </div>
      </div>

      <!-- Working-Style Progress -->
      <div class="modex-section">
        <h3 class="modex-section-title">Working-Style Pipeline</h3>
        <div class="modex-pipeline">
          <div v-for="step in workflowSteps" :key="step.key" class="modex-pipeline-step" :class="{ active: workflow?.currentStep === step.key, done: isStepDone(step.key) }">
            <div class="modex-pipeline-icon">{{ step.icon }}</div>
            <div class="modex-pipeline-label">{{ step.label }}</div>
          </div>
        </div>
      </div>

      <!-- Phase Timeline -->
      <div class="modex-section">
        <h3 class="modex-section-title">Roadmap Phases</h3>
        <div class="modex-phases">
          <div v-for="phase in phases" :key="phase.id" class="modex-phase-card" :class="phase.status">
            <div class="modex-phase-header">
              <span class="modex-phase-order">{{ phase.order }}</span>
              <span class="modex-phase-name">{{ phase.name }}</span>
              <span class="modex-phase-status-tag">{{ phase.status }}</span>
            </div>
            <div class="modex-phase-tasks">
              <div v-for="task in phase.tasks" :key="task.id" class="modex-task-row" :class="task.status">
                <span class="modex-task-icon">{{ taskIcon(task.status) }}</span>
                <span class="modex-task-title">{{ task.title }}</span>
                <span class="modex-task-priority" :class="task.priority">{{ task.priority }}</span>
                <button v-if="task.status === 'pending'" class="modex-task-action" @click="startTask(task.id)" title="Start task">▶</button>
                <button v-if="task.status === 'in-progress'" class="modex-task-action" @click="completeTask(task.id)" title="Mark complete">✓</button>
                <button v-if="task.status === 'in-progress'" class="modex-task-action modex-task-fail" @click="failTask(task.id)" title="Mark failed">✗</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Learnings -->
      <div class="modex-section" v-if="learnings.length > 0">
        <h3 class="modex-section-title">Memory — Recent Learnings</h3>
        <div class="modex-learnings">
          <div v-for="l in learnings.slice(-8).reverse()" :key="l.id" class="modex-learning-row">
            <span class="modex-learning-cat" :class="l.category">{{ l.category }}</span>
            <span class="modex-learning-text">{{ l.content }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Decisions -->
      <div class="modex-section" v-if="decisions.length > 0">
        <h3 class="modex-section-title">Decision Log</h3>
        <div class="modex-decisions">
          <div v-for="d in decisions.slice(-6).reverse()" :key="d.id" class="modex-decision-row">
            <span class="modex-decision-time">{{ formatTime(d.timestamp) }}</span>
            <span class="modex-decision-text">{{ d.decision }}</span>
          </div>
        </div>
      </div>

      <!-- Agent Guidance -->
      <div class="modex-section">
        <h3 class="modex-section-title">Agent Directive</h3>
        <pre class="modex-directive">{{ agentDirective }}</pre>
      </div>

      <!-- Actions -->
      <div class="modex-section modex-actions">
        <button class="modex-btn" @click="refresh">Refresh Dashboard</button>
        <button class="modex-btn modex-btn-danger" @click="clearProject">Clear Project</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const API = ''

const activeProject = ref<string | null>(null)
const newProjectId = ref('')
const newProjectTitle = ref('')
const healthLevel = ref('healthy')
const healthScore = ref(1)
const workflow = ref<any>(null)
const phases = ref<any[]>([])
const learnings = ref<any[]>([])
const decisions = ref<any[]>([])
const agentDirective = ref('')

const workflowSteps = [
  { key: 'plan', label: 'Plan', icon: '📋' },
  { key: 'check', label: 'Check', icon: '🔍' },
  { key: 'do', label: 'Do', icon: '⚡' },
  { key: 'verify', label: 'Verify', icon: '✅' },
  { key: 'learn', label: 'Learn', icon: '🧠' },
  { key: 'next', label: 'Next', icon: '➡️' },
]

const stepOrder = ['plan', 'check', 'do', 'verify', 'learn', 'next']

function isStepDone(step: string): boolean {
  if (!workflow.value) return false
  return stepOrder.indexOf(step) < stepOrder.indexOf(workflow.value.currentStep)
}

function taskIcon(status: string): string {
  const icons: Record<string, string> = { pending: '○', 'in-progress': '◎', completed: '●', failed: '✗', skipped: '–', blocked: '■' }
  return icons[status] || '?'
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleString()
}

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  return res.json()
}

async function createProject() {
  if (!newProjectId.value || !newProjectTitle.value) return
  await api('/api/modex/projects', {
    method: 'POST',
    body: JSON.stringify({ projectId: newProjectId.value, title: newProjectTitle.value, description: '' }),
  })
  await api(`/api/modex/projects/${newProjectId.value}/activate`, { method: 'POST' })
  activeProject.value = newProjectId.value
  await refresh()
}

async function startTask(taskId: string) {
  if (!activeProject.value) return
  await api(`/api/modex/projects/${activeProject.value}/tasks/${taskId}/start`, { method: 'POST' })
  await refresh()
}

async function completeTask(taskId: string) {
  if (!activeProject.value) return
  await api(`/api/modex/projects/${activeProject.value}/tasks/${taskId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ result: 'Manually completed' }),
  })
  await refresh()
}

async function failTask(taskId: string) {
  if (!activeProject.value) return
  await api(`/api/modex/projects/${activeProject.value}/tasks/${taskId}/fail`, {
    method: 'POST',
    body: JSON.stringify({ error: 'Manually marked as failed' }),
  })
  await refresh()
}

async function clearProject() {
  if (!activeProject.value) return
  await api(`/api/modex/projects/${activeProject.value}`, { method: 'DELETE' })
  activeProject.value = null
  phases.value = []
  learnings.value = []
  decisions.value = []
}

async function refresh() {
  if (!activeProject.value) return
  try {
    const [dash, learnRes, decRes, guide] = await Promise.all([
      api(`/api/modex/projects/${activeProject.value}/dashboard`),
      api(`/api/modex/projects/${activeProject.value}/learnings`),
      api(`/api/modex/projects/${activeProject.value}/decisions`),
      api(`/api/modex/projects/${activeProject.value}/guide/modex-hod`),
    ])
    healthLevel.value = dash.health?.level || 'healthy'
    healthScore.value = dash.health?.score || 1
    workflow.value = dash.workflow
    phases.value = dash.currentPhase ? [dash.currentPhase] : []
    learnings.value = learnRes.learnings || []
    decisions.value = decRes.decisions || []
    agentDirective.value = guide.guidance || ''
  } catch (e) {
    console.error('MODEX refresh failed', e)
  }
}

onMounted(async () => {
  try {
    const res = await api('/api/modex/orchestrator/active-project')
    if (res.projectId) {
      activeProject.value = res.projectId
      await refresh()
    }
  } catch { /* no active project */ }
})
</script>

<style scoped>
.modex-panel { padding: 16px; display: flex; flex-direction: column; gap: 12px; max-height: 100vh; overflow-y: auto; }
.modex-header { text-align: center; }
.modex-header-row { display: flex; align-items: center; justify-content: center; gap: 10px; }
.modex-title { font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 3px; }
.modex-badge { background: #ff6600; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; letter-spacing: 1px; }
.modex-subtitle { font-size: 12px; opacity: 0.5; margin: 4px 0 0; }

.modex-section { background: color-mix(in srgb, currentColor 4%, transparent); border-radius: 10px; padding: 14px; }
.modex-section-title { font-size: 13px; font-weight: 600; margin: 0 0 10px; opacity: 0.8; }

.modex-empty-state { text-align: center; padding: 30px 20px; }
.modex-empty-icon { font-size: 40px; margin-bottom: 10px; }
.modex-empty-state h3 { margin: 0 0 6px; font-size: 16px; }
.modex-empty-state p { font-size: 13px; opacity: 0.6; margin: 0 0 16px; }

.modex-create-row { display: flex; gap: 8px; justify-content: center; }
.modex-input { flex: 1; max-width: 200px; padding: 8px 12px; border: 1px solid color-mix(in srgb, currentColor 16%, transparent); border-radius: 6px; background: transparent; color: inherit; font-size: 13px; outline: none; }
.modex-input:focus { border-color: color-mix(in srgb, currentColor 40%, transparent); }

.modex-btn { padding: 8px 16px; border: none; border-radius: 6px; background: color-mix(in srgb, currentColor 12%, transparent); color: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.modex-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.modex-btn-primary { background: #6366f1; color: #fff; }
.modex-btn-danger { background: #ef4444; color: #fff; }
.modex-btn-sm { padding: 4px 10px; font-size: 12px; }

.modex-health-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.modex-health-left { display: flex; align-items: center; gap: 6px; }
.modex-health-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.modex-health-dot.healthy { background: #22c55e; }
.modex-health-dot.warning { background: #f59e0b; }
.modex-health-dot.critical { background: #ef4444; }
.modex-health-dot.stalled { background: #6b7280; }
.modex-health-label { font-size: 12px; font-weight: 700; letter-spacing: 1px; }
.modex-health-score { font-size: 13px; opacity: 0.7; }

.modex-health-center { display: flex; align-items: center; gap: 8px; }
.modex-step-badge { padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: color-mix(in srgb, currentColor 12%, transparent); }
.modex-step-badge.active { background: #6366f1; color: #fff; }
.modex-phase-label { font-size: 13px; font-weight: 600; }
.modex-progress-text { font-size: 12px; opacity: 0.5; }

.modex-pipeline { display: flex; gap: 4px; justify-content: center; }
.modex-pipeline-step { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 12px; border-radius: 8px; opacity: 0.4; font-size: 12px; }
.modex-pipeline-step.active { opacity: 1; background: color-mix(in srgb, currentColor 8%, transparent); }
.modex-pipeline-step.done { opacity: 0.7; }
.modex-pipeline-icon { font-size: 18px; }

.modex-phases { display: flex; flex-direction: column; gap: 10px; }
.modex-phase-card { border: 1px solid color-mix(in srgb, currentColor 12%, transparent); border-radius: 8px; padding: 12px; }
.modex-phase-card.active { border-color: #6366f1; }
.modex-phase-card.completed { border-color: #22c55e; opacity: 0.7; }
.modex-phase-card.locked { opacity: 0.4; }
.modex-phase-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.modex-phase-order { width: 22px; height: 22px; border-radius: 50%; background: color-mix(in srgb, currentColor 16%, transparent); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
.modex-phase-name { font-size: 14px; font-weight: 600; flex: 1; }
.modex-phase-status-tag { font-size: 10px; padding: 2px 6px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; background: color-mix(in srgb, currentColor 12%, transparent); }
.modex-phase-tasks { display: flex; flex-direction: column; gap: 4px; }

.modex-task-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; font-size: 13px; }
.modex-task-row.completed { opacity: 0.5; }
.modex-task-row.failed { background: color-mix(in srgb, #ef4444 8%, transparent); }
.modex-task-row.in-progress { background: color-mix(in srgb, #6366f1 8%, transparent); }
.modex-task-icon { width: 16px; text-align: center; }
.modex-task-title { flex: 1; }
.modex-task-priority { font-size: 10px; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; }
.modex-task-priority.critical { background: #ef4444; color: #fff; }
.modex-task-priority.high { background: #f59e0b; color: #000; }
.modex-task-priority.medium { background: color-mix(in srgb, currentColor 16%, transparent); }
.modex-task-priority.low { background: color-mix(in srgb, currentColor 8%, transparent); }
.modex-task-action { border: none; background: transparent; color: inherit; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px; }
.modex-task-action:hover { background: color-mix(in srgb, currentColor 12%, transparent); }
.modex-task-fail { color: #ef4444; }

.modex-learnings { display: flex; flex-direction: column; gap: 4px; }
.modex-learning-row { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; padding: 4px 0; }
.modex-learning-cat { padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; white-space: nowrap; }
.modex-learning-cat.success { background: #22c55e33; color: #22c55e; }
.modex-learning-cat.failure { background: #ef444433; color: #ef4444; }
.modex-learning-cat.insight { background: #6366f133; color: #6366f1; }
.modex-learning-cat.pattern { background: #3b82f633; color: #3b82f6; }
.modex-learning-cat.anti-pattern { background: #f59e0b33; color: #f59e0b; }
.modex-learning-text { flex: 1; opacity: 0.8; }

.modex-decisions { display: flex; flex-direction: column; gap: 4px; }
.modex-decision-row { display: flex; gap: 8px; font-size: 12px; padding: 4px 0; }
.modex-decision-time { color: #6b7280; white-space: nowrap; font-size: 11px; }
.modex-decision-text { flex: 1; opacity: 0.8; }

.modex-directive { font-family: Consolas, 'Courier New', monospace; font-size: 12px; line-height: 1.5; background: color-mix(in srgb, currentColor 6%, transparent); border-radius: 6px; padding: 12px; white-space: pre-wrap; word-break: break-word; margin: 0; max-height: 200px; overflow-y: auto; }

.modex-actions { display: flex; gap: 8px; justify-content: flex-end; }
</style>
