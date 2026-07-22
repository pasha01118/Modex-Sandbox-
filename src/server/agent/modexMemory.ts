import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { eventBus } from './eventBus.js'

const STATE_DIR = join(homedir(), '.codex', 'modex-state')

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function projectDir(projectId: string): string {
  const safe = projectId.replace(/[^a-zA-Z0-9_-]/g, '_')
  return join(STATE_DIR, 'projects', safe)
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) return fallback
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

function writeJson(filePath: string, data: unknown): void {
  ensureDir(join(filePath, '..'))
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// ── Types ────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped' | 'blocked'
export type PhaseStatus = 'locked' | 'active' | 'completed' | 'failed'
export type HealthLevel = 'healthy' | 'warning' | 'critical' | 'stalled'

export interface VerificationCriterion {
  id: string
  description: string
  command?: string
  passed: boolean
  lastChecked?: string
}

export interface Guardrail {
  id: string
  rule: string
  enforced: boolean
}

export interface RoadmapTask {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: 'critical' | 'high' | 'medium' | 'low'
  phaseId: string
  dependsOn: string[]
  guardrails: Guardrail[]
  verificationCriteria: VerificationCriterion[]
  assignedAgent?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  result?: string
  error?: string
  retryCount: number
}

export interface PhaseGate {
  required: string[]
  enforced: boolean
  passed: boolean
}

export interface Phase {
  id: string
  name: string
  description: string
  status: PhaseStatus
  order: number
  gate: PhaseGate
  tasks: RoadmapTask[]
  createdAt: string
  startedAt?: string
  completedAt?: string
}

export interface Decision {
  id: string
  timestamp: string
  agentId: string
  decision: string
  rationale: string
  phaseId: string
  taskId?: string
  consequence?: string
  reversible: boolean
}

export interface Learning {
  id: string
  timestamp: string
  agentId: string
  category: 'success' | 'failure' | 'pattern' | 'anti-pattern' | 'insight'
  content: string
  projectId?: string
  phaseId?: string
  taskId?: string
  confidence: number
}

export interface ProjectMemory {
  projectId: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  currentPhaseId: string | null
  healthScore: number
  healthLevel: HealthLevel
  phases: Phase[]
  decisions: Decision[]
  learnings: Learning[]
  contextNotes: string[]
  blockedReasons: string[]
}

export interface GlobalMemory {
  learnings: Learning[]
  patterns: string[]
  antiPatterns: string[]
  lastUpdated: string
}

// ── Memory Store ──────────────────────────────────────────────────

export const modexMemory = {
  // Project CRUD
  createProject(projectId: string, title: string, description: string): ProjectMemory {
    const dir = projectDir(projectId)
    ensureDir(dir)

    const memory: ProjectMemory = {
      projectId,
      title,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentPhaseId: null,
      healthScore: 1.0,
      healthLevel: 'healthy',
      phases: [],
      decisions: [],
      learnings: [],
      contextNotes: [],
      blockedReasons: [],
    }

    writeJson(join(dir, 'roadmap.json'), memory)
    eventBus.emit('modex:project-created', { projectId, title })
    return memory
  },

  getProject(projectId: string): ProjectMemory | null {
    const fp = join(projectDir(projectId), 'roadmap.json')
    if (!existsSync(fp)) return null
    return readJson(fp, null as any)
  },

  saveProject(projectId: string, memory: ProjectMemory): void {
    memory.updatedAt = new Date().toISOString()
    writeJson(join(projectDir(projectId), 'roadmap.json'), memory)
    eventBus.emit('modex:project-updated', { projectId })
  },

  listProjects(): string[] {
    const projectsDir = join(STATE_DIR, 'projects')
    if (!existsSync(projectsDir)) return []
    return readdirSync(projectsDir).filter(f => existsSync(join(projectsDir, f, 'roadmap.json')))
  },

  deleteProject(projectId: string): void {
    const dir = projectDir(projectId)
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
    eventBus.emit('modex:project-deleted', { projectId })
  },

  // Phase management
  addPhase(projectId: string, phase: Omit<Phase, 'createdAt'>): PhaseMemory | null {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return null

    const fullPhase: Phase = { ...phase, createdAt: new Date().toISOString() }
    mem.phases.push(fullPhase)
    mem.phases.sort((a, b) => a.order - b.order)

    modexMemory.saveProject(projectId, mem)
    return modexMemory.getPhase(projectId, phase.id)
  },

  getPhase(projectId: string, phaseId: string): Phase | undefined {
    const mem = modexMemory.getProject(projectId)
    return mem?.phases.find(p => p.id === phaseId)
  },

  startPhase(projectId: string, phaseId: string): boolean {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return false

    const phase = mem.phases.find(p => p.id === phaseId)
    if (!phase || phase.status !== 'locked') return false

    // Check if previous phase is completed (or this is the first)
    const prevPhase = mem.phases.find(p => p.order === phase.order - 1)
    if (prevPhase && prevPhase.status !== 'completed') return false

    phase.status = 'active'
    phase.startedAt = new Date().toISOString()
    mem.currentPhaseId = phaseId
    mem.updatedAt = new Date().toISOString()

    modexMemory.saveProject(projectId, mem)
    eventBus.emit('modex:phase-started', { projectId, phaseId })
    return true
  },

  completePhase(projectId: string, phaseId: string): boolean {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return false

    const phase = mem.phases.find(p => p.id === phaseId)
    if (!phase || phase.status !== 'active') return false

    // Verify gate
    if (phase.gate.enforced) {
      const allRequired = phase.gate.required.every(req => {
        if (req === 'all-tasks-complete') {
          return phase.tasks.every(t => t.status === 'completed' || t.status === 'skipped')
        }
        return true
      })
      if (!allRequired) return false
    }

    phase.status = 'completed'
    phase.completedAt = new Date().toISOString()
    phase.gate.passed = true

    // Auto-activate next phase
    const nextPhase = mem.phases.find(p => p.order === phase.order + 1)
    if (nextPhase && nextPhase.status === 'locked') {
      nextPhase.status = 'active'
      nextPhase.startedAt = new Date().toISOString()
      mem.currentPhaseId = nextPhase.id
    } else {
      mem.currentPhaseId = null
    }

    modexMemory.saveProject(projectId, mem)
    eventBus.emit('modex:phase-completed', { projectId, phaseId })
    return true
  },

  // Task management
  addTask(projectId: string, phaseId: string, task: Omit<RoadmapTask, 'createdAt' | 'retryCount'>): RoadmapTask | null {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return null

    const phase = mem.phases.find(p => p.id === phaseId)
    if (!phase) return null

    const fullTask: RoadmapTask = { ...task, createdAt: new Date().toISOString(), retryCount: 0 }
    phase.tasks.push(fullTask)
    modexMemory.saveProject(projectId, mem)
    eventBus.emit('modex:task-added', { projectId, phaseId, taskId: task.id })
    return fullTask
  },

  updateTask(projectId: string, taskId: string, updates: Partial<RoadmapTask>): boolean {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return false

    for (const phase of mem.phases) {
      const task = phase.tasks.find(t => t.id === taskId)
      if (task) {
        Object.assign(task, updates)
        if (updates.status === 'completed') task.completedAt = new Date().toISOString()
        if (updates.status === 'in-progress' && !task.startedAt) task.startedAt = new Date().toISOString()
        modexMemory.saveProject(projectId, mem)
        eventBus.emit('modex:task-updated', { projectId, taskId, status: task.status })
        return true
      }
    }
    return false
  },

  getTask(projectId: string, taskId: string): RoadmapTask | undefined {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return undefined

    for (const phase of mem.phases) {
      const task = phase.tasks.find(t => t.id === taskId)
      if (task) return task
    }
    return undefined
  },

  getCurrentTask(projectId: string): RoadmapTask | null {
    const mem = modexMemory.getProject(projectId)
    if (!mem || !mem.currentPhaseId) return null

    const phase = mem.phases.find(p => p.id === mem.currentPhaseId)
    if (!phase) return null

    return phase.tasks.find(t => t.status === 'in-progress') || null
  },

  getNextTask(projectId: string): RoadmapTask | null {
    const mem = modexMemory.getProject(projectId)
    if (!mem || !mem.currentPhaseId) return null

    const phase = mem.phases.find(p => p.id === mem.currentPhaseId)
    if (!phase) return null

    // Get next pending task whose dependencies are met
    for (const task of phase.tasks) {
      if (task.status !== 'pending') continue
      const depsMet = task.dependsOn.every(depId => {
        const dep = phase.tasks.find(t => t.id === depId)
        return dep && dep.status === 'completed'
      })
      if (depsMet) return task
    }
    return null
  },

  // Decision tracking
  recordDecision(projectId: string, decision: Omit<Decision, 'id' | 'timestamp'>): Decision {
    const mem = modexMemory.getProject(projectId)
    if (!mem) throw new Error(`Project ${projectId} not found`)

    const full: Decision = { ...decision, id: crypto.randomUUID(), timestamp: new Date().toISOString() }
    mem.decisions.push(full)
    modexMemory.saveProject(projectId, mem)
    eventBus.emit('modex:decision-recorded', { projectId, decision: full })
    return full
  },

  // Learning system
  recordLearning(projectId: string, learning: Omit<Learning, 'id' | 'timestamp'>): Learning {
    const mem = modexMemory.getProject(projectId)
    if (!mem) throw new Error(`Project ${projectId} not found`)

    const full: Learning = { ...learning, id: crypto.randomUUID(), timestamp: new Date().toISOString() }
    mem.learnings.push(full)
    modexMemory.saveProject(projectId, mem)
    eventBus.emit('modex:learning-recorded', { projectId, category: learning.category })
    return full
  },

  // Global memory (cross-project)
  getGlobalMemory(): GlobalMemory {
    const fp = join(STATE_DIR, 'global.json')
    return readJson(fp, { learnings: [], patterns: [], antiPatterns: [], lastUpdated: '' })
  },

  saveGlobalMemory(mem: GlobalMemory): void {
    mem.lastUpdated = new Date().toISOString()
    writeJson(join(STATE_DIR, 'global.json'), mem)
  },

  addGlobalLearning(learning: Omit<Learning, 'id' | 'timestamp'>): void {
    const mem = modexMemory.getGlobalMemory()
    mem.learnings.push({ ...learning, id: crypto.randomUUID(), timestamp: new Date().toISOString() })
    if (mem.learnings.length > 500) mem.learnings = mem.learnings.slice(-500)
    modexMemory.saveGlobalMemory(mem)
  },

  // Context notes
  addContextNote(projectId: string, note: string): void {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return
    mem.contextNotes.push(note)
    modexMemory.saveProject(projectId, mem)
  },

  // Health calculation
  recalculateHealth(projectId: string): HealthLevel {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return 'critical'

    const allTasks = mem.phases.flatMap(p => p.tasks)
    const total = allTasks.length
    if (total === 0) { mem.healthLevel = 'healthy'; modexMemory.saveProject(projectId, mem); return 'healthy' }

    const completed = allTasks.filter(t => t.status === 'completed').length
    const failed = allTasks.filter(t => t.status === 'failed').length
    const blocked = allTasks.filter(t => t.status === 'blocked').length

    const score = completed / total
    mem.healthScore = score

    if (failed > 0 && failed >= total * 0.3) mem.healthLevel = 'critical'
    else if (blocked > 0 && blocked >= total * 0.2) mem.healthLevel = 'warning'
    else if (score < 0.3 && allTasks.some(t => t.status === 'in-progress')) mem.healthLevel = 'stalled'
    else if (score >= 0.8) mem.healthLevel = 'healthy'
    else mem.healthLevel = 'warning'

    modexMemory.saveProject(projectId, mem)
    return mem.healthLevel
  },
}

// Re-export for convenience
type PhaseMemory = Phase | undefined
