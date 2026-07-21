import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { totalmem, freemem, cpus, uptime, platform, release, loadavg } from 'node:os'
import { join } from 'node:path'
import { eventBus } from './eventBus.js'
import { agentMemory } from './agentMemory.js'

export interface HealthReport {
  timestamp: string
  memory: { total: number; free: number; usedPercent: number }
  cpu: { cores: number; loadAvg: number[] }
  uptime: { system: number; process: number }
  os: { platform: string; release: string }
  disk?: { available: number; total: number; usedPercent: number }
  git?: { branch: string; behind: number; ahead: number }
  dependencies?: { ok: boolean; message: string }
  ollama?: { running: boolean }
}

export interface AutoUpdateResult {
  checked: boolean
  updatesAvailable: boolean
  pulled: boolean
  rebuilt: boolean
  restarted: boolean
  error?: string
  before?: string
  after?: string
  log?: string
}

const APP_DIR = process.cwd()

function run(cmd: string, cwd?: string): string {
  try {
    return execSync(cmd, {
      cwd: cwd || APP_DIR,
      timeout: 15_000,
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024,
    }).trim()
  } catch {
    return ''
  }
}

export const selfHeal = {
  async checkHealth(): Promise<HealthReport> {
    const memTotal = totalmem()
    const memFree = freemem()
    const memUsedPercent = Math.round(((memTotal - memFree) / memTotal) * 100)

    const result: HealthReport = {
      timestamp: new Date().toISOString(),
      memory: {
        total: memTotal,
        free: memFree,
        usedPercent: memUsedPercent,
      },
      cpu: {
        cores: cpus().length,
        loadAvg: [Math.round(loadavg()[0] * 100) / 100, Math.round(loadavg()[1] * 100) / 100, Math.round(loadavg()[2] * 100) / 100],
      },
      uptime: {
        system: Math.round(uptime()),
        process: Math.round(process.uptime()),
      },
      os: {
        platform: platform(),
        release: release(),
      },
    }

    try {
      const { execSync } = await import('node:child_process')
      const df = execSync('df -k .', { encoding: 'utf-8', timeout: 5000 })
      const lines = df.trim().split('\n')
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/)
        if (parts.length >= 4) {
          const total = parseInt(parts[1], 10) * 1024
          const available = parseInt(parts[3], 10) * 1024
          result.disk = {
            available,
            total,
            usedPercent: Math.round(((total - available) / total) * 100),
          }
        }
      }
    } catch { /* skip disk check */ }

    try {
      const branch = run('git rev-parse --abbrev-ref HEAD')
      const behindAhead = run('git rev-list --left-right --count origin/main...HEAD')
      const parts = behindAhead.split(/\s+/)
      result.git = {
        branch,
        behind: parseInt(parts[0] || '0', 10),
        ahead: parseInt(parts[1] || '0', 10),
      }
    } catch { /* skip git check */ }

    try {
      const nodeVersion = process.version
      const pnpmCheck = run('pnpm --version')
      result.dependencies = {
        ok: !!pnpmCheck,
        message: `Node ${nodeVersion}, pnpm ${pnpmCheck || 'not found'}`,
      }
    } catch { /* skip dep check */ }

    try {
      const res = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(3000) })
      result.ollama = { running: res.ok }
    } catch {
      result.ollama = { running: false }
    }

    const prevHealth = agentMemory.get<HealthReport>('selfHeal', 'lastHealth')
    if (memUsedPercent > 90 && prevHealth && prevHealth.memory.usedPercent > 90) {
      eventBus.emit('agent:alert', {
        type: 'system:health',
        severity: 'high',
        message: `Memory usage critically high: ${memUsedPercent}%`,
        timestamp: result.timestamp,
      })
    }

    if (result.disk && result.disk.usedPercent > 95) {
      eventBus.emit('agent:alert', {
        type: 'system:health',
        severity: 'high',
        message: `Disk usage critically high: ${result.disk.usedPercent}%`,
        timestamp: result.timestamp,
      })
    }

    agentMemory.set('selfHeal', 'lastHealth', result)
    eventBus.emit('system:health', result)
    return result
  },

  async autoUpdate(): Promise<AutoUpdateResult> {
    const result: AutoUpdateResult = {
      checked: false,
      updatesAvailable: false,
      pulled: false,
      rebuilt: false,
      restarted: false,
    }

    try {
      result.before = run('git rev-parse HEAD')
      result.checked = true

      run('git fetch origin', APP_DIR)
      const behind = run('git rev-list --count HEAD..origin/main', APP_DIR)
      result.updatesAvailable = parseInt(behind, 10) > 0

      if (result.updatesAvailable) {
        eventBus.emit('system:update', {
          status: 'pulling',
          message: `${behind} new commits available, pulling...`,
        })

        run('git pull origin main', APP_DIR)
        result.after = run('git rev-parse HEAD')
        result.pulled = true

        eventBus.emit('system:update', {
          status: 'building',
          message: 'Rebuilding...',
        })

        try {
          run('pnpm run build', APP_DIR)
          result.rebuilt = true
        } catch (buildErr: any) {
          result.error = `Build failed: ${buildErr.message}`
          eventBus.emit('agent:alert', {
            type: 'system:update',
            severity: 'error',
            message: result.error,
            timestamp: new Date().toISOString(),
          })
          return result
        }

        if (result.rebuilt) {
          result.restarted = true
          eventBus.emit('system:update', {
            status: 'completed',
            message: 'Update applied. Restart recommended.',
          })
        }

        result.log = run('git log --oneline -5', APP_DIR)
      } else {
        eventBus.emit('system:update', {
          status: 'up-to-date',
          message: 'Already up to date with origin/main.',
        })
      }
    } catch (err: any) {
      result.error = err.message
      eventBus.emit('agent:alert', {
        type: 'system:update',
        severity: 'error',
        message: err.message,
        timestamp: new Date().toISOString(),
      })
    }

    agentMemory.set('selfHeal', 'lastUpdate', result)
    return result
  },

  startPeriodicHealthCheck(intervalMs = 300_000): () => void {
    const h = setInterval(() => {
      selfHeal.checkHealth().catch(() => {})
    }, intervalMs)
    h.unref()
    return () => clearInterval(h)
  },

  startPeriodicUpdateCheck(intervalMs = 3_600_000): () => void {
    const h = setInterval(() => {
      selfHeal.autoUpdate().catch(() => {})
    }, intervalMs)
    h.unref()
    return () => clearInterval(h)
  },
}
