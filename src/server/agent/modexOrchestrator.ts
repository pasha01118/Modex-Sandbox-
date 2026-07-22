import { eventBus } from './eventBus.js'
import { modexBoss } from './modexBoss.js'
import { modexMemory } from './modexMemory.js'

// ── MODEX Orchestrator ────────────────────────────────────────────
// Intercepts agent task execution and enforces roadmap compliance.
// Every agent must go through MODEX HOD before executing work.

export interface AgentRequest {
  agentId: string
  agentType: string
  taskTitle: string
  taskDescription: string
  projectId?: string
}

export interface OrchestratorResponse {
  allowed: boolean
  taskId?: string
  guidance?: string
  reason?: string
  healthWarning?: boolean
}

// Active project tracking (defaults to first active project)
let activeProjectId: string | null = null

export const modexOrchestrator = {
  // ── Set/get active project ──
  setActiveProject(projectId: string): void {
    activeProjectId = projectId
    eventBus.emit('modex:active-project-changed', { projectId })
  },

  getActiveProject(): string | null {
    return activeProjectId
  },

  // ── Pre-execution gate (MODEX must approve before any agent acts) ──
  preExecutionCheck(request: AgentRequest): OrchestratorResponse {
    const projectId = request.projectId || activeProjectId
    if (!projectId) {
      return { allowed: true, guidance: 'No active MODEX project — running in free mode' }
    }

    const mem = modexMemory.getProject(projectId)
    if (!mem) {
      return { allowed: true, guidance: 'Project not registered with MODEX — running in free mode' }
    }

    // Scope check — is this task in the roadmap?
    const scope = modexBoss.isTaskInScope(projectId, request.taskTitle)
    if (!scope.inScope) {
      return {
        allowed: false,
        reason: scope.suggestion || 'Task not in roadmap',
        guidance: modexBoss.guideAgent(projectId, request.agentType),
      }
    }

    // Health check — is the project in a healthy state?
    const health = modexBoss.getProjectHealth(projectId)
    if (health.level === 'critical') {
      return {
        allowed: false,
        reason: `Project health CRITICAL: ${health.issues.join('; ')}`,
        guidance: 'Resolve critical issues before proceeding',
        healthWarning: true,
      }
    }

    // Start the task
    if (scope.matchingTask) {
      modexBoss.startTask(projectId, scope.matchingTask.id)
      return {
        allowed: true,
        taskId: scope.matchingTask.id,
        guidance: modexBoss.guideAgent(projectId, request.agentType),
        healthWarning: health.level === 'warning',
      }
    }

    return { allowed: true, guidance: 'Task approved by MODEX HOD' }
  },

  // ── Post-execution gate (verify results) ──
  postExecutionCheck(projectId: string, taskId: string, result: string, success: boolean): void {
    if (success) {
      modexBoss.completeTask(projectId, taskId, result)
    } else {
      modexBoss.failTask(projectId, taskId, result)
    }

    // Check if phase is now complete
    const task = modexMemory.getTask(projectId, taskId)
    if (task) {
      const phase = modexMemory.getPhase(projectId, task.phaseId)
      if (phase) {
        const allDone = phase.tasks.every(t => t.status === 'completed' || t.status === 'skipped')
        if (allDone) {
          const gateCheck = modexBoss.checkPhaseGate(projectId, phase.id)
          if (gateCheck.passed) {
            modexMemory.completePhase(projectId, phase.id)
            eventBus.emit('modex:phase-auto-completed', { projectId, phaseId: phase.id })
          }
        }
      }
    }
  },

  // ── Directive from MODEX HOD to an agent ──
  getDirective(projectId: string, agentType: string): string {
    return modexBoss.guideAgent(projectId, agentType)
  },

  // ── Get dashboard summary ──
  getDashboard(projectId: string) {
    const stats = modexBoss.getProjectStats(projectId)
    const health = modexBoss.getProjectHealth(projectId)
    const workflow = modexBoss.getWorkflowState(projectId)
    const mem = modexMemory.getProject(projectId)

    return {
      stats,
      health,
      workflow,
      currentPhase: mem?.phases.find(p => p.id === mem.currentPhaseId),
      recentDecisions: mem?.decisions.slice(-10) || [],
      recentLearnings: mem?.learnings.slice(-10) || [],
    }
  },
}
