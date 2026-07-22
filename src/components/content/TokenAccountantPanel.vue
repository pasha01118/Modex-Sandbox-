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
  bySource: Record<string, { used: number; cost: number }>
  alarmTriggered: boolean
  alarmMessage: string | null
}

interface DailyStats {
  date: string
  totalTokens: number
  totalCost: number
  byProvider: Record<string, number>
}

interface TokenLog {
  id: string
  timestamp: string
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostUsd: number
  source: string
  cached: boolean
}

interface BudgetConfig {
  monthlyUsd: number
  enabled: boolean
}

interface AlarmConfig {
  thresholds: number[]
  enabled: boolean
}

const period = ref<'today' | '7d' | '30d' | 'month'>('today')
const summary = ref<Summary | null>(null)
const daily = ref<DailyStats[]>([])
const logs = ref<TokenLog[]>([])
const advice = ref<string[]>([])
const budget = ref<BudgetConfig>({ monthlyUsd: 0, enabled: false })
const alarms = ref<AlarmConfig>({ thresholds: [75, 90, 95], enabled: true })
const budgetInput = ref('')
const alarmInput = ref('')
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

const formatTime = (iso: string): string => {
  try { return new Date(iso).toLocaleTimeString() } catch { return '' }
}

const formatModel = (m: string): string => {
  if (m.length > 24) return m.slice(0, 24) + '...'
  return m
}

const budgetBarColor = computed(() => {
  if (!summary.value) return '#6366f1'
  const pct = summary.value.budgetPercent
  if (pct >= 95) return '#ef4444'
  if (pct >= 80) return '#f59e0b'
  return '#22c55e'
})

const maxDailyTokens = computed(() => {
  if (daily.value.length === 0) return 1
  return Math.max(...daily.value.map(d => d.totalTokens), 1)
})

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, init)
  return res.json()
}

async function fetchAll() {
  try {
    const [s, d, l, a, b] = await Promise.all([
      api(`/api/token-accountant/summary?period=${period.value}`),
      api('/api/token-accountant/daily?days=7'),
      api('/api/token-accountant/logs?limit=30'),
      api('/api/token-accountant/advice'),
      api('/api/token-accountant/budget'),
    ])
    summary.value = s
    daily.value = d
    logs.value = l
    advice.value = a.advice || []
    budget.value = { monthlyUsd: b.monthlyUsd, enabled: b.enabled }
    alarms.value = b.alarms || alarms.value
    budgetInput.value = budget.value.monthlyUsd > 0 ? String(budget.value.monthlyUsd) : ''
    alarmInput.value = alarms.value.thresholds.join(', ')
  } catch {}
  loading.value = false
}

async function changePeriod(p: typeof period.value) {
  period.value = p
  summary.value = await api(`/api/token-accountant/summary?period=${p}`)
}

async function setBudget() {
  const val = parseFloat(budgetInput.value)
  if (isNaN(val) || val < 0) return
  await api('/api/token-accountant/budget', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthlyUsd: val }),
  })
  fetchAll()
}

async function setAlarms() {
  const thresholds = alarmInput.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0 && n <= 100)
  await api('/api/token-accountant/alarms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thresholds, enabled: true }),
  })
  fetchAll()
}

function connectSSE() {
  eventSource = new EventSource('/api/token-accountant/events')
  eventSource.addEventListener('token:used', () => fetchAll())
  eventSource.addEventListener('alarm:triggered', () => fetchAll())
  eventSource.addEventListener('budget:updated', () => fetchAll())
  eventSource.onerror = () => { setTimeout(connectSSE, 5000) }
}

onMounted(async () => {
  await fetchAll()
  connectSSE()
  pollTimer = setInterval(fetchAll, 15000)
})

onUnmounted(() => {
  eventSource?.close()
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="ta-panel">
    <div class="ta-header">
      <div class="ta-header-row">
        <span class="ta-icon">$</span>
        <h2 class="ta-title">Token Accountant</h2>
        <span class="ta-badge">LIVE</span>
      </div>
      <p class="ta-subtitle">AI API usage tracker with budget alarms</p>
    </div>

    <div v-if="loading" class="ta-loading">Loading...</div>

    <template v-else>
      <!-- Period Selector -->
      <div class="ta-period-bar">
        <button v-for="p in ['today', '7d', '30d', 'month']" :key="p"
          class="ta-period-btn" :class="{ active: period === p }"
          @click="changePeriod(p as any)">
          {{ p === 'today' ? 'Today' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'This Month' }}
        </button>
      </div>

      <!-- Alarm Banner -->
      <div v-if="summary?.alarmTriggered" class="ta-alarm-banner">
        <span class="ta-alarm-icon">!</span>
        {{ summary.alarmMessage }}
      </div>

      <!-- Summary Cards -->
      <div class="ta-cards" v-if="summary">
        <div class="ta-card">
          <div class="ta-card-label">Tokens Used</div>
          <div class="ta-card-value used">{{ formatTokens(summary.totalUsed) }}</div>
        </div>
        <div class="ta-card">
          <div class="ta-card-label">Tokens Saved</div>
          <div class="ta-card-value saved">{{ formatTokens(summary.totalSaved) }}</div>
        </div>
        <div class="ta-card">
          <div class="ta-card-label">Estimated Cost</div>
          <div class="ta-card-value cost">{{ formatCost(summary.totalCostUsd) }}</div>
        </div>
        <div class="ta-card">
          <div class="ta-card-label">Budget Left</div>
          <div class="ta-card-value" :style="{ color: budgetBarColor }">
            {{ summary.budgetRemaining >= 0 ? formatCost(summary.budgetRemaining) : 'Unset' }}
          </div>
        </div>
      </div>

      <!-- Budget Bar -->
      <div v-if="budget?.enabled && summary" class="ta-section">
        <div class="ta-section-title">Budget Progress</div>
        <div class="ta-budget-bar">
          <div class="ta-budget-fill" :style="{ width: Math.min(summary.budgetPercent, 100) + '%', background: budgetBarColor }"></div>
        </div>
        <div class="ta-budget-text">
          <span>{{ formatCost(summary.budgetUsed) }} of {{ formatCost(budget.monthlyUsd) }}</span>
          <span :style="{ color: budgetBarColor }">{{ summary.budgetPercent }}%</span>
        </div>
      </div>

      <!-- Provider Breakdown -->
      <div class="ta-section" v-if="summary && Object.keys(summary.byProvider).length > 0">
        <div class="ta-section-title">By Provider</div>
        <div class="ta-table">
          <div class="ta-table-header">
            <span>Provider</span><span>Tokens</span><span>Cost</span>
          </div>
          <div v-for="(data, provider) in summary.byProvider" :key="provider" class="ta-table-row">
            <span class="ta-provider-name">{{ provider }}</span>
            <span>{{ formatTokens(data.used) }}</span>
            <span>{{ formatCost(data.cost) }}</span>
          </div>
        </div>
      </div>

      <!-- Model Breakdown -->
      <div class="ta-section" v-if="summary && Object.keys(summary.byModel).length > 0">
        <div class="ta-section-title">By Model</div>
        <div class="ta-table">
          <div class="ta-table-header">
            <span>Model</span><span>Tokens</span><span>Cost</span>
          </div>
          <div v-for="(data, model) in summary.byModel" :key="model" class="ta-table-row">
            <span class="ta-model-name" :title="String(model)">{{ formatModel(String(model)) }}</span>
            <span>{{ formatTokens(data.used) }}</span>
            <span>{{ formatCost(data.cost) }}</span>
          </div>
        </div>
      </div>

      <!-- Daily Chart -->
      <div class="ta-section" v-if="daily.length > 0">
        <div class="ta-section-title">Daily Usage (7 Days)</div>
        <div class="ta-chart">
          <div v-for="day in daily" :key="day.date" class="ta-chart-bar-wrap">
            <div class="ta-chart-bar-outer">
              <div class="ta-chart-bar" :style="{ height: (day.totalTokens / maxDailyTokens * 100) + '%' }"></div>
            </div>
            <div class="ta-chart-label">{{ day.date.slice(5) }}</div>
          </div>
        </div>
      </div>

      <!-- Optimization Tips -->
      <div class="ta-section" v-if="advice.length > 0">
        <div class="ta-section-title">Optimization Tips</div>
        <div v-for="(tip, i) in advice" :key="i" class="ta-advice-item">
          <span class="ta-advice-bullet">*</span>
          {{ tip }}
        </div>
      </div>

      <!-- Budget Settings -->
      <div class="ta-section">
        <div class="ta-section-title">Budget Settings</div>
        <div class="ta-settings-row">
          <label>Monthly Budget (USD)</label>
          <div class="ta-input-group">
            <input v-model="budgetInput" type="number" min="0" step="0.01" placeholder="0.00" class="ta-input" />
            <button class="ta-btn ta-btn-primary" @click="setBudget">Set</button>
          </div>
        </div>
        <div class="ta-settings-row">
          <label>Alarm Thresholds (%)</label>
          <div class="ta-input-group">
            <input v-model="alarmInput" type="text" placeholder="75, 90, 95" class="ta-input" />
            <button class="ta-btn ta-btn-primary" @click="setAlarms">Set</button>
          </div>
          <div class="ta-hint">Comma-separated percentages (0-100)</div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="ta-section" v-if="logs.length > 0">
        <div class="ta-section-title">Recent Activity</div>
        <div class="ta-log-list">
          <div v-for="log in logs.slice(0, 15)" :key="log.id" class="ta-log-row">
            <div class="ta-log-time">{{ formatTime(log.timestamp) }}</div>
            <div class="ta-log-provider" :class="log.provider">{{ log.provider }}</div>
            <div class="ta-log-model">{{ formatModel(log.model) }}</div>
            <div class="ta-log-tokens">{{ formatTokens(log.totalTokens) }}</div>
            <div class="ta-log-cost">{{ formatCost(log.estimatedCostUsd) }}</div>
            <div v-if="log.cached" class="ta-log-cached">cached</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ta-panel { padding: 16px; display: flex; flex-direction: column; gap: 12px; max-height: 100vh; overflow-y: auto; }

.ta-header { text-align: center; }
.ta-header-row { display: flex; align-items: center; justify-content: center; gap: 10px; }
.ta-icon { font-size: 22px; font-weight: 800; color: #22c55e; text-shadow: 0 0 10px #22c55e44; }
.ta-title { font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 2px; }
.ta-badge { background: #22c55e; color: #fff; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 10px; letter-spacing: 1px; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.ta-subtitle { font-size: 12px; opacity: 0.5; margin: 4px 0 0; }

.ta-loading { text-align: center; opacity: 0.5; padding: 30px; }

.ta-period-bar { display: flex; gap: 6px; justify-content: center; }
.ta-period-btn { padding: 6px 14px; border: 1px solid color-mix(in srgb, currentColor 16%, transparent); border-radius: 6px; background: transparent; color: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.ta-period-btn:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
.ta-period-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }

.ta-alarm-banner { display: flex; align-items: center; gap: 8px; background: #ef444422; border: 1px solid #ef444444; border-radius: 8px; padding: 10px 14px; color: #ef4444; font-size: 13px; font-weight: 600; animation: alarm-flash 1.5s infinite; }
.ta-alarm-icon { background: #ef4444; color: #fff; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
@keyframes alarm-flash { 0%, 100% { background: #ef444422; } 50% { background: #ef444444; } }

.ta-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.ta-card { background: color-mix(in srgb, currentColor 4%, transparent); border-radius: 10px; padding: 14px; text-align: center; }
.ta-card-label { font-size: 11px; opacity: 0.5; margin-bottom: 4px; }
.ta-card-value { font-size: 20px; font-weight: 800; font-family: Consolas, monospace; }
.ta-card-value.used { color: #f59e0b; }
.ta-card-value.saved { color: #22c55e; }
.ta-card-value.cost { color: #ff6600; }

.ta-section { background: color-mix(in srgb, currentColor 4%, transparent); border-radius: 10px; padding: 14px; }
.ta-section-title { font-size: 13px; font-weight: 600; margin: 0 0 10px; opacity: 0.8; }

.ta-budget-bar { height: 6px; background: color-mix(in srgb, currentColor 10%, transparent); border-radius: 3px; overflow: hidden; }
.ta-budget-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.ta-budget-text { display: flex; justify-content: space-between; font-size: 12px; opacity: 0.6; margin-top: 4px; }

.ta-table { display: flex; flex-direction: column; gap: 4px; }
.ta-table-header { display: grid; grid-template-columns: 1fr 1fr 1fr; font-size: 10px; opacity: 0.4; text-transform: uppercase; letter-spacing: 0.5px; padding: 0 4px; }
.ta-table-row { display: grid; grid-template-columns: 1fr 1fr 1fr; font-size: 12px; padding: 6px 4px; border-radius: 4px; }
.ta-table-row:hover { background: color-mix(in srgb, currentColor 6%, transparent); }
.ta-provider-name { font-weight: 600; color: #00f5ff; }
.ta-model-name { font-weight: 500; color: #ff00ff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ta-chart { display: flex; gap: 6px; align-items: flex-end; height: 80px; }
.ta-chart-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
.ta-chart-bar-outer { flex: 1; width: 100%; display: flex; align-items: flex-end; }
.ta-chart-bar { width: 100%; background: linear-gradient(180deg, #6366f1, #00f5ff); border-radius: 3px 3px 0 0; min-height: 2px; transition: height 0.3s ease; }
.ta-chart-label { font-size: 9px; opacity: 0.4; }

.ta-advice-item { font-size: 12px; line-height: 1.6; padding: 4px 0; display: flex; gap: 6px; }
.ta-advice-bullet { color: #22c55e; font-weight: 700; }

.ta-settings-row { margin-bottom: 10px; }
.ta-settings-row label { font-size: 12px; opacity: 0.6; display: block; margin-bottom: 4px; }
.ta-input-group { display: flex; gap: 6px; }
.ta-input { flex: 1; padding: 8px 10px; border: 1px solid color-mix(in srgb, currentColor 16%, transparent); border-radius: 6px; background: transparent; color: inherit; font-size: 13px; outline: none; font-family: Consolas, monospace; }
.ta-input:focus { border-color: color-mix(in srgb, currentColor 40%, transparent); }
.ta-btn { padding: 8px 14px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; color: inherit; }
.ta-btn-primary { background: #6366f1; color: #fff; }
.ta-btn:hover { opacity: 0.85; }
.ta-hint { font-size: 10px; opacity: 0.4; margin-top: 3px; }

.ta-log-list { display: flex; flex-direction: column; gap: 2px; max-height: 300px; overflow-y: auto; }
.ta-log-row { display: grid; grid-template-columns: 60px 70px 1fr 60px 55px 45px; gap: 6px; font-size: 11px; padding: 5px 4px; border-radius: 4px; align-items: center; }
.ta-log-row:hover { background: color-mix(in srgb, currentColor 6%, transparent); }
.ta-log-time { opacity: 0.4; font-family: Consolas, monospace; }
.ta-log-provider { font-weight: 600; }
.ta-log-provider.ollama { color: #22c55e; }
.ta-log-provider.openrouter { color: #00f5ff; }
.ta-log-provider.codex { color: #ff00ff; }
.ta-log-provider.zen { color: #f59e0b; }
.ta-log-model { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.7; }
.ta-log-tokens { font-family: Consolas, monospace; text-align: right; }
.ta-log-cost { font-family: Consolas, monospace; color: #ff6600; text-align: right; }
.ta-log-cached { color: #22c55e; font-size: 9px; font-weight: 600; }

@media (max-width: 600px) {
  .ta-cards { grid-template-columns: repeat(2, 1fr); }
  .ta-log-row { grid-template-columns: 50px 55px 1fr 50px; }
  .ta-log-cost, .ta-log-cached { display: none; }
}
</style>
