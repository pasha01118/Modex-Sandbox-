import type { IncomingMessage, ServerResponse } from 'node:http'
import { URL } from 'node:url'
import { orchestrator } from './agent/agentOrchestrator.js'
import { taskQueue } from './agent/taskQueue.js'
import { taskPlanner } from './agent/taskPlanner.js'
import { selfHeal } from './agent/selfHeal.js'
import { toolRegistry } from './agent/toolRegistry.js'
import { agentMemory } from './agent/agentMemory.js'
import { eventBus } from './agent/eventBus.js'
import { defaultAgents } from './agent/defaultAgents.js'

function json(res: ServerResponse, data: any, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

export async function handleAgentRoutes(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean> {
  if (!url.pathname.startsWith('/codex-api/agent')) return false

  const method = req.method || 'GET'

  if (method === 'GET' && url.pathname === '/codex-api/agent/status') {
    const agents = orchestrator.listAgents().map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      capabilities: a.capabilities,
      status: a.getStatus(),
      activeTasks: a.getActiveTasks(),
    }))
    json(res, { agents, queueConcurrency: taskQueue.getConcurrency(), activePlanId: agentMemory.get('planner', 'activePlanId') })
    return true
  }

  if (method === 'POST' && url.pathname === '/codex-api/agent/goal') {
    const body = JSON.parse(await readBody(req))
    const goal = body.goal
    if (!goal || typeof goal !== 'string') {
      json(res, { error: 'Missing goal field' }, 400)
      return true
    }
    const result = await orchestrator.submitGoal(goal)
    json(res, result, 201)
    return true
  }

  if (method === 'GET' && url.pathname === '/codex-api/agent/goals') {
    const plans = taskPlanner.listPlans()
    json(res, { plans })
    return true
  }

  if (method === 'GET' && url.pathname.startsWith('/codex-api/agent/goal/')) {
    const planId = url.pathname.replace('/codex-api/agent/goal/', '')
    if (url.pathname.endsWith('/cancel')) {
      const pid = url.pathname.replace('/cancel', '').replace('/codex-api/agent/goal/', '')
      orchestrator.cancelGoal(pid)
      json(res, { ok: true })
      return true
    }
    const plan = taskPlanner.getPlan(planId)
    if (!plan) { json(res, { error: 'Plan not found' }, 404); return true }
    const tasks = taskQueue.listByGoal(planId)
    json(res, { plan, tasks })
    return true
  }

  if (method === 'POST' && url.pathname.match(/^\/codex-api\/agent\/goal\/.+\/cancel$/)) {
    const planId = url.pathname.replace('/cancel', '').split('/').pop()!
    orchestrator.cancelGoal(planId)
    json(res, { ok: true })
    return true
  }

  if (method === 'GET' && url.pathname === '/codex-api/agent/tasks') {
    const status = url.searchParams.get('status') as any || undefined
    const goalId = url.searchParams.get('goalId') || undefined
    const tasks = taskQueue.list({ status, goalId })
    json(res, { tasks })
    return true
  }

  if (method === 'POST' && url.pathname.match(/^\/codex-api\/agent\/task\/.+\/retry$/)) {
    const taskId = url.pathname.replace('/retry', '').split('/').pop()!
    taskQueue.retry(taskId)
    json(res, { ok: true })
    return true
  }

  if (method === 'POST' && url.pathname.match(/^\/codex-api\/agent\/task\/.+\/cancel$/)) {
    const taskId = url.pathname.replace('/cancel', '').split('/').pop()!
    taskQueue.cancel(taskId)
    json(res, { ok: true })
    return true
  }

  if (method === 'GET' && url.pathname === '/codex-api/agent/tools') {
    json(res, { tools: toolRegistry.list() })
    return true
  }

  if (method === 'POST' && url.pathname === '/codex-api/agent/tools/execute') {
    const body = JSON.parse(await readBody(req))
    try {
      const result = await toolRegistry.execute(body.name, body.params || {})
      json(res, { result })
    } catch (err: any) {
      json(res, { error: err.message }, 400)
    }
    return true
  }

  if (method === 'GET' && url.pathname === '/codex-api/agent/memory') {
    const namespace = url.searchParams.get('namespace') || 'default'
    const data = agentMemory.getAll(namespace)
    const keys = agentMemory.list(namespace)
    json(res, { namespace, keys, data })
    return true
  }

  if (method === 'POST' && url.pathname === '/codex-api/agent/memory') {
    const body = JSON.parse(await readBody(req))
    agentMemory.set(body.namespace || 'default', body.key, body.value)
    json(res, { ok: true })
    return true
  }

  if (method === 'DELETE' && url.pathname === '/codex-api/agent/memory') {
    const body = JSON.parse(await readBody(req))
    agentMemory.delete(body.namespace || 'default', body.key)
    json(res, { ok: true })
    return true
  }

  if (method === 'POST' && url.pathname === '/codex-api/agent/self-heal/check') {
    const report = await selfHeal.checkHealth()
    json(res, report)
    return true
  }

  if (method === 'POST' && url.pathname === '/codex-api/agent/self-heal/update') {
    const result = await selfHeal.autoUpdate()
    json(res, result)
    return true
  }

  if (method === 'GET' && url.pathname === '/codex-api/agent/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const handler = (payload: any) => {
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`)
      } catch { /* ignore */ }
    }

    const events = ['task:created', 'task:completed', 'task:failed', 'goal:created', 'goal:completed', 'goal:failed', 'agent:status', 'system:health', 'system:update']
    for (const ev of events) eventBus.on(ev, handler)

    res.on('close', () => {
      for (const ev of events) eventBus.off(ev, handler)
    })
    return true
  }

  if (method === 'POST' && url.pathname === '/codex-api/agent/queue/concurrency') {
    const body = JSON.parse(await readBody(req))
    taskQueue.setConcurrency(body.maxConcurrency || 3)
    json(res, { ok: true })
    return true
  }

  if (method === 'GET' && url.pathname === '/codex-api/agent/planner/config') {
    const config = agentMemory.get('planner', 'config') || {}
    json(res, { config })
    return true
  }

  if (method === 'POST' && url.pathname === '/codex-api/agent/planner/config') {
    const body = JSON.parse(await readBody(req))
    agentMemory.set('planner', 'config', body.config || {})
    json(res, { ok: true })
    return true
  }

  json(res, { error: 'Not found' }, 404)
  return true
}
