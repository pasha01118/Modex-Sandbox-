<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

interface Summary {
  totalUsed: number
  totalSaved: number
  totalCostUsd: number
  budgetUsed: number
  budgetRemaining: number
  budgetPercent: number
  byProvider: Record<string, { used: number; cost: number }>
  byModel: Record<string, { used: number; cost: number }>
  alarmTriggered: boolean
  alarmMessage: string | null
}

interface BudgetConfig {
  monthlyUsd: number
  enabled: boolean
}

const summary = ref<Summary | null>(null)
const budget = ref<BudgetConfig | null>(null)
const currentProvider = ref('')
const currentModel = ref('')
const loading = ref(true)
let eventSource: EventSource | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null

const formatTokens = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

const formatCost = (n: number): string => {
  if (n === 0) return '$0.00'
  if (n < 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(2)}`
}

const budgetBarColor = computed(() => {
  if (!summary.value) return '#6366f1'
  const pct = summary.value.budgetPercent
  if (pct >= 95) return '#ef4444'
  if (pct >= 80) return '#f59e0b'
  return '#22c55e'
})

const alarmPulse = computed(() => summary.value?.alarmTriggered ?? false)

async function fetchSummary() {
  try {
    const res = await fetch('/api/token-accountant/summary?period=month')
    if (res.ok) {
      summary.value = await res.json()
      const providers = Object.keys(summary.value!.byProvider)
      if (providers.length > 0) currentProvider.value = providers[providers.length - 1]
      const models = Object.keys(summary.value!.byModel)
      if (models.length > 0) currentModel.value = models[models.length - 1]
    }
  } catch {}
}

async function fetchBudget() {
  try {
    const res = await fetch('/api/token-accountant/budget')
    if (res.ok) {
      const data = await res.json()
      budget.value = { monthlyUsd: data.monthlyUsd, enabled: data.enabled }
    }
  } catch {}
}

function connectSSE() {
  eventSource = new EventSource('/api/token-accountant/events')
  eventSource.addEventListener('token:used', () => {
    fetchSummary()
  })
  eventSource.addEventListener('alarm:triggered', () => {
    fetchSummary()
  })
  eventSource.addEventListener('budget:updated', () => {
    fetchBudget()
    fetchSummary()
  })
  eventSource.onerror = () => {
    setTimeout(connectSSE, 5000)
  }
}

onMounted(async () => {
  await Promise.all([fetchSummary(), fetchBudget()])
  loading.value = false
  connectSSE()
  pollTimer = setInterval(fetchSummary, 30000)
})

onUnmounted(() => {
  eventSource?.close()
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="token-widget" :class="{ alarm: alarmPulse }">
    <div class="token-widget-header">
      <span class="token-widget-icon">$</span>
      <span class="token-widget-title">TOKENS</span>
      <span v-if="alarmPulse" class="token-alarm-dot"></span>
    </div>

    <div v-if="loading" class="token-widget-loading">Loading...</div>

    <template v-else-if="summary">
      <div class="token-row">
        <span class="token-label">Platform</span>
        <span class="token-value provider">{{ currentProvider || 'None' }}</span>
      </div>
      <div class="token-row">
        <span class="token-label">Model</span>
        <span class="token-value model">{{ currentModel || 'None' }}</span>
      </div>

      <div class="token-divider"></div>

      <div class="token-row">
        <span class="token-label">Used</span>
        <span class="token-value used">{{ formatTokens(summary.totalUsed) }}</span>
      </div>
      <div class="token-row">
        <span class="token-label">Saved</span>
        <span class="token-value saved">{{ formatTokens(summary.totalSaved) }}</span>
      </div>
      <div class="token-row">
        <span class="token-label">Cost</span>
        <span class="token-value cost">{{ formatCost(summary.totalCostUsd) }}</span>
      </div>

      <div v-if="budget?.enabled" class="token-budget-section">
        <div class="token-budget-header">
          <span class="token-label">Budget</span>
          <span class="token-budget-pct" :style="{ color: budgetBarColor }">{{ summary.budgetPercent }}%</span>
        </div>
        <div class="token-budget-bar">
          <div
            class="token-budget-fill"
            :style="{ width: Math.min(summary.budgetPercent, 100) + '%', background: budgetBarColor }"
          ></div>
        </div>
        <div class="token-budget-footer">
          <span>{{ formatCost(summary.budgetUsed) }} / {{ formatCost(budget.monthlyUsd) }}</span>
          <span v-if="summary.budgetRemaining >= 0">{{ formatCost(summary.budgetRemaining) }} left</span>
        </div>
      </div>

      <div v-if="alarmPulse" class="token-alarm-banner">
        {{ summary.alarmMessage }}
      </div>
    </template>

    <div v-else class="token-widget-empty">No data yet</div>
  </div>
</template>

<style scoped>
.token-widget {
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 10px;
  padding: 12px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.token-widget.alarm {
  border-color: #ef4444;
  box-shadow: 0 0 12px #ef444433;
  animation: alarm-pulse 2s ease-in-out infinite;
}
@keyframes alarm-pulse {
  0%, 100% { box-shadow: 0 0 12px #ef444433; }
  50% { box-shadow: 0 0 20px #ef444466; }
}

.token-widget-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.token-widget-icon {
  font-size: 14px;
  font-weight: 800;
  color: #22c55e;
  text-shadow: 0 0 6px #22c55e44;
}
.token-widget-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  opacity: 0.8;
}
.token-alarm-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: blink 1s infinite;
  margin-left: auto;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.token-widget-loading,
.token-widget-empty {
  text-align: center;
  opacity: 0.5;
  padding: 8px 0;
}

.token-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.token-label {
  opacity: 0.5;
  font-size: 11px;
}
.token-value {
  font-weight: 600;
  font-family: Consolas, monospace;
}
.token-value.provider { color: #00f5ff; }
.token-value.model { color: #ff00ff; font-size: 11px; }
.token-value.used { color: #f59e0b; }
.token-value.saved { color: #22c55e; }
.token-value.cost { color: #ff6600; }

.token-divider {
  height: 1px;
  background: color-mix(in srgb, currentColor 10%, transparent);
  margin: 2px 0;
}

.token-budget-section {
  margin-top: 2px;
}
.token-budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}
.token-budget-pct {
  font-weight: 700;
  font-family: Consolas, monospace;
}
.token-budget-bar {
  height: 4px;
  background: color-mix(in srgb, currentColor 10%, transparent);
  border-radius: 2px;
  overflow: hidden;
}
.token-budget-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}
.token-budget-footer {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  opacity: 0.5;
  margin-top: 2px;
}

.token-alarm-banner {
  background: #ef444422;
  border: 1px solid #ef444444;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 10px;
  color: #ef4444;
  font-weight: 600;
  text-align: center;
  animation: alarm-flash 1.5s ease-in-out infinite;
}
@keyframes alarm-flash {
  0%, 100% { background: #ef444422; }
  50% { background: #ef444444; }
}
</style>
