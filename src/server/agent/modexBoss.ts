import { eventBus } from './eventBus.js'
import { modexMemory } from './modexMemory.js'
import type { RoadmapTask, Phase, ProjectMemory, PhaseGate, Guardrail, VerificationCriterion, HealthLevel, TaskStatus } from './modexMemory.js'

// ── Working-Style Framework ───────────────────────────────────────
// The 6-step disciplined development process MODEX enforces:
//   1. PLAN   — Define what needs to be done (create roadmap)
//   2. CHECK  — Verify prerequisites are met (phase gate)
//   3. DO     — Execute the task
//   4. VERIFY — Run verification criteria
//   5. LEARN  — Record outcomes for future reference
//   6. NEXT   — Move to next task or phase

export type WorkflowStep = 'plan' | 'check' | 'do' | 'verify' | 'learn' | 'next'
export type ProjectPhase = 'discovery' | 'architecture' | 'implementation' | 'testing' | 'integration' | 'deployment' | 'review'

export interface WorkflowState {
  currentStep: WorkflowStep
  currentPhase: ProjectPhase
  tasksInPhase: number
  tasksCompleted: number
  lastAction: string
  timestamp: string
}

export interface RoadmapTemplate {
  name: string
  description: string
  phases: {
    name: string
    description: string
    gate: { required: string[]; enforced: boolean }
    taskTemplates: {
      title: string
      description: string
      guardrails: string[]
      verificationCriteria: string[]
    }[]
  }[]
}

// ── Default Roadmap Template ─────────────────────────────────────

const DEFAULT_ROADMAP: RoadmapTemplate = {
  name: 'Standard Development',
  description: 'Professional 6-phase development roadmap',
  phases: [
    {
      name: 'Discovery & Planning',
      description: 'Understand requirements, analyze constraints, create detailed plan',
      gate: { required: ['plan-complete', 'scope-defined', 'risks-identified'], enforced: true },
      taskTemplates: [
        { title: 'Analyze requirements', description: 'Break down user requirements into actionable items', guardrails: ['Document all assumptions', 'Identify dependencies'], verificationCriteria: ['Requirements document exists', 'All requirements have acceptance criteria'] },
        { title: 'Identify risks', description: 'Document technical and project risks', guardrails: ['Consider all categories'], verificationCriteria: ['Risk matrix created', 'Mitigation strategies defined'] },
        { title: 'Create project plan', description: 'Define phases, milestones, and deliverables', guardrails: ['Measurable milestones', 'Realistic timeline'], verificationCriteria: ['Plan document exists', 'Milestones are time-bound'] },
      ],
    },
    {
      name: 'Architecture & Design',
      description: 'Design system architecture, data models, and interfaces',
      gate: { required: ['architecture-approved', 'data-model-defined', 'interfaces-specified'], enforced: true },
      taskTemplates: [
        { title: 'Design architecture', description: 'Create system architecture diagrams and component boundaries', guardrails: ['Follow SOLID principles', 'Document decisions'], verificationCriteria: ['Architecture doc exists', 'Component boundaries defined'] },
        { title: 'Define data models', description: 'Design schemas, types, and data flow', guardrails: ['Type-safe design', 'Extensible schemas'], verificationCriteria: ['All models documented', 'Type definitions created'] },
        { title: 'Define interfaces', description: 'Specify API contracts and module boundaries', guardrails: ['RESTful conventions', 'Error handling specified'], verificationCriteria: ['API spec written', 'Module interfaces defined'] },
      ],
    },
    {
      name: 'Implementation',
      description: 'Build core features following the architecture',
      gate: { required: ['core-features-built', 'tests-written', 'typecheck-passes'], enforced: true },
      taskTemplates: [
        { title: 'Build core modules', description: 'Implement the foundational modules and utilities', guardrails: ['TypeScript strict mode', 'No any types', 'Follow existing code style'], verificationCriteria: ['TypeScript compiles', 'No lint errors', 'Existing tests still pass'] },
        { title: 'Write tests', description: 'Create unit and integration tests for new code', guardrails: ['80% coverage minimum', 'Test edge cases'], verificationCriteria: ['All new functions tested', 'Edge cases covered'] },
        { title: 'Integration', description: 'Wire components together and verify end-to-end flow', guardrails: ['No broken imports', 'Consistent naming'], verificationCriteria: ['App builds cleanly', 'No runtime errors'] },
      ],
    },
    {
      name: 'Testing & QA',
      description: 'Comprehensive testing, performance validation, edge cases',
      gate: { required: ['all-tests-pass', 'no-critical-bugs', 'performance-baseline'], enforced: true },
      taskTemplates: [
        { title: 'Run full test suite', description: 'Execute all tests and verify results', guardrails: ['Zero tolerance for regressions'], verificationCriteria: ['100% test pass rate', 'No new failures'] },
        { title: 'Performance audit', description: 'Measure and optimize performance metrics', guardrails: ['Bundle size budget', 'Response time targets'], verificationCriteria: ['Build under budget', 'API under 200ms'] },
        { title: 'Edge case validation', description: 'Test error paths, boundary conditions, and failure modes', guardrails: ['Document all tested scenarios'], verificationCriteria: ['Error handling verified', 'Graceful degradation confirmed'] },
      ],
    },
    {
      name: 'Deployment & Release',
      description: 'Prepare for release, documentation, final checks',
      gate: { required: ['docs-complete', 'changelog-updated', 'build-verified'], enforced: true },
      taskTemplates: [
        { title: 'Update documentation', description: 'Ensure all documentation reflects current state', guardrails: ['Include examples', 'Update API docs'], verificationCriteria: ['README accurate', 'API docs complete'] },
        { title: 'Prepare release', description: 'Version bump, changelog, release notes', guardrails: ['Semantic versioning', 'Breaking changes noted'], verificationCriteria: ['Version updated', 'Changelog has entries'] },
        { title: 'Verify deployment', description: 'Final build verification and deployment check', guardrails: ['Clean build required', 'No uncommitted changes'], verificationCriteria: ['Build passes', 'Deploy test successful'] },
      ],
    },
    {
      name: 'Review & Retrospective',
      description: 'Post-implementation review, learnings, cleanup',
      gate: { required: ['review-complete', 'learnings-recorded', 'cleanup-done'], enforced: false },
      taskTemplates: [
        { title: 'Code review', description: 'Review all changes for quality and completeness', guardrails: ['Follow team conventions', 'Check security'], verificationCriteria: ['All files reviewed', 'No critical issues'] },
        { title: 'Record learnings', description: 'Document what worked, what did not, and improvements', guardrails: ['Be specific and actionable'], verificationCriteria: ['Learnings saved to memory', 'Anti-patterns documented'] },
        { title: 'Project cleanup', description: 'Remove temporary files, close stale branches, update .gitignore', guardrails: ['Preserve important artifacts'], verificationCriteria: ['No stale files', 'Git status clean'] },
      ],
    },
  ],
}

// ── MODEX Boss Agent ──────────────────────────────────────────────

export const modexBoss = {
  // ── Project lifecycle ──
  createProject(projectId: string, title: string, description: string, template?: RoadmapTemplate): ProjectMemory {
    const mem = modexMemory.createProject(projectId, title, description)
    const tpl = template || DEFAULT_ROADMAP

    let order = 0
    for (const phase of tpl.phases) {
      const phaseId = `phase-${++order}`
      const tasks: RoadmapTask[] = phase.taskTemplates.map((tt, i) => ({
        id: `task-${phaseId}-${i + 1}`,
        title: tt.title,
        description: tt.description,
        status: 'pending' as TaskStatus,
        priority: 'high' as const,
        phaseId,
        dependsOn: i > 0 ? [`task-${phaseId}-${i}`] : [],
        guardrails: tt.guardrails.map((g, j) => ({ id: `g-${phaseId}-${i}-${j}`, rule: g, enforced: true })),
        verificationCriteria: tt.verificationCriteria.map((v, j) => ({ id: `v-${phaseId}-${i}-${j}`, description: v, passed: false })),
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }))

      modexMemory.addPhase(projectId, {
        id: phaseId,
        name: phase.name,
        description: phase.description,
        status: order === 1 ? 'active' : 'locked',
        order,
        gate: { required: phase.gate.required, enforced: phase.gate.enforced, passed: false },
        tasks,
      })
    }

    // Auto-start first phase
    mem.currentPhaseId = `phase-1`
    mem.updatedAt = new Date().toISOString()
    modexMemory.saveProject(projectId, mem)

    eventBus.emit('modex:project-created', { projectId, title, phases: tpl.phases.length })
    return mem
  },

  // ── Working-style workflow engine ──
  getWorkflowState(projectId: string): WorkflowState | null {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return null

    const phase = mem.phases.find(p => p.id === mem.currentPhaseId)
    if (!phase) return { currentStep: 'plan', currentPhase: 'discovery', tasksInPhase: 0, tasksCompleted: 0, lastAction: 'Project created', timestamp: mem.updatedAt }

    const tasksInPhase = phase.tasks.length
    const tasksCompleted = phase.tasks.filter(t => t.status === 'completed').length
    const currentTask = phase.tasks.find(t => t.status === 'in-progress')

    let step: WorkflowStep = 'plan'
    if (currentTask) {
      step = 'do'
    } else if (tasksCompleted === 0) {
      step = 'plan'
    } else if (tasksCompleted < tasksInPhase) {
      step = 'next'
    } else {
      step = 'verify'
    }

    const phaseNames: Record<string, ProjectPhase> = {
      'phase-1': 'discovery',
      'phase-2': 'architecture',
      'phase-3': 'implementation',
      'phase-4': 'testing',
      'phase-5': 'deployment',
      'phase-6': 'review',
    }

    return {
      currentStep: step,
      currentPhase: phaseNames[phase.id] || 'implementation',
      tasksInPhase,
      tasksCompleted,
      lastAction: currentTask ? `Working on: ${currentTask.title}` : `Phase: ${phase.name}`,
      timestamp: mem.updatedAt,
    }
  },

  // ── Phase gate enforcement ──
  checkPhaseGate(projectId: string, phaseId: string): { passed: boolean; blockers: string[] } {
    const phase = modexMemory.getPhase(projectId, phaseId)
    if (!phase) return { passed: false, blockers: ['Phase not found'] }

    const blockers: string[] = []

    for (const req of phase.gate.required) {
      switch (req) {
        case 'all-tasks-complete': {
          const incomplete = phase.tasks.filter(t => t.status !== 'completed' && t.status !== 'skipped')
          if (incomplete.length > 0) blockers.push(`${incomplete.length} tasks incomplete: ${incomplete.map(t => t.title).join(', ')}`)
          break
        }
        case 'tests-pass': {
          const failedTasks = phase.tasks.filter(t => t.status === 'failed')
          if (failedTasks.length > 0) blockers.push(`${failedTasks.length} tasks failed`)
          break
        }
        case 'build-clean':
        case 'typecheck-passes': {
          // These are checked externally by the orchestrator
          break
        }
        default: {
          // Check verification criteria
          const allFailed = phase.tasks.flatMap(t => t.verificationCriteria).filter(v => !v.passed && v.description.includes(req))
          if (allFailed.length > 0) blockers.push(`Verification not passed: ${allFailed.map(v => v.description).join(', ')}`)
        }
      }
    }

    return { passed: blockers.length === 0, blockers }
  },

  // ── Task execution coordination ──
  startTask(projectId: string, taskId: string): boolean {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return false

    // Verify the task is allowed to start
    const task = modexMemory.getTask(projectId, taskId)
    if (!task) return false

    if (task.status !== 'pending') return false

    // Check dependencies
    const phase = mem.phases.find(p => p.id === task.phaseId)
    if (!phase) return false

    const depsMet = task.dependsOn.every(depId => {
      const dep = phase.tasks.find(t => t.id === depId)
      return dep && dep.status === 'completed'
    })

    if (!depsMet) return false

    // Check that this task belongs to the current active phase
    if (phase.status !== 'active') return false

    // Record the decision
    modexMemory.recordDecision(projectId, {
      agentId: 'modex-hod',
      decision: `Start task: ${task.title}`,
      rationale: `Dependencies met, phase ${phase.name} is active`,
      phaseId: phase.id,
      taskId: task.id,
      reversible: true,
    })

    modexMemory.updateTask(projectId, taskId, { status: 'in-progress' })
    eventBus.emit('modex:task-started', { projectId, taskId })
    return true
  },

  completeTask(projectId: string, taskId: string, result: string): boolean {
    const task = modexMemory.getTask(projectId, taskId)
    if (!task) return false

    // Mark all verification criteria as passed
    const updatedCriteria = task.verificationCriteria.map(v => ({ ...v, passed: true, lastChecked: new Date().toISOString() }))

    modexMemory.updateTask(projectId, taskId, {
      status: 'completed',
      result,
      verificationCriteria: updatedCriteria,
    })

    // Record learning
    modexMemory.recordLearning(projectId, {
      agentId: 'modex-hod',
      category: 'success',
      content: `Task completed: ${task.title} — ${result}`,
      phaseId: task.phaseId,
      taskId: task.id,
      confidence: 1.0,
    })

    // Recalculate health
    modexMemory.recalculateHealth(projectId)

    eventBus.emit('modex:task-completed', { projectId, taskId })
    return true
  },

  failTask(projectId: string, taskId: string, error: string): boolean {
    const task = modexMemory.getTask(projectId, taskId)
    if (!task) return false

    modexMemory.updateTask(projectId, taskId, {
      status: 'failed',
      error,
    })

    // Record failure as learning
    modexMemory.recordLearning(projectId, {
      agentId: 'modex-hod',
      category: 'failure',
      content: `Task failed: ${task.title} — Error: ${error}`,
      phaseId: task.phaseId,
      taskId: task.id,
      confidence: 1.0,
    })

    // Record decision
    modexMemory.recordDecision(projectId, {
      agentId: 'modex-hod',
      decision: `Task marked failed: ${task.title}`,
      rationale: error,
      phaseId: task.phaseId || '',
      taskId: task.id,
      reversible: false,
    })

    modexMemory.recalculateHealth(projectId)
    eventBus.emit('modex:task-failed', { projectId, taskId, error })
    return true
  },

  // ── Scope guard — checks if a proposed task is within roadmap ──
  isTaskInScope(projectId: string, taskTitle: string): { inScope: boolean; matchingTask?: RoadmapTask; suggestion?: string } {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return { inScope: false, suggestion: 'Project not found in MODEX memory' }

    const currentPhase = mem.phases.find(p => p.id === mem.currentPhaseId)
    if (!currentPhase) return { inScope: false, suggestion: 'No active phase' }

    // Exact match
    const exact = currentPhase.tasks.find(t => t.title.toLowerCase() === taskTitle.toLowerCase())
    if (exact) return { inScope: true, matchingTask: exact }

    // Fuzzy match
    const fuzzy = currentPhase.tasks.find(t => {
      const words = t.title.toLowerCase().split(' ')
      const searchWords = taskTitle.toLowerCase().split(' ')
      return searchWords.some(sw => words.some(w => w.includes(sw) || sw.includes(w)))
    })

    if (fuzzy) return { inScope: true, matchingTask: fuzzy }

    // Check all phases for similar tasks
    for (const phase of mem.phases) {
      const similar = phase.tasks.find(t => {
        const words = t.title.toLowerCase().split(' ')
        const searchWords = taskTitle.toLowerCase().split(' ')
        return searchWords.some(sw => words.some(w => w.includes(sw) || sw.includes(w)))
      })
      if (similar) return { inScope: false, suggestion: `Task matches phase "${phase.name}" but that phase is not yet active` }
    }

    return { inScope: false, suggestion: 'Task does not match any roadmap item — potential scope creep' }
  },

  // ── Health monitoring ──
  getProjectHealth(projectId: string): { level: HealthLevel; score: number; issues: string[] } {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return { level: 'critical', score: 0, issues: ['Project not found'] }

    const issues: string[] = []
    const allTasks = mem.phases.flatMap(p => p.tasks)

    // Check for failed tasks
    const failed = allTasks.filter(t => t.status === 'failed')
    if (failed.length > 0) issues.push(`${failed.length} tasks failed: ${failed.map(t => t.title).join(', ')}`)

    // Check for blocked tasks
    const blocked = allTasks.filter(t => t.status === 'blocked')
    if (blocked.length > 0) issues.push(`${blocked.length} tasks blocked`)

    // Check for stalled progress
    const inProgress = allTasks.filter(t => t.status === 'in-progress')
    if (inProgress.length === 0 && allTasks.some(t => t.status === 'completed') && allTasks.some(t => t.status === 'pending')) {
      issues.push('No tasks in progress — possible stall')
    }

    // Check blocked reasons
    if (mem.blockedReasons.length > 0) issues.push(...mem.blockedReasons)

    return { level: mem.healthLevel, score: mem.healthScore, issues }
  },

  // ── Agent guidance ──
  guideAgent(projectId: string, agentType: string): string {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return 'No project context available. Create a project first.'

    const phase = mem.phases.find(p => p.id === mem.currentPhaseId)
    if (!phase) return 'No active phase. All phases may be completed.'

    const nextTask = modexMemory.getNextTask(projectId)
    const currentTask = modexMemory.getCurrentTask(projectId)

    const guidance: string[] = []

    guidance.push(`## MODEX HOD — Agent Briefing`)
    guidance.push(`**Project**: ${mem.title}`)
    guidance.push(`**Current Phase**: ${phase.name}`)
    guidance.push(`**Health**: ${mem.healthLevel} (${Math.round(mem.healthScore * 100)}%)`)
    guidance.push('')

    if (currentTask) {
      guidance.push(`### Current Task: ${currentTask.title}`)
      guidance.push(`Description: ${currentTask.description}`)
      guidance.push(`Guardrails:`)
      for (const g of currentTask.guardrails) guidance.push(`  - ${g.rule}`)
      guidance.push(`Verification:`)
      for (const v of currentTask.verificationCriteria) guidance.push(`  - [ ] ${v.description}`)
    } else if (nextTask) {
      guidance.push(`### Next Task Ready: ${nextTask.title}`)
      guidance.push(`Description: ${nextTask.description}`)
      guidance.push(`Dependencies: ${nextTask.dependsOn.length === 0 ? 'None' : nextTask.dependsOn.join(', ')}`)
    } else {
      guidance.push('### All tasks in this phase are complete.')
      guidance.push(`Phase gate check: ${this.checkPhaseGate(projectId, phase.id).passed ? 'PASSED' : 'BLOCKED'}`)
    }

    // Add relevant learnings
    const recentLearnings = mem.learnings.slice(-5)
    if (recentLearnings.length > 0) {
      guidance.push('')
      guidance.push('### Recent Learnings')
      for (const l of recentLearnings) guidance.push(`  - [${l.category}] ${l.content}`)
    }

    return guidance.join('\n')
  },

  // ── Context preservation (never forgets) ──
  addContextNote(projectId: string, note: string): void {
    modexMemory.addContextNote(projectId, `[${new Date().toISOString()}] ${note}`)
  },

  // ── Statistics ──
  getProjectStats(projectId: string) {
    const mem = modexMemory.getProject(projectId)
    if (!mem) return null

    const allTasks = mem.phases.flatMap(p => p.tasks)
    return {
      totalPhases: mem.phases.length,
      completedPhases: mem.phases.filter(p => p.status === 'completed').length,
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      failedTasks: allTasks.filter(t => t.status === 'failed').length,
      inProgressTasks: allTasks.filter(t => t.status === 'in-progress').length,
      pendingTasks: allTasks.filter(t => t.status === 'pending').length,
      healthScore: mem.healthScore,
      healthLevel: mem.healthLevel,
      decisionsCount: mem.decisions.length,
      learningsCount: mem.learnings.length,
      currentPhaseId: mem.currentPhaseId,
    }
  },

  // ── Template access ──
  getDefaultTemplate(): RoadmapTemplate {
    return DEFAULT_ROADMAP
  },
}
