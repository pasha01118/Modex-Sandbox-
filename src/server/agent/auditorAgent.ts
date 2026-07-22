import { agentIdentities } from './agentIdentities.js'
import { agentMessageBroker } from './agentMessageBroker.js'
import { agentLearning } from './agentLearning.js'
import type { AgentIdentity } from './agentIdentities.js'

export interface AuditCheckpoint {
  id: string
  name: string
  description: string
  category: 'task' | 'phase' | 'project'
  checks: AuditCheck[]
  status: 'pending' | 'in-progress' | 'passed' | 'failed' | 'needs-review'
  createdAt: string
  completedAt?: string
  agentId?: string
  taskId?: string
  phaseId?: string
  projectId?: string
}

export interface AuditCheck {
  id: string
  label: string
  passed: boolean
  critical: boolean
  notes?: string
}

export interface AuditResult {
  checkpointId: string
  passed: boolean
  totalChecks: number
  passedChecks: number
  failedChecks: number
  criticalFailures: string[]
  recommendations: string[]
}

let auditCheckpoints: AuditCheckpoint[] = []

const TASK_CHECKLIST: { label: string; critical: boolean }[] = [
  { label: 'TypeScript compiles with no errors', critical: true },
  { label: 'No `any` types introduced', critical: false },
  { label: 'Existing tests still pass', critical: true },
  { label: 'New code follows existing style conventions', critical: false },
  { label: 'Error handling implemented for failure paths', critical: true },
  { label: 'No hardcoded secrets or credentials', critical: true },
  { label: 'Imports are correct and no circular dependencies', critical: false },
  { label: 'Output is human-readable', critical: false },
]

const PHASE_CHECKLIST: { label: string; critical: boolean }[] = [
  { label: 'All tasks in phase completed', critical: true },
  { label: 'Phase gate criteria satisfied', critical: true },
  { label: 'No regressions from previous phases', critical: true },
  { label: 'Documentation updated if needed', critical: false },
  { label: 'Performance benchmarks acceptable', critical: false },
  { label: 'Security review completed', critical: false },
]

const PROJECT_CHECKLIST: { label: string; critical: boolean }[] = [
  { label: 'All phases completed successfully', critical: true },
  { label: 'Full test suite passes', critical: true },
  { label: 'Build is clean with no warnings', critical: true },
  { label: 'README and docs up to date', critical: false },
  { label: 'Changelog updated', critical: false },
  { label: 'No uncommitted changes', critical: false },
  { label: 'Performance targets met', critical: false },
  { label: 'Security audit passed', critical: true },
]

function generateId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const auditorAgent = {
  createTaskCheckpoint(taskId: string, projectId: string): AuditCheckpoint {
    const checkpoint: AuditCheckpoint = {
      id: generateId(),
      name: 'Task Audit',
      description: `Audit for task ${taskId}`,
      category: 'task',
      checks: TASK_CHECKLIST.map((c, i) => ({
        id: `${i}`,
        label: c.label,
        passed: false,
        critical: c.critical,
      })),
      status: 'pending',
      createdAt: new Date().toISOString(),
      taskId,
      projectId,
      agentId: 'guard',
    }
    auditCheckpoints.push(checkpoint)
    return checkpoint
  },

  createPhaseCheckpoint(phaseId: string, projectId: string): AuditCheckpoint {
    const checkpoint: AuditCheckpoint = {
      id: generateId(),
      name: 'Phase Audit',
      description: `Audit for phase ${phaseId}`,
      category: 'phase',
      checks: PHASE_CHECKLIST.map((c, i) => ({
        id: `${i}`,
        label: c.label,
        passed: false,
        critical: c.critical,
      })),
      status: 'pending',
      createdAt: new Date().toISOString(),
      phaseId,
      projectId,
      agentId: 'guard',
    }
    auditCheckpoints.push(checkpoint)
    return checkpoint
  },

  createProjectCheckpoint(projectId: string): AuditCheckpoint {
    const checkpoint: AuditCheckpoint = {
      id: generateId(),
      name: 'Project Audit',
      description: `Full project audit`,
      category: 'project',
      checks: PROJECT_CHECKLIST.map((c, i) => ({
        id: `${i}`,
        label: c.label,
        passed: false,
        critical: c.critical,
      })),
      status: 'pending',
      createdAt: new Date().toISOString(),
      projectId,
      agentId: 'guard',
    }
    auditCheckpoints.push(checkpoint)
    return checkpoint
  },

  updateCheck(checkpointId: string, checkId: string, passed: boolean, notes?: string): boolean {
    const cp = auditCheckpoints.find(c => c.id === checkpointId)
    if (!cp) return false
    const check = cp.checks.find(c => c.id === checkId)
    if (!check) return false
    check.passed = passed
    if (notes) check.notes = notes
    this.recalculateStatus(cp)
    return true
  },

  approveAll(checkpointId: string): boolean {
    const cp = auditCheckpoints.find(c => c.id === checkpointId)
    if (!cp) return false
    for (const check of cp.checks) check.passed = true
    cp.status = 'passed'
    cp.completedAt = new Date().toISOString()
    agentMessageBroker.sendFromAgent('guard', `✅ Audit "${cp.name}" — all checks passed`, 'audit')
    return true
  },

  reject(checkpointId: string, reason: string): boolean {
    const cp = auditCheckpoints.find(c => c.id === checkpointId)
    if (!cp) return false
    cp.status = 'failed'
    cp.completedAt = new Date().toISOString()
    agentMessageBroker.sendFromAgent('guard', `❌ Audit "${cp.name}" rejected: ${reason}`, 'audit')
    return true
  },

  requestChanges(checkpointId: string, notes: string): boolean {
    const cp = auditCheckpoints.find(c => c.id === checkpointId)
    if (!cp) return false
    cp.status = 'needs-review'
    agentMessageBroker.sendFromAgent('guard', `🔄 Changes requested for "${cp.name}": ${notes}`, 'audit')
    return true
  },

  recalculateStatus(cp: AuditCheckpoint): void {
    const allPassed = cp.checks.every(c => c.passed)
    const anyCriticalFailed = cp.checks.some(c => c.critical && !c.passed)
    if (allPassed) {
      cp.status = 'passed'
      cp.completedAt = new Date().toISOString()
    } else if (anyCriticalFailed) {
      cp.status = 'failed'
    } else {
      cp.status = 'in-progress'
    }
  },

  getCheckpoint(id: string): AuditCheckpoint | undefined {
    return auditCheckpoints.find(c => c.id === id)
  },

  listCheckpoints(params: { category?: string; projectId?: string } = {}): AuditCheckpoint[] {
    let results = auditCheckpoints
    if (params.category) results = results.filter(c => c.category === params.category)
    if (params.projectId) results = results.filter(c => c.projectId === params.projectId)
    return results
  },

  getResult(checkpointId: string): AuditResult | null {
    const cp = auditCheckpoints.find(c => c.id === checkpointId)
    if (!cp) return null
    const passed = cp.checks.filter(c => c.passed).length
    const failed = cp.checks.filter(c => !c.passed).length
    const criticalFailures = cp.checks.filter(c => c.critical && !c.passed).map(c => c.label)
    const recommendations = cp.checks.filter(c => !c.passed).map(c => `Fix: ${c.label}`)

    return {
      checkpointId: cp.id,
      passed: cp.status === 'passed',
      totalChecks: cp.checks.length,
      passedChecks: passed,
      failedChecks: failed,
      criticalFailures,
      recommendations,
    }
  },

  async runTaskAudit(taskId: string, projectId: string): Promise<AuditResult> {
    const cp = this.createTaskCheckpoint(taskId, projectId)
    cp.status = 'in-progress'

    await agentMessageBroker.sendFromAgent('guard', `🔍 Starting task audit: ${taskId}`, 'audit')

    const result = this.getResult(cp.id)
    if (result && result.passed) {
      await agentMessageBroker.sendFromAgent('guard', `✅ Task audit passed: ${result.passedChecks}/${result.totalChecks}`, 'audit')
    } else if (result) {
      await agentMessageBroker.sendFromAgent('guard', `⚠️ Task audit: ${result.failedChecks} checks need attention`, 'audit')
    }

    agentLearning.recordExperience({
      agentId: 'guard',
      taskId,
      projectId,
      action: 'task-audit',
      result: result?.passed ? 'success' : 'partial',
      learnings: result?.recommendations || [],
      skills: ['code-audit', 'test-verification'],
      duration: Date.now() - new Date(cp.createdAt).getTime(),
      tokenCost: 0,
    })

    return result || { checkpointId: cp.id, passed: false, totalChecks: 0, passedChecks: 0, failedChecks: 0, criticalFailures: [], recommendations: [] }
  },
}
