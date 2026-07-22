import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { eventBus } from './eventBus.js'
import type { AgentStatus } from './baseAgent.js'

const STATE_DIR = join(homedir(), '.codex', 'agent-identities')
const IDENTITIES_FILE = join(STATE_DIR, 'identities.json')

export interface AgentBadge {
  level: number
  xp: number
  specialties: string[]
}

export interface AgentIdentity {
  id: string
  name: string
  role: string
  avatar: string
  color: string
  personality: string
  capabilities: string[]
  qualifications: string[]
  skills: string[]
  isCustom: boolean
  createdBy: 'system' | 'user'
  createdAt: string
  status: AgentStatus
  assignedProjects: string[]
  badge: AgentBadge
  config: {
    maxConcurrentTasks: number
    taskTimeout: number
    narrationStyle: 'detailed' | 'milestones' | 'minimal'
    personalityTraits: string[]
  }
}

function ensureDir() {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true })
}

function loadIdentities(): AgentIdentity[] {
  ensureDir()
  if (!existsSync(IDENTITIES_FILE)) {
    writeFileSync(IDENTITIES_FILE, JSON.stringify(BUILT_IN_IDENTITIES, null, 2))
    return [...BUILT_IN_IDENTITIES]
  }
  try {
    return JSON.parse(readFileSync(IDENTITIES_FILE, 'utf-8'))
  } catch {
    return [...BUILT_IN_IDENTITIES]
  }
}

function saveIdentities(identities: AgentIdentity[]) {
  ensureDir()
  writeFileSync(IDENTITIES_FILE, JSON.stringify(identities, null, 2))
}

const BUILT_IN_IDENTITIES: AgentIdentity[] = [
  {
    id: 'modex', name: 'MODEX', role: 'Head of Department', avatar: '👑', color: '#ff6600',
    personality: 'Authoritative, strategic, decisive. Gives clear direction. Never panics. Leads from the front.',
    capabilities: ['planning', 'monitoring', 'communication', 'code'],
    qualifications: ['Project Management', 'System Architecture', 'Team Leadership', 'Risk Assessment'],
    skills: ['roadmap-enforcement', 'phase-gates', 'scope-guard', 'agent-guidance'],
    isCustom: false, createdBy: 'system', createdAt: new Date().toISOString(),
    status: 'idle', assignedProjects: [],
    badge: { level: 10, xp: 10000, specialties: ['Leadership', 'Architecture', 'Strategy'] },
    config: { maxConcurrentTasks: 1, taskTimeout: 120, narrationStyle: 'milestones', personalityTraits: ['authoritative', 'strategic', 'calm'] },
  },
  {
    id: 'atlas', name: 'Atlas', role: 'Lead Architect', avatar: '🧠', color: '#00f5ff',
    personality: 'Methodical, thorough. Plans before acting. Documents everything. Thinks in systems.',
    capabilities: ['planning', 'code'],
    qualifications: ['System Design', 'Architecture Patterns', 'Technical Writing', 'Code Review'],
    skills: ['goal-decomposition', 'plan-creation', 'dependency-analysis', 'architecture-design'],
    isCustom: false, createdBy: 'system', createdAt: new Date().toISOString(),
    status: 'idle', assignedProjects: [],
    badge: { level: 8, xp: 7500, specialties: ['Architecture', 'Planning', 'Documentation'] },
    config: { maxConcurrentTasks: 1, taskTimeout: 60, narrationStyle: 'detailed', personalityTraits: ['methodical', 'thorough', 'analytical'] },
  },
  {
    id: 'forge', name: 'Forge', role: 'Senior Engineer', avatar: '⚒️', color: '#ff00ff',
    personality: 'Fast, precise, action-oriented. Shows results, not excuses. Builds things that work.',
    capabilities: ['execution', 'code'],
    qualifications: ['Full-Stack Development', 'TypeScript', 'Node.js', 'Vue.js', 'System Programming'],
    skills: ['file-operations', 'shell-commands', 'git-operations', 'code-generation', 'testing'],
    isCustom: false, createdBy: 'system', createdAt: new Date().toISOString(),
    status: 'idle', assignedProjects: [],
    badge: { level: 9, xp: 9000, specialties: ['TypeScript', 'Node.js', 'Vue.js'] },
    config: { maxConcurrentTasks: 2, taskTimeout: 30, narrationStyle: 'milestones', personalityTraits: ['fast', 'precise', 'practical'] },
  },
  {
    id: 'sentinel', name: 'Sentinel', role: 'DevOps Lead', avatar: '🛡️', color: '#22c55e',
    personality: 'Vigilant, protective. Monitors health 24/7. Reports anomalies immediately. Never sleeps.',
    capabilities: ['maintenance', 'monitoring'],
    qualifications: ['DevOps', 'System Administration', 'Security', 'Performance Monitoring', 'Auto-Healing'],
    skills: ['health-checks', 'auto-update', 'memory-cleanup', 'git-sync', 'dependency-audit'],
    isCustom: false, createdBy: 'system', createdAt: new Date().toISOString(),
    status: 'monitoring', assignedProjects: [],
    badge: { level: 7, xp: 6000, specialties: ['DevOps', 'Security', 'Monitoring'] },
    config: { maxConcurrentTasks: 1, taskTimeout: 60, narrationStyle: 'milestones', personalityTraits: ['vigilant', 'protective', 'reliable'] },
  },
  {
    id: 'ledger', name: 'Ledger', role: 'Token Accountant', avatar: '💰', color: '#f59e0b',
    personality: 'Cost-conscious, data-driven. Tracks every token. Warns before budget is hit. Never wastes.',
    capabilities: ['monitoring', 'communication'],
    qualifications: ['Cost Optimization', 'Token Economics', 'Budget Management', 'Usage Analytics'],
    skills: ['token-tracking', 'cost-estimation', 'budget-alarms', 'optimization-tips'],
    isCustom: false, createdBy: 'system', createdAt: new Date().toISOString(),
    status: 'idle', assignedProjects: [],
    badge: { level: 6, xp: 5000, specialties: ['Cost Analysis', 'Token Tracking', 'Budgeting'] },
    config: { maxConcurrentTasks: 1, taskTimeout: 30, narrationStyle: 'minimal', personalityTraits: ['precise', 'cautious', 'data-driven'] },
  },
  {
    id: 'guard', name: 'Guard', role: 'Auditor & Inspector', avatar: '🔍', color: '#6366f1',
    personality: 'Strict, meticulous, uncompromising. Checks everything twice. Junior to MODEX. Reports findings clearly.',
    capabilities: ['monitoring', 'code', 'communication'],
    qualifications: ['Code Audit', 'Quality Assurance', 'Security Review', 'Performance Testing', 'Compliance'],
    skills: ['code-audit', 'test-verification', 'phase-gate-check', 'project-review', 'security-scan'],
    isCustom: false, createdBy: 'system', createdAt: new Date().toISOString(),
    status: 'idle', assignedProjects: [],
    badge: { level: 8, xp: 7000, specialties: ['Code Quality', 'Security Audit', 'QA'] },
    config: { maxConcurrentTasks: 1, taskTimeout: 60, narrationStyle: 'detailed', personalityTraits: ['strict', 'meticulous', 'thorough'] },
  },
]

export const agentIdentities = {
  list(): AgentIdentity[] {
    return loadIdentities()
  },

  get(id: string): AgentIdentity | undefined {
    return loadIdentities().find(a => a.id === id)
  },

  create(data: Partial<AgentIdentity>): AgentIdentity {
    const identities = loadIdentities()
    const identity: AgentIdentity = {
      id: data.id || `custom-${Date.now()}`,
      name: data.name || 'Custom Agent',
      role: data.role || 'Custom Role',
      avatar: data.avatar || '🤖',
      color: data.color || '#8b5cf6',
      personality: data.personality || 'Helpful and capable.',
      capabilities: data.capabilities || ['execution', 'code'],
      qualifications: data.qualifications || [],
      skills: data.skills || [],
      isCustom: true,
      createdBy: 'user',
      createdAt: new Date().toISOString(),
      status: 'idle',
      assignedProjects: [],
      badge: { level: 1, xp: 0, specialties: [] },
      config: {
        maxConcurrentTasks: data.config?.maxConcurrentTasks || 1,
        taskTimeout: data.config?.taskTimeout || 30,
        narrationStyle: data.config?.narrationStyle || 'milestones',
        personalityTraits: data.config?.personalityTraits || [],
      },
    }
    identities.push(identity)
    saveIdentities(identities)
    eventBus.emit('agent:identity-created', { agentId: identity.id })
    return identity
  },

  update(id: string, data: Partial<AgentIdentity>): AgentIdentity | null {
    const identities = loadIdentities()
    const idx = identities.findIndex(a => a.id === id)
    if (idx === -1) return null
    if (!identities[idx].isCustom && data.isCustom !== undefined) return null
    identities[idx] = { ...identities[idx], ...data, id }
    saveIdentities(identities)
    eventBus.emit('agent:identity-updated', { agentId: id })
    return identities[idx]
  },

  delete(id: string): boolean {
    const identities = loadIdentities()
    const idx = identities.findIndex(a => a.id === id)
    if (idx === -1 || !identities[idx].isCustom) return false
    identities.splice(idx, 1)
    saveIdentities(identities)
    eventBus.emit('agent:identity-deleted', { agentId: id })
    return true
  },

  assignToProject(id: string, projectId: string): boolean {
    const identities = loadIdentities()
    const agent = identities.find(a => a.id === id)
    if (!agent) return false
    if (!agent.assignedProjects.includes(projectId)) {
      agent.assignedProjects.push(projectId)
      saveIdentities(identities)
    }
    return true
  },

  removeFromProject(id: string, projectId: string): boolean {
    const identities = loadIdentities()
    const agent = identities.find(a => a.id === id)
    if (!agent) return false
    agent.assignedProjects = agent.assignedProjects.filter(p => p !== projectId)
    saveIdentities(identities)
    return true
  },

  updateStatus(id: string, status: AgentStatus) {
    const identities = loadIdentities()
    const agent = identities.find(a => a.id === id)
    if (agent) {
      agent.status = status
      saveIdentities(identities)
    }
  },

  addXp(id: string, xp: number) {
    const identities = loadIdentities()
    const agent = identities.find(a => a.id === id)
    if (agent) {
      agent.badge.xp += xp
      const newLevel = Math.min(10, Math.floor(agent.badge.xp / 1000) + 1)
      if (newLevel > agent.badge.level) {
        agent.badge.level = newLevel
        eventBus.emit('agent:level-up', { agentId: id, level: newLevel })
      }
      saveIdentities(identities)
    }
  },

  getBuiltIn(): AgentIdentity[] {
    return BUILT_IN_IDENTITIES
  },

  isBuiltIn(id: string): boolean {
    return BUILT_IN_IDENTITIES.some(a => a.id === id)
  },
}
