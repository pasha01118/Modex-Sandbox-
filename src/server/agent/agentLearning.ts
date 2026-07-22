import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { agentIdentities } from './agentIdentities.js'

const STATE_DIR = join(homedir(), '.codex', 'agent-learning')

export interface AgentExperience {
  agentId: string
  taskId: string
  projectId: string
  timestamp: string
  action: string
  result: 'success' | 'failure' | 'partial'
  learnings: string[]
  skills: string[]
  duration: number
  tokenCost: number
}

export interface AgentGrowth {
  agentId: string
  level: number
  xp: number
  xpToNext: number
  specialties: string[]
  totalTasks: number
  successRate: number
  avgDuration: number
  improvements: string[]
}

function ensureDir() {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true })
}

function getAgentFile(agentId: string): string {
  return join(STATE_DIR, `${agentId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`)
}

function loadExperiences(agentId: string): AgentExperience[] {
  const file = getAgentFile(agentId)
  if (!existsSync(file)) return []
  try { return JSON.parse(readFileSync(file, 'utf-8')) } catch { return [] }
}

function saveExperiences(agentId: string, experiences: AgentExperience[]) {
  ensureDir()
  writeFileSync(getAgentFile(agentId), JSON.stringify(experiences, null, 2))
}

export const agentLearning = {
  recordExperience(exp: Omit<AgentExperience, 'timestamp'>): void {
    const experiences = loadExperiences(exp.agentId)
    experiences.push({ ...exp, timestamp: new Date().toISOString() })
    saveExperiences(exp.agentId, experiences)

    const xp = exp.result === 'success' ? 100 : exp.result === 'partial' ? 50 : 10
    agentIdentities.addXp(exp.agentId, xp)
  },

  getExperiences(agentId: string): AgentExperience[] {
    return loadExperiences(agentId)
  },

  getGrowth(agentId: string): AgentGrowth {
    const experiences = loadExperiences(agentId)
    const identity = agentIdentities.get(agentId)
    const totalTasks = experiences.length
    const successes = experiences.filter(e => e.result === 'success').length
    const successRate = totalTasks > 0 ? Math.round((successes / totalTasks) * 100) : 0
    const avgDuration = totalTasks > 0
      ? Math.round(experiences.reduce((sum, e) => sum + e.duration, 0) / totalTasks)
      : 0

    const skillCounts: Record<string, number> = {}
    for (const exp of experiences) {
      for (const skill of exp.skills) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1
      }
    }
    const specialties = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([skill]) => skill)

    const xp = identity?.badge.xp || 0
    const level = identity?.badge.level || 1

    const improvements: string[] = []
    if (successRate < 80) improvements.push('Focus on reducing failures — review error patterns')
    if (totalTasks > 10 && avgDuration > 60000) improvements.push('Consider optimizing task approach for speed')
    const recentFailures = experiences.filter(e => e.result === 'failure').slice(-5)
    if (recentFailures.length >= 3) improvements.push('Multiple recent failures — may need capability upgrade')

    return {
      agentId,
      level,
      xp,
      xpToNext: level * 1000,
      specialties,
      totalTasks,
      successRate,
      avgDuration,
      improvements,
    }
  },

  analyzePatterns(agentId: string): string[] {
    const experiences = loadExperiences(agentId)
    const patterns: string[] = []

    if (experiences.length < 5) {
      patterns.push('Not enough data yet. Complete more tasks to enable pattern analysis.')
      return patterns
    }

    const successExps = experiences.filter(e => e.result === 'success')
    const failureExps = experiences.filter(e => e.result === 'failure')

    if (successExps.length > failureExps.length * 2) {
      patterns.push(`High reliability: ${Math.round((successExps.length / experiences.length) * 100)}% success rate`)
    }

    const actionCounts: Record<string, { success: number; fail: number }> = {}
    for (const exp of experiences) {
      if (!actionCounts[exp.action]) actionCounts[exp.action] = { success: 0, fail: 0 }
      actionCounts[exp.action][exp.result === 'success' ? 'success' : 'fail']++
    }

    for (const [action, counts] of Object.entries(actionCounts)) {
      const total = counts.success + counts.fail
      if (total >= 3) {
        const rate = Math.round((counts.success / total) * 100)
        if (rate >= 90) patterns.push(`Expert at "${action}" (${rate}% success)`)
        else if (rate < 50) patterns.push(`Struggles with "${action}" (${rate}% success) — consider training`)
      }
    }

    return patterns
  },

  suggestImprovements(agentId: string): string[] {
    const growth = this.getGrowth(agentId)
    const suggestions: string[] = []

    if (growth.successRate < 70) {
      suggestions.push('Success rate is low. Consider adding new capabilities or improving existing ones.')
    }
    if (growth.totalTasks > 20 && growth.specialties.length < 2) {
      suggestions.push('Limited specialty range. Diversify skills to handle more task types.')
    }
    if (growth.avgDuration > 30000) {
      suggestions.push('Average task duration is high. Optimize execution approach.')
    }
    if (growth.level < 5 && growth.totalTasks > 10) {
      suggestions.push('Level is low despite task count. Focus on quality over quantity.')
    }

    return [...growth.improvements, ...suggestions]
  },

  getLeaderboard(): AgentGrowth[] {
    const identities = agentIdentities.list()
    return identities
      .map(a => this.getGrowth(a.id))
      .sort((a, b) => b.xp - a.xp)
  },
}
