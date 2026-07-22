import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { eventBus } from './eventBus.js'
import { agentIdentities } from './agentIdentities.js'

const STATE_DIR = join(homedir(), '.codex', 'agent-messages')

export type AgentMessageType =
  | 'chat' | 'action' | 'milestone' | 'system' | 'typing'
  | 'command' | 'guidance' | 'escalation' | 'status' | 'evaluation' | 'audit'

export interface AgentMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  senderColor: string
  content: string
  type: AgentMessageType
  timestamp: string
  mentions: string[]
  taskId?: string
  projectId?: string
  metadata?: Record<string, any>
}

let sseClients: Set<any> = new Set()
let pendingCommands: Map<string, { resolve: (v: boolean) => void; timeout: ReturnType<typeof setTimeout> }> = new Map()

function ensureDir() {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true })
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function getLogFile(date: string): string {
  return join(STATE_DIR, `${date}.json`)
}

function loadLogs(date: string): AgentMessage[] {
  const file = getLogFile(date)
  if (!existsSync(file)) return []
  try { return JSON.parse(readFileSync(file, 'utf-8')) } catch { return [] }
}

function saveLogs(date: string, messages: AgentMessage[]) {
  ensureDir()
  writeFileSync(getLogFile(date), JSON.stringify(messages, null, 2))
}

function broadcastSSE(message: AgentMessage) {
  const payload = `event: agent:message\ndata: ${JSON.stringify(message)}\n\n`
  for (const client of sseClients) {
    try { client.write(payload) } catch { sseClients.delete(client) }
  }
}

function broadcastTyping(agentId: string, isTyping: boolean) {
  const payload = `event: agent:typing\ndata: ${JSON.stringify({ agentId, typing: isTyping })}\n\n`
  for (const client of sseClients) {
    try { client.write(payload) } catch { sseClients.delete(client) }
  }
}

function broadcastCommand(command: string, userId: string) {
  const payload = `event: agent:command\ndata: ${JSON.stringify({ command, userId, timestamp: new Date().toISOString() })}\n\n`
  for (const client of sseClients) {
    try { client.write(payload) } catch { sseClients.delete(client) }
  }
}

export const agentMessageBroker = {
  parseMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match
    while ((match = mentionRegex.exec(content)) !== null) {
      const name = match[1].toLowerCase()
      const agents = agentIdentities.list()
      const found = agents.find(a => a.name.toLowerCase() === name || a.id === name)
      if (found) mentions.push(found.id)
    }
    return mentions
  },

  store(message: AgentMessage): void {
    const date = today()
    const logs = loadLogs(date)
    logs.push(message)
    saveLogs(date, logs)
  },

  broadcast(message: AgentMessage): void {
    this.store(message)
    broadcastSSE(message)
    eventBus.emit('agent:chat', message)
  },

  async routeToAgent(agentId: string, message: AgentMessage): Promise<void> {
    eventBus.emit('agent:message-routed', { agentId, message })
    const identity = agentIdentities.get(agentId)
    if (identity) {
      broadcastTyping(agentId, true)
    }
  },

  stopTyping(agentId: string): void {
    broadcastTyping(agentId, false)
  },

  createMessage(params: {
    senderId: string
    senderName: string
    senderAvatar: string
    senderColor: string
    content: string
    type: AgentMessageType
    mentions?: string[]
    taskId?: string
    projectId?: string
    metadata?: Record<string, any>
  }): AgentMessage {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      senderId: params.senderId,
      senderName: params.senderName,
      senderAvatar: params.senderAvatar,
      senderColor: params.senderColor,
      content: params.content,
      type: params.type,
      timestamp: new Date().toISOString(),
      mentions: params.mentions || this.parseMentions(params.content),
      taskId: params.taskId,
      projectId: params.projectId,
      metadata: params.metadata,
    }
  },

  async sendFromAgent(agentId: string, content: string, type: AgentMessageType = 'chat'): Promise<AgentMessage> {
    const identity = agentIdentities.get(agentId)
    if (!identity) throw new Error(`Agent ${agentId} not found`)
    const msg = this.createMessage({
      senderId: agentId,
      senderName: identity.name,
      senderAvatar: identity.avatar,
      senderColor: identity.color,
      content,
      type,
    })
    this.broadcast(msg)
    return msg
  },

  async sendFromUser(content: string, userId: string = 'user'): Promise<AgentMessage> {
    const msg = this.createMessage({
      senderId: userId,
      senderName: 'You',
      senderAvatar: '👤',
      senderColor: '#a0a0c0',
      content,
      type: 'chat',
    })
    this.broadcast(msg)
    const mentions = this.parseMentions(content)
    for (const agentId of mentions) {
      await this.routeToAgent(agentId, msg)
    }
    return msg
  },

  async sendCommand(command: string, userId: string = 'user'): Promise<void> {
    const msg = this.createMessage({
      senderId: userId,
      senderName: 'You',
      senderAvatar: '👤',
      senderColor: '#a0a0c0',
      content: `⚡ Command: ${command}`,
      type: 'command',
    })
    this.broadcast(msg)
    broadcastCommand(command, userId)
    eventBus.emit('agent:command', { command, userId })

    if (command === 'stop') {
      eventBus.emit('agent:stop-all', { userId })
    } else if (command === 'wait') {
      eventBus.emit('agent:pause-all', { userId })
    }
  },

  getHistory(params: {
    date?: string
    limit?: number
    offset?: number
    senderId?: string
    type?: AgentMessageType
  } = {}): AgentMessage[] {
    const date = params.date || today()
    let messages = loadLogs(date)
    if (params.senderId) messages = messages.filter(m => m.senderId === params.senderId)
    if (params.type) messages = messages.filter(m => m.type === params.type)
    messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    const offset = params.offset || 0
    const limit = params.limit || 100
    return messages.slice(offset, offset + limit)
  },

  getAllHistory(days: number = 7): AgentMessage[] {
    const messages: AgentMessage[] = []
    const now = new Date()
    for (let i = 0; i < days; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      messages.push(...loadLogs(d.toISOString().slice(0, 10)))
    }
    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  },

  connectSSE(res: any) {
    sseClients.add(res)
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'ok', agents: agentIdentities.list().map(a => ({ id: a.id, name: a.name, avatar: a.avatar, color: a.color, status: a.status })) })}\n\n`)
  },

  removeSSEClient(res: any) {
    sseClients.delete(res)
  },

  cleanupOldLogs(keepDays: number = 90) {
    if (!existsSync(STATE_DIR)) return
    const now = new Date()
    const files = readdirSync(STATE_DIR).filter(f => f.endsWith('.json'))
    for (const file of files) {
      const dateStr = file.replace('.json', '')
      const fileDate = new Date(dateStr)
      if (isNaN(fileDate.getTime())) continue
      const ageDays = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24))
      if (ageDays > keepDays) {
        unlinkSync(join(STATE_DIR, file))
      }
    }
  },
}
