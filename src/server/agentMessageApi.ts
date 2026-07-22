import type { IncomingMessage, ServerResponse } from 'node:http'
import { URL } from 'node:url'
import { agentMessageBroker } from './agent/agentMessageBroker.js'
import { agentIdentities } from './agent/agentIdentities.js'
import { agentLearning } from './agent/agentLearning.js'
import { auditorAgent } from './agent/auditorAgent.js'

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

export async function handleAgentMessageRoutes(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean> {
  const pathname = url.pathname
  if (!pathname.startsWith('/api/agents')) return false

  const method = req.method || 'GET'

  // GET /api/agents/chat/history - Get chat history
  if (method === 'GET' && pathname === '/api/agents/chat/history') {
    const date = url.searchParams.get('date') || undefined
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const senderId = url.searchParams.get('senderId') || undefined
    const history = agentMessageBroker.getHistory({ date, limit, offset, senderId })
    json(res, { messages: history })
    return true
  }

  // GET /api/agents/chat/history/all - Get multi-day history
  if (method === 'GET' && pathname === '/api/agents/chat/history/all') {
    const days = parseInt(url.searchParams.get('days') || '7')
    const history = agentMessageBroker.getAllHistory(days)
    json(res, { messages: history })
    return true
  }

  // POST /api/agents/chat/send - Send a message
  if (method === 'POST' && pathname === '/api/agents/chat/send') {
    const body = JSON.parse(await readBody(req))
    if (!body.content || typeof body.content !== 'string') {
      json(res, { error: 'Missing content' }, 400)
      return true
    }
    const msg = await agentMessageBroker.sendFromUser(body.content, body.userId)
    json(res, { message: msg })
    return true
  }

  // POST /api/agents/chat/command - Send a command
  if (method === 'POST' && pathname === '/api/agents/chat/command') {
    const body = JSON.parse(await readBody(req))
    if (!body.command || typeof body.command !== 'string') {
      json(res, { error: 'Missing command' }, 400)
      return true
    }
    await agentMessageBroker.sendCommand(body.command, body.userId)
    json(res, { ok: true })
    return true
  }

  // GET /api/agents/identities - List all agent identities
  if (method === 'GET' && pathname === '/api/agents/identities') {
    const identities = agentIdentities.list()
    json(res, { agents: identities })
    return true
  }

  // GET /api/agents/identity/:id - Get specific identity
  if (method === 'GET' && pathname.match(/^\/api\/agents\/identity\/[^/]+$/)) {
    const id = pathname.split('/').pop()!
    const identity = agentIdentities.get(id)
    if (!identity) { json(res, { error: 'Not found' }, 404); return true }
    json(res, { agent: identity })
    return true
  }

  // POST /api/agents/identity - Create custom identity
  if (method === 'POST' && pathname === '/api/agents/identity') {
    const body = JSON.parse(await readBody(req))
    const identity = agentIdentities.create(body)
    json(res, { agent: identity }, 201)
    return true
  }

  // PUT /api/agents/identity/:id - Update identity
  if (method === 'PUT' && pathname.match(/^\/api\/agents\/identity\/[^/]+$/)) {
    const id = pathname.split('/').pop()!
    const body = JSON.parse(await readBody(req))
    const updated = agentIdentities.update(id, body)
    if (!updated) { json(res, { error: 'Not found or immutable' }, 404); return true }
    json(res, { agent: updated })
    return true
  }

  // DELETE /api/agents/identity/:id - Delete custom identity
  if (method === 'DELETE' && pathname.match(/^\/api\/agents\/identity\/[^/]+$/)) {
    const id = pathname.split('/').pop()!
    const deleted = agentIdentities.delete(id)
    if (!deleted) { json(res, { error: 'Not found or built-in' }, 404); return true }
    json(res, { ok: true })
    return true
  }

  // POST /api/agents/identity/:id/assign - Assign to project
  if (method === 'POST' && pathname.match(/^\/api\/agents\/identity\/[^/]+\/assign$/)) {
    const id = pathname.split('/')[4]
    const body = JSON.parse(await readBody(req))
    if (!body.projectId) { json(res, { error: 'Missing projectId' }, 400); return true }
    const ok = agentIdentities.assignToProject(id, body.projectId)
    json(res, { ok })
    return true
  }

  // GET /api/agents/learning/:id - Get agent growth/learning
  if (method === 'GET' && pathname.match(/^\/api\/agents\/learning\/[^/]+$/)) {
    const id = pathname.split('/').pop()!
    const growth = agentLearning.getGrowth(id)
    const experiences = agentLearning.getExperiences(id)
    const patterns = agentLearning.analyzePatterns(id)
    json(res, { growth, experiences, patterns })
    return true
  }

  // GET /api/agents/learning/leaderboard - Get leaderboard
  if (method === 'GET' && pathname === '/api/agents/learning/leaderboard') {
    const leaderboard = agentLearning.getLeaderboard()
    json(res, { leaderboard })
    return true
  }

  // GET /api/agents/audit/:taskId - Run task audit
  if (method === 'GET' && pathname.match(/^\/api\/agents\/audit\/task\/[^/]+$/)) {
    const taskId = pathname.split('/').pop()!
    const projectId = url.searchParams.get('projectId') || 'default'
    const result = await auditorAgent.runTaskAudit(taskId, projectId)
    json(res, { result })
    return true
  }

  // GET /api/agents/audit/checkpoints - List checkpoints
  if (method === 'GET' && pathname === '/api/agents/audit/checkpoints') {
    const category = url.searchParams.get('category') || undefined
    const projectId = url.searchParams.get('projectId') || undefined
    const checkpoints = auditorAgent.listCheckpoints({ category, projectId })
    json(res, { checkpoints })
    return true
  }

  // POST /api/agents/audit/approve/:id - Approve checkpoint
  if (method === 'POST' && pathname.match(/^\/api\/agents\/audit\/approve\/[^/]+$/)) {
    const id = pathname.split('/').pop()!
    const ok = auditorAgent.approveAll(id)
    json(res, { ok })
    return true
  }

  // POST /api/agents/audit/reject/:id - Reject checkpoint
  if (method === 'POST' && pathname.match(/^\/api\/agents\/audit\/reject\/[^/]+$/)) {
    const id = pathname.split('/').pop()!
    const body = JSON.parse(await readBody(req))
    const ok = auditorAgent.reject(id, body.reason || 'Rejected')
    json(res, { ok })
    return true
  }

  // SSE /api/agents/chat/events - Real-time chat stream
  if (method === 'GET' && pathname === '/api/agents/chat/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    agentMessageBroker.connectSSE(res)
    req.on('close', () => agentMessageBroker.removeSSEClient(res))
    return true
  }

  json(res, { error: 'Not found' }, 404)
  return true
}
