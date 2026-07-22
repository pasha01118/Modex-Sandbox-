import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { agentIdentities } from './agentIdentities.js'
import { orchestrator } from './agentOrchestrator.js'
import { eventBus } from './eventBus.js'
import type { AgentIdentity } from './agentIdentities.js'

const STATE_DIR = join(homedir(), '.codex', 'agent-market')
const MARKET_FILE = join(STATE_DIR, 'market.json')

export interface AgentMarketEntry {
  agentId: string
  name: string
  description: string
  avatar: string
  color: string
  role: string
  capabilities: string[]
  qualifications: string[]
  skills: string[]
  personality: string
  config: AgentIdentity['config']
  isInstalled: boolean
  createdAt: string
  updatedAt: string
}

function ensureDir() {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true })
}

function loadMarket(): AgentMarketEntry[] {
  ensureDir()
  if (!existsSync(MARKET_FILE)) {
    writeFileSync(MARKET_FILE, '[]')
    return []
  }
  try { return JSON.parse(readFileSync(MARKET_FILE, 'utf-8')) } catch { return [] }
}

function saveMarket(entries: AgentMarketEntry[]) {
  ensureDir()
  writeFileSync(MARKET_FILE, JSON.stringify(entries, null, 2))
}

export const agentMarket = {
  list(): AgentMarketEntry[] {
    const identities = agentIdentities.list()
    const marketEntries = loadMarket()
    const allEntries: AgentMarketEntry[] = []

    for (const identity of identities) {
      const existing = marketEntries.find(e => e.agentId === identity.id)
      allEntries.push({
        agentId: identity.id,
        name: identity.name,
        description: `${identity.role} — ${identity.personality.slice(0, 80)}`,
        avatar: identity.avatar,
        color: identity.color,
        role: identity.role,
        capabilities: identity.capabilities,
        qualifications: identity.qualifications,
        skills: identity.skills,
        personality: identity.personality,
        config: identity.config,
        isInstalled: true,
        createdAt: identity.createdAt,
        updatedAt: identity.createdAt,
      })
    }

    for (const entry of marketEntries) {
      if (!allEntries.find(e => e.agentId === entry.agentId)) {
        allEntries.push(entry)
      }
    }

    return allEntries
  },

  get(agentId: string): AgentMarketEntry | null {
    const identity = agentIdentities.get(agentId)
    if (identity) {
      return {
        agentId: identity.id,
        name: identity.name,
        description: `${identity.role} — ${identity.personality.slice(0, 80)}`,
        avatar: identity.avatar,
        color: identity.color,
        role: identity.role,
        capabilities: identity.capabilities,
        qualifications: identity.qualifications,
        skills: identity.skills,
        personality: identity.personality,
        config: identity.config,
        isInstalled: true,
        createdAt: identity.createdAt,
        updatedAt: identity.createdAt,
      }
    }
    const entries = loadMarket()
    return entries.find(e => e.agentId === agentId) || null
  },

  create(data: Partial<AgentMarketEntry>): AgentMarketEntry {
    const identity = agentIdentities.create({
      name: data.name || 'New Agent',
      role: data.role || 'Custom',
      avatar: data.avatar || '🤖',
      color: data.color || '#8b5cf6',
      personality: data.personality || 'Helpful and capable.',
      capabilities: data.capabilities as any || ['execution', 'code'],
      qualifications: data.qualifications || [],
      skills: data.skills || [],
      config: data.config,
    })

    const entry: AgentMarketEntry = {
      agentId: identity.id,
      name: identity.name,
      description: data.description || `${identity.role} — ${identity.personality.slice(0, 80)}`,
      avatar: identity.avatar,
      color: identity.color,
      role: identity.role,
      capabilities: identity.capabilities,
      qualifications: identity.qualifications,
      skills: identity.skills,
      personality: identity.personality,
      config: identity.config,
      isInstalled: true,
      createdAt: identity.createdAt,
      updatedAt: identity.createdAt,
    }

    const entries = loadMarket()
    entries.push(entry)
    saveMarket(entries)

    eventBus.emit('agent:market-created', { agentId: identity.id })
    return entry
  },

  update(agentId: string, data: Partial<AgentMarketEntry>): AgentMarketEntry | null {
    const identity = agentIdentities.get(agentId)
    if (!identity) return null

    const updated = agentIdentities.update(agentId, {
      name: data.name,
      role: data.role,
      avatar: data.avatar,
      color: data.color,
      personality: data.personality,
      config: data.config,
    })

    if (!updated) return null

    const entries = loadMarket()
    const idx = entries.findIndex(e => e.agentId === agentId)
    if (idx >= 0) {
      entries[idx] = { ...entries[idx], ...data, agentId, updatedAt: new Date().toISOString() }
      saveMarket(entries)
    }

    eventBus.emit('agent:market-updated', { agentId })
    return this.get(agentId)
  },

  delete(agentId: string): boolean {
    const identity = agentIdentities.get(agentId)
    if (!identity || !identity.isCustom) return false

    agentIdentities.delete(agentId)

    const entries = loadMarket()
    const filtered = entries.filter(e => e.agentId !== agentId)
    saveMarket(filtered)

    eventBus.emit('agent:market-deleted', { agentId })
    return true
  },

  assignToProject(agentId: string, projectId: string): boolean {
    return agentIdentities.assignToProject(agentId, projectId)
  },

  removeFromProject(agentId: string, projectId: string): boolean {
    return agentIdentities.removeFromProject(agentId, projectId)
  },

  getInstalled(): AgentMarketEntry[] {
    return this.list().filter(e => e.isInstalled)
  },

  search(query: string): AgentMarketEntry[] {
    const q = query.toLowerCase()
    return this.list().filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      e.skills.some(s => s.toLowerCase().includes(q)) ||
      e.capabilities.some(c => c.toLowerCase().includes(q))
    )
  },
}
