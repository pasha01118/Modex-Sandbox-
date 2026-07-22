import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { eventBus } from './eventBus.js'
import { estimateCost, getModelPricing } from './tokenPricing.js'

const STATE_DIR = join(homedir(), '.codex', 'token-accountant')
const BUDGET_FILE = join(STATE_DIR, 'budget.json')
const ALARMS_FILE = join(STATE_DIR, 'alarms.json')

export interface TokenLogEntry {
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

export interface BudgetConfig {
  monthlyUsd: number
  enabled: boolean
}

export interface AlarmConfig {
  thresholds: number[]
  enabled: boolean
  lastTriggered: Record<number, string>
}

export interface TokenSummary {
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

export interface DailyStats {
  date: string
  totalTokens: number
  totalCost: number
  byProvider: Record<string, number>
}

let sseClients: Set<any> = new Set()
let cachedLogs: TokenLogEntry[] | null = null

function ensureStateDir() {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true })
}

function getLogFile(date: string): string {
  return join(STATE_DIR, `tokens-${date}.json`)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function loadLogsForDate(date: string): TokenLogEntry[] {
  const file = getLogFile(date)
  if (!existsSync(file)) return []
  try {
    return JSON.parse(readFileSync(file, 'utf-8')) as TokenLogEntry[]
  } catch {
    return []
  }
}

function saveLogsForDate(date: string, entries: TokenLogEntry[]) {
  ensureStateDir()
  writeFileSync(getLogFile(date), JSON.stringify(entries, null, 2))
}

function loadBudget(): BudgetConfig {
  if (!existsSync(BUDGET_FILE)) return { monthlyUsd: 0, enabled: false }
  try {
    return JSON.parse(readFileSync(BUDGET_FILE, 'utf-8'))
  } catch {
    return { monthlyUsd: 0, enabled: false }
  }
}

function saveBudget(config: BudgetConfig) {
  ensureStateDir()
  writeFileSync(BUDGET_FILE, JSON.stringify(config, null, 2))
}

function loadAlarms(): AlarmConfig {
  if (!existsSync(ALARMS_FILE)) return { thresholds: [75, 90, 95], enabled: true, lastTriggered: {} }
  try {
    return JSON.parse(readFileSync(ALARMS_FILE, 'utf-8'))
  } catch {
    return { thresholds: [75, 90, 95], enabled: true, lastTriggered: {} }
  }
}

function saveAlarms(config: AlarmConfig) {
  ensureStateDir()
  writeFileSync(ALARMS_FILE, JSON.stringify(config, null, 2))
}

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of sseClients) {
    try { client.write(payload) } catch { sseClients.delete(client) }
  }
}

function getMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMonthDates(): string[] {
  const mk = getMonthKey()
  const [y, m] = mk.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const dates: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(`${mk}-${String(d).padStart(2, '0')}`)
  }
  return dates
}

function getAllMonthLogs(): TokenLogEntry[] {
  const dates = getMonthDates()
  const logs: TokenLogEntry[] = []
  for (const date of dates) {
    logs.push(...loadLogsForDate(date))
  }
  return logs
}

export const tokenAccountant = {
  init() {
    ensureStateDir()
    eventBus.on('token:used', (payload: any) => {
      tokenAccountant.logTokenUsage({
        provider: payload.provider || 'unknown',
        model: payload.model || 'unknown',
        inputTokens: payload.inputTokens || 0,
        outputTokens: payload.outputTokens || 0,
        source: payload.source || 'unknown',
        cached: payload.cached || false,
      })
    })
  },

  logTokenUsage(params: {
    provider: string
    model: string
    inputTokens: number
    outputTokens: number
    source: string
    cached?: boolean
  }): TokenLogEntry {
    const totalTokens = params.inputTokens + params.outputTokens
    const estimatedCostUsd = estimateCost(params.provider, params.model, params.inputTokens, params.outputTokens)

    const entry: TokenLogEntry = {
      id: `tok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      provider: params.provider,
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      totalTokens,
      estimatedCostUsd,
      source: params.source,
      cached: params.cached ?? false,
    }

    const date = today()
    const logs = loadLogsForDate(date)
    logs.push(entry)
    saveLogsForDate(date, logs)
    cachedLogs = null

    broadcastSSE('token:used', entry)
    this.checkBudgetAlarms()
    return entry
  },

  getSummary(period: 'today' | '7d' | '30d' | 'month' | 'all' = 'today'): TokenSummary {
    let logs: TokenLogEntry[] = []
    const now = new Date()

    if (period === 'today') {
      logs = loadLogsForDate(today())
    } else if (period === '7d') {
      for (let i = 0; i < 7; i++) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        logs.push(...loadLogsForDate(d.toISOString().slice(0, 10)))
      }
    } else if (period === '30d') {
      for (let i = 0; i < 30; i++) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        logs.push(...loadLogsForDate(d.toISOString().slice(0, 10)))
      }
    } else if (period === 'month') {
      logs = getAllMonthLogs()
    } else {
      const files = existsSync(STATE_DIR)
        ? readdirSync(STATE_DIR).filter(f => f.startsWith('tokens-') && f.endsWith('.json')).sort()
        : []
      for (const file of files) {
        logs.push(...loadLogsForDate(file.replace('tokens-', '').replace('.json', '')))
      }
    }

    let totalUsed = 0
    let totalCostUsd = 0
    let totalSaved = 0
    const byProvider: Record<string, { used: number; cost: number }> = {}
    const byModel: Record<string, { used: number; cost: number }> = {}
    const bySource: Record<string, { used: number; cost: number }> = {}

    for (const entry of logs) {
      totalUsed += entry.totalTokens
      totalCostUsd += entry.estimatedCostUsd

      if (!byProvider[entry.provider]) byProvider[entry.provider] = { used: 0, cost: 0 }
      byProvider[entry.provider].used += entry.totalTokens
      byProvider[entry.provider].cost += entry.estimatedCostUsd

      if (!byModel[entry.model]) byModel[entry.model] = { used: 0, cost: 0 }
      byModel[entry.model].used += entry.totalTokens
      byModel[entry.model].cost += entry.estimatedCostUsd

      if (!bySource[entry.source]) bySource[entry.source] = { used: 0, cost: 0 }
      bySource[entry.source].used += entry.totalTokens
      bySource[entry.source].cost += entry.estimatedCostUsd

      if (entry.cached) {
        const fullCost = estimateCost(entry.provider, entry.model, entry.inputTokens, entry.outputTokens)
        const savedAmount = fullCost - entry.estimatedCostUsd
        if (savedAmount > 0) totalSaved += Math.round(entry.inputTokens * 0.9)
      }
    }

    const budget = loadBudget()
    const budgetUsed = totalCostUsd
    const budgetRemaining = budget.enabled ? Math.max(0, budget.monthlyUsd - budgetUsed) : Infinity
    const budgetPercent = budget.enabled && budget.monthlyUsd > 0
      ? Math.round((budgetUsed / budget.monthlyUsd) * 100)
      : 0

    const alarms = loadAlarms()
    let alarmTriggered = false
    let alarmMessage: string | null = null
    if (budget.enabled && alarms.enabled) {
      for (const threshold of alarms.thresholds.sort((a, b) => b - a)) {
        if (budgetPercent >= threshold) {
          alarmTriggered = true
          alarmMessage = `Budget ${threshold}% threshold reached! Used $${budgetUsed.toFixed(4)} of $${budget.monthlyUsd.toFixed(2)} (${budgetPercent}%)`
          break
        }
      }
    }

    return {
      totalUsed,
      totalSaved,
      totalCostUsd,
      budgetUsed,
      budgetRemaining: budgetRemaining === Infinity ? -1 : budgetRemaining,
      budgetPercent,
      byProvider,
      byModel,
      bySource,
      alarmTriggered,
      alarmMessage,
    }
  },

  getDailyStats(days: number = 7): DailyStats[] {
    const stats: DailyStats[] = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const date = d.toISOString().slice(0, 10)
      const logs = loadLogsForDate(date)
      let totalTokens = 0
      let totalCost = 0
      const byProvider: Record<string, number> = {}
      for (const entry of logs) {
        totalTokens += entry.totalTokens
        totalCost += entry.estimatedCostUsd
        byProvider[entry.provider] = (byProvider[entry.provider] || 0) + entry.totalTokens
      }
      stats.push({ date, totalTokens, totalCost, byProvider })
    }
    return stats
  },

  getLogs(params: { provider?: string; model?: string; source?: string; limit?: number; offset?: number } = {}): TokenLogEntry[] {
    const now = new Date()
    let logs: TokenLogEntry[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      logs.push(...loadLogsForDate(d.toISOString().slice(0, 10)))
    }

    if (params.provider) logs = logs.filter(l => l.provider === params.provider)
    if (params.model) logs = logs.filter(l => l.model === params.model)
    if (params.source) logs = logs.filter(l => l.source === params.source)

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const offset = params.offset || 0
    const limit = params.limit || 50
    return logs.slice(offset, offset + limit)
  },

  getAdvice(): string[] {
    const advice: string[] = []
    const summary = tokenAccountant.getSummary('7d')

    const hasOllama = 'ollama' in summary.byProvider
    const hasCloud = Object.keys(summary.byProvider).some(p => p !== 'ollama' && p !== 'unknown')

    if (!hasOllama && hasCloud) {
      advice.push('Ollama is available locally — route simple planning tasks there to save ~100% on token costs.')
    }

    if (summary.totalUsed > 500000) {
      advice.push('High token usage this week (>500K). Consider starting new threads more frequently to avoid context bloat.')
    }

    if (summary.budgetPercent > 80) {
      advice.push(`Budget is ${summary.budgetPercent}% used. Switch to local Ollama for non-critical tasks.`)
    }

    const providerEntries = Object.entries(summary.byProvider)
    if (providerEntries.length > 1) {
      const cheapest = providerEntries.reduce((min, [p, v]) =>
        v.cost < min.cost ? { provider: p, cost: v.cost } : min,
        { provider: providerEntries[0][0], cost: providerEntries[0][1].cost }
      )
      const mostExpensive = providerEntries.reduce((max, [p, v]) =>
        v.cost > max.cost ? { provider: p, cost: v.cost } : max,
        { provider: providerEntries[0][0], cost: providerEntries[0][1].cost }
      )
      if (mostExpensive.cost > cheapest.cost * 3 && mostExpensive.cost > 0.01) {
        advice.push(`${mostExpensive.provider} costs ${(mostExpensive.cost / cheapest.cost).toFixed(1)}x more than ${cheapest.provider}. Review routing decisions.`)
      }
    }

    if (summary.totalSaved > 0) {
      advice.push(`Good job! You've saved ~${summary.totalSaved.toLocaleString()} tokens through caching this period.`)
    }

    if (advice.length === 0) {
      advice.push('Token usage is healthy. No optimization needed right now.')
    }

    return advice
  },

  setBudget(monthlyUsd: number) {
    const config = loadBudget()
    config.monthlyUsd = monthlyUsd
    config.enabled = monthlyUsd > 0
    saveBudget(config)
    broadcastSSE('budget:updated', config)
    return config
  },

  getBudget(): BudgetConfig {
    return loadBudget()
  },

  setAlarms(config: Partial<AlarmConfig>) {
    const current = loadAlarms()
    if (config.thresholds !== undefined) current.thresholds = config.thresholds
    if (config.enabled !== undefined) current.enabled = config.enabled
    saveAlarms(current)
    broadcastSSE('alarms:updated', current)
    return current
  },

  getAlarms(): AlarmConfig {
    return loadAlarms()
  },

  checkBudgetAlarms() {
    const budget = loadBudget()
    if (!budget.enabled) return
    const alarms = loadAlarms()
    if (!alarms.enabled) return

    const summary = tokenAccountant.getSummary('month')

    for (const threshold of alarms.thresholds) {
      if (summary.budgetPercent >= threshold) {
        const lastTriggered = alarms.lastTriggered[threshold]
        const todayStr = today()
        if (lastTriggered !== todayStr) {
          alarms.lastTriggered[threshold] = todayStr
          saveAlarms(alarms)

          broadcastSSE('alarm:triggered', {
            threshold,
            percent: summary.budgetPercent,
            used: summary.budgetUsed,
            budget: budget.monthlyUsd,
            message: `Budget ${threshold}% alarm: $${summary.budgetUsed.toFixed(4)} of $${budget.monthlyUsd.toFixed(2)} used`,
          })

          eventBus.emit('agent:alert', {
            level: threshold >= 95 ? 'critical' : threshold >= 90 ? 'warning' : 'info',
            source: 'token-accountant',
            message: `Token budget alarm: ${threshold}% threshold reached`,
          })
        }
      }
    }
  },

  addSSEClient(res: any) {
    sseClients.add(res)
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'ok' })}\n\n`)
  },

  removeSSEClient(res: any) {
    sseClients.delete(res)
  },

  cleanupOldLogs(keepDays: number = 30) {
    if (!existsSync(STATE_DIR)) return
    const now = new Date()
    const files = readdirSync(STATE_DIR).filter(f => f.startsWith('tokens-') && f.endsWith('.json'))
    for (const file of files) {
      const dateStr = file.replace('tokens-', '').replace('.json', '')
      const fileDate = new Date(dateStr)
      const ageDays = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24))
      if (ageDays > keepDays) {
        unlinkSync(join(STATE_DIR, file))
      }
    }
  },
}
