import { BaseAgent } from './baseAgent.js'
import { toolRegistry } from './toolRegistry.js'
import { taskPlanner } from './taskPlanner.js'
import { selfHeal } from './selfHeal.js'
import { orchestrator } from './agentOrchestrator.js'
import type { Task } from './taskQueue.js'

class ExecutorAgent extends BaseAgent {
  constructor() {
    super({
      id: 'executor',
      name: 'Executor',
      type: 'executor',
      capabilities: ['execution', 'code'],
      description: 'Executes tasks using available tools (shell, file, git, search)',
      maxConcurrentTasks: 2,
    })
  }

  async initialize(): Promise<void> {
    this.setStatus('idle')
  }

  async executeTask(task: Task): Promise<string> {
    let input: any
    try { input = JSON.parse(task.input) } catch { input = { raw: task.input } }

    const action = input.action || task.type || 'executeCommand'
    const params = input.params || { command: input.raw || input.description || task.input }

    try {
      this.setStatus('busy')
      const result = await toolRegistry.execute(action, params)
      return typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    } catch (err: any) {
      this.log('error', `Task ${task.id} failed: ${err.message}`)
      throw err
    } finally {
      this.setStatus('idle')
    }
  }
}

class PlannerAgent extends BaseAgent {
  constructor() {
    super({
      id: 'planner',
      name: 'Planner',
      type: 'planner',
      capabilities: ['planning'],
      description: 'Analyzes goals and breaks them into executable plans',
    })
  }

  async initialize(): Promise<void> {
    this.setStatus('idle')
  }

  async executeTask(task: Task): Promise<string> {
    const input = JSON.parse(task.input)
    const goal = input.goal || input.description || task.input

    try {
      this.setStatus('busy')
      const plan = await taskPlanner.planGoal(goal)
      return JSON.stringify({ planId: plan.id, steps: plan.steps.length }, null, 2)
    } catch (err: any) {
      this.log('error', `Planning failed: ${err.message}`)
      throw err
    } finally {
      this.setStatus('idle')
    }
  }
}

class MaintainerAgent extends BaseAgent {
  private healthInterval?: () => void
  private updateInterval?: () => void

  constructor() {
    super({
      id: 'maintainer',
      name: 'Maintainer',
      type: 'maintainer',
      capabilities: ['maintenance', 'monitoring'],
      description: 'Monitors system health and applies self-maintenance',
    })
  }

  async initialize(): Promise<void> {
    this.healthInterval = selfHeal.startPeriodicHealthCheck()
    this.updateInterval = selfHeal.startPeriodicUpdateCheck()
    this.setStatus('monitoring')
  }

  async executeTask(task: Task): Promise<string> {
    const input = JSON.parse(task.input)

    if (input.action === 'health') {
      const report = await selfHeal.checkHealth()
      return JSON.stringify(report, null, 2)
    }

    if (input.action === 'update') {
      const result = await selfHeal.autoUpdate()
      return JSON.stringify(result, null, 2)
    }

    throw new Error(`Unknown maintenance action: ${input.action}`)
  }

  async shutdown(): Promise<void> {
    this.healthInterval?.()
    this.updateInterval?.()
    await super.shutdown()
  }
}

export const defaultAgents = {
  executor: new ExecutorAgent(),
  planner: new PlannerAgent(),
  maintainer: new MaintainerAgent(),

  registerAll(): void {
    orchestrator.register(this.executor)
    orchestrator.register(this.planner)
    orchestrator.register(this.maintainer)
  },
}
