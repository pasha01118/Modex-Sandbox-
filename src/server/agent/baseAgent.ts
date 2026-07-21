import { eventBus } from './eventBus.js'
import { toolRegistry } from './toolRegistry.js'
import type { Task } from './taskQueue.js'

export type AgentStatus = 'idle' | 'busy' | 'monitoring' | 'error' | 'paused'
export type AgentCapability = 'planning' | 'execution' | 'monitoring' | 'maintenance' | 'communication' | 'code'

export interface AgentConfig {
  id: string
  name: string
  type: string
  capabilities: AgentCapability[]
  description: string
  maxConcurrentTasks?: number
  [key: string]: any
}

export abstract class BaseAgent {
  readonly id: string
  readonly name: string
  readonly type: string
  readonly capabilities: AgentCapability[]
  readonly description: string
  protected status: AgentStatus = 'idle'
  protected activeTasks: Set<string> = new Set()
  protected config: Record<string, any>

  constructor(config: AgentConfig) {
    this.id = config.id
    this.name = config.name
    this.type = config.type
    this.capabilities = config.capabilities
    this.description = config.description
    this.config = config
  }

  getStatus(): AgentStatus { return this.status }
  getActiveTasks(): string[] { return Array.from(this.activeTasks) }

  setStatus(s: AgentStatus): void {
    this.status = s
    eventBus.emit('agent:status', { agentId: this.id, status: s })
  }

  abstract initialize(): Promise<void>

  abstract executeTask(task: Task): Promise<string>

  handleMessage?(message: { from: string; type: string; payload: any }): Promise<void>

  async shutdown(): Promise<void> {
    this.setStatus('paused')
    this.activeTasks.clear()
  }

  protected log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {
    const entry = { agentId: this.id, level, message, data, timestamp: new Date().toISOString() }
    eventBus.emit('agent:alert', entry)
  }

  protected async executeTool(name: string, params: Record<string, any>): Promise<any> {
    return toolRegistry.execute(name, params)
  }
}
