import { eventBus } from './eventBus.js'
import { taskQueue } from './taskQueue.js'
import { taskPlanner } from './taskPlanner.js'
import { agentMemory } from './agentMemory.js'
import { toolRegistry } from './toolRegistry.js'
import type { BaseAgent } from './baseAgent.js'
import type { AgentCapability } from './baseAgent.js'
import type { Task } from './taskQueue.js'

class AgentOrchestrator {
  private agents = new Map<string, BaseAgent>()
  private processing = false

  register(agent: BaseAgent): void {
    this.agents.set(agent.id, agent)
    eventBus.emit('agent:status', { agentId: agent.id, status: agent.getStatus() })
    eventBus.emit('agent:chat', {
      id: `sys-${Date.now()}`,
      senderId: 'system',
      senderName: 'System',
      senderAvatar: '🔧',
      senderColor: '#666',
      content: `${agent.name} (${agent.type}) is now online`,
      type: 'status',
      timestamp: new Date().toISOString(),
      mentions: [],
    })
  }

  unregister(agentId: string): void {
    this.agents.delete(agentId)
  }

  registerDynamic(agent: BaseAgent): void {
    this.register(agent)
  }

  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId)
  }

  listAgents(): BaseAgent[] {
    return Array.from(this.agents.values())
  }

  findAgentsByCapability(capability: AgentCapability): BaseAgent[] {
    return this.listAgents().filter(a => a.capabilities.includes(capability))
  }

  async initializeAll(): Promise<void> {
    for (const agent of this.agents.values()) {
      try {
        await agent.initialize()
      } catch (err: any) {
        agent.setStatus('error')
      }
    }
    taskQueue.recover()
    eventBus.on('task:created', () => this.processQueue())
    eventBus.on('task:started', () => {})
    eventBus.on('task:completed', (payload) => this.onTaskCompleted(payload.task))
    eventBus.on('task:failed', (payload) => this.onTaskFailed(payload.task, payload.error))
    this.processing = true
    this.processQueue()
  }

  async shutdownAll(): Promise<void> {
    this.processing = false
    for (const agent of this.agents.values()) {
      await agent.shutdown()
    }
  }

  async submitGoal(goal: string): Promise<{ planId: string }> {
    const plan = await taskPlanner.planGoal(goal)

    for (const step of plan.steps) {
      taskQueue.enqueue({
        type: step.action,
        goalId: plan.id,
        agentId: this.selectAgent(step.action)?.id || 'executor',
        priority: 1,
        input: JSON.stringify({ stepId: step.id, description: step.description, action: step.action, params: step.params }),
        maxRetries: 2,
        dependsOn: step.dependsOn,
      })
    }

    eventBus.emit('goal:created', { goal, plan })
    return { planId: plan.id }
  }

  cancelGoal(planId: string): void {
    const tasks = taskQueue.listByGoal(planId)
    for (const task of tasks) {
      if (task.status === 'queued' || task.status === 'running') {
        taskQueue.cancel(task.id)
      }
    }
    taskPlanner.failPlan(planId, 'Cancelled by user')
  }

  private selectAgent(action: string): BaseAgent | undefined {
    const candidates = this.findAgentsByCapability('execution')
    for (const agent of candidates) {
      if (agent.getStatus() === 'idle') return agent
    }
    return candidates[0]
  }

  private async onTaskCompleted(task: Task): Promise<void> {
    taskQueue.complete(task.id, task.output || '')
    const planId = task.goalId
    const plan = taskPlanner.getPlan(planId)
    if (!plan) return

    const remaining = taskQueue.list({ goalId: planId }).filter(t => t.status === 'queued' || t.status === 'running')
    if (remaining.length === 0) {
      taskPlanner.completePlan(planId)
    }
  }

  private async onTaskFailed(task: Task, error: string): Promise<void> {
    const plan = taskPlanner.getPlan(task.goalId)
    if (!plan) return

    const revised = await taskPlanner.revisePlan(task.goalId, task.input, error)
    if (!revised) {
      taskPlanner.failPlan(task.goalId, error)
      return
    }

    const pendingSteps = revised.steps.filter(s => s.status === 'pending')
    for (const step of pendingSteps) {
      taskQueue.enqueue({
        type: step.action,
        goalId: revised.id,
        agentId: this.selectAgent(step.action)?.id || 'executor',
        priority: 1,
        input: JSON.stringify({ stepId: step.id, description: step.description, action: step.action, params: step.params }),
        maxRetries: 1,
        dependsOn: step.dependsOn,
      })
    }
  }

  private async processQueue(): Promise<void> {
    if (!this.processing) return

    const task = taskQueue.dequeue()
    if (!task) return

    const agent = this.agents.get(task.agentId) || this.listAgents()[0]
    if (!agent) {
      taskQueue.fail(task.id, 'No available agent')
      this.processQueue()
      return
    }

    agent.setStatus('busy')

    try {
      eventBus.emit('agent:chat', {
        id: `act-${Date.now()}`,
        senderId: agent.id,
        senderName: agent.name,
        senderAvatar: '⚡',
        senderColor: '#ff6600',
        content: `Working on: ${task.type || 'task'} — ${task.input.slice(0, 100)}`,
        type: 'action',
        timestamp: new Date().toISOString(),
        mentions: [],
      })

      let input: any
      try { input = JSON.parse(task.input) } catch { input = { raw: task.input } }

      const stepId = input?.stepId
      const step = stepId ? taskPlanner.getPlan(task.goalId)?.steps.find(s => s.id === stepId) : undefined

      if (step) {
        const result = await toolRegistry.execute(step.action, step.params)
        step.status = 'completed'
        step.result = typeof result === 'string' ? result : JSON.stringify(result)
        taskQueue.complete(task.id, typeof result === 'string' ? result : JSON.stringify(result))
      } else {
        const result = await agent.executeTask(task)
        taskQueue.complete(task.id, result)
      }

      eventBus.emit('agent:chat', {
        id: `done-${Date.now()}`,
        senderId: agent.id,
        senderName: agent.name,
        senderAvatar: '✅',
        senderColor: '#22c55e',
        content: `Task completed: ${task.type || 'task'}`,
        type: 'milestone',
        timestamp: new Date().toISOString(),
        mentions: [],
      })
    } catch (err: any) {
      taskQueue.fail(task.id, err.message || String(err))
      eventBus.emit('agent:chat', {
        id: `fail-${Date.now()}`,
        senderId: agent.id,
        senderName: agent.name,
        senderAvatar: '❌',
        senderColor: '#ef4444',
        content: `Task failed: ${err.message || 'Unknown error'}`,
        type: 'status',
        timestamp: new Date().toISOString(),
        mentions: [],
      })
    }

    agent.setStatus('idle')
    setImmediate(() => this.processQueue())
  }
}

export const orchestrator = new AgentOrchestrator()
