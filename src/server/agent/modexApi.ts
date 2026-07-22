import { Router } from 'express'
import { modexBoss } from './modexBoss.js'
import { modexMemory } from './modexMemory.js'
import { modexOrchestrator } from './modexOrchestrator.js'

export const modexRouter = Router()

// ── Projects ──
modexRouter.get('/projects', (_req, res) => {
  const ids = modexMemory.listProjects()
  const projects = ids.map(id => modexMemory.getProject(id)).filter(Boolean)
  res.json({ projects })
})

modexRouter.post('/projects', (req, res) => {
  const { projectId, title, description } = req.body
  if (!projectId || !title) {
    res.status(400).json({ error: 'projectId and title are required' })
    return
  }
  const mem = modexBoss.createProject(projectId, title, description || '')
  res.json({ project: mem })
})

modexRouter.get('/projects/:id', (req, res) => {
  const mem = modexMemory.getProject(req.params.id)
  if (!mem) { res.status(404).json({ error: 'Project not found' }); return }
  res.json({ project: mem })
})

modexRouter.delete('/projects/:id', (req, res) => {
  modexMemory.deleteProject(req.params.id)
  res.json({ ok: true })
})

modexRouter.post('/projects/:id/activate', (req, res) => {
  modexOrchestrator.setActiveProject(req.params.id)
  res.json({ ok: true, activeProjectId: req.params.id })
})

// ── Dashboard ──
modexRouter.get('/projects/:id/dashboard', (req, res) => {
  const dash = modexOrchestrator.getDashboard(req.params.id)
  res.json(dash)
})

modexRouter.get('/projects/:id/health', (req, res) => {
  const health = modexBoss.getProjectHealth(req.params.id)
  res.json(health)
})

modexRouter.get('/projects/:id/stats', (req, res) => {
  const stats = modexBoss.getProjectStats(req.params.id)
  if (!stats) { res.status(404).json({ error: 'Project not found' }); return }
  res.json(stats)
})

modexRouter.get('/projects/:id/workflow', (req, res) => {
  const wf = modexBoss.getWorkflowState(req.params.id)
  if (!wf) { res.status(404).json({ error: 'Project not found' }); return }
  res.json(wf)
})

// ── Phases ──
modexRouter.get('/projects/:id/phases', (req, res) => {
  const mem = modexMemory.getProject(req.params.id)
  if (!mem) { res.status(404).json({ error: 'Project not found' }); return }
  res.json({ phases: mem.phases })
})

modexRouter.post('/projects/:id/phases/:phaseId/complete', (req, res) => {
  const ok = modexMemory.completePhase(req.params.id, req.params.phaseId)
  res.json({ ok })
})

// ── Tasks ──
modexRouter.get('/projects/:id/tasks', (req, res) => {
  const mem = modexMemory.getProject(req.params.id)
  if (!mem) { res.status(404).json({ error: 'Project not found' }); return }
  const allTasks = mem.phases.flatMap(p => p.tasks.map(t => ({ ...t, phaseName: p.name })))
  res.json({ tasks: allTasks })
})

modexRouter.get('/projects/:id/tasks/next', (req, res) => {
  const task = modexMemory.getNextTask(req.params.id)
  res.json({ task })
})

modexRouter.get('/projects/:id/tasks/current', (req, res) => {
  const task = modexMemory.getCurrentTask(req.params.id)
  res.json({ task })
})

modexRouter.post('/projects/:id/tasks/:taskId/start', (req, res) => {
  const ok = modexBoss.startTask(req.params.id, req.params.taskId)
  res.json({ ok })
})

modexRouter.post('/projects/:id/tasks/:taskId/complete', (req, res) => {
  const { result } = req.body
  const ok = modexBoss.completeTask(req.params.id, req.params.taskId, result || 'Completed')
  res.json({ ok })
})

modexRouter.post('/projects/:id/tasks/:taskId/fail', (req, res) => {
  const { error } = req.body
  const ok = modexBoss.failTask(req.params.id, req.params.taskId, error || 'Unknown error')
  res.json({ ok })
})

// ── Scope check ──
modexRouter.post('/projects/:id/scope-check', (req, res) => {
  const { taskTitle } = req.body
  const result = modexBoss.isTaskInScope(req.params.id, taskTitle || '')
  res.json(result)
})

// ── Agent guidance ──
modexRouter.get('/projects/:id/guide/:agentType', (req, res) => {
  const guidance = modexBoss.guideAgent(req.params.id, req.params.agentType)
  res.json({ guidance })
})

// ── Orchestrator ──
modexRouter.post('/orchestrator/pre-check', (req, res) => {
  const response = modexOrchestrator.preExecutionCheck(req.body)
  res.json(response)
})

modexRouter.post('/orchestrator/post-check', (req, res) => {
  const { projectId, taskId, result, success } = req.body
  modexOrchestrator.postExecutionCheck(projectId, taskId, result, success)
  res.json({ ok: true })
})

modexRouter.get('/orchestrator/active-project', (_req, res) => {
  res.json({ projectId: modexOrchestrator.getActiveProject() })
})

// ── Memory / Learnings ──
modexRouter.get('/projects/:id/decisions', (req, res) => {
  const mem = modexMemory.getProject(req.params.id)
  if (!mem) { res.status(404).json({ error: 'Project not found' }); return }
  res.json({ decisions: mem.decisions })
})

modexRouter.get('/projects/:id/learnings', (req, res) => {
  const mem = modexMemory.getProject(req.params.id)
  if (!mem) { res.status(404).json({ error: 'Project not found' }); return }
  res.json({ learnings: mem.learnings })
})

modexRouter.post('/projects/:id/context', (req, res) => {
  const { note } = req.body
  if (note) modexBoss.addContextNote(req.params.id, note)
  res.json({ ok: true })
})

modexRouter.get('/global-learnings', (_req, res) => {
  const mem = modexMemory.getGlobalMemory()
  res.json(mem)
})
