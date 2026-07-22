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
    await this.narrate('Executor online and ready for tasks')
  }

  async executeTask(task: Task): Promise<string> {
    let input: any
    try { input = JSON.parse(task.input) } catch { input = { raw: task.input } }

    const action = input.action || task.type || 'executeCommand'
    const params = input.params || { command: input.raw || input.description || task.input }

    try {
      this.setStatus('busy')
      await this.narrate('Executing', action)
      const result = await toolRegistry.execute(action, params)
      await this.milestone(`Completed: ${action}`)
      return typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    } catch (err: any) {
      this.log('error', `Task ${task.id} failed: ${err.message}`)
      await this.sendMessage(`❌ Error executing ${action}: ${err.message}`, 'status')
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
    await this.narrate('Planner online and ready to analyze goals')
  }

  async executeTask(task: Task): Promise<string> {
    const input = JSON.parse(task.input)
    const goal = input.goal || input.description || task.input

    try {
      this.setStatus('busy')
      await this.narrate('Planning goal', goal.slice(0, 60))
      const plan = await taskPlanner.planGoal(goal)
      await this.milestone(`Plan created: ${plan.steps.length} steps`)
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
    await this.narrate('Maintainer online — monitoring system health')
  }

  async executeTask(task: Task): Promise<string> {
    const input = JSON.parse(task.input)

    if (input.action === 'health') {
      await this.narrate('Running health check')
      const report = await selfHeal.checkHealth()
      await this.milestone('Health check complete')
      return JSON.stringify(report, null, 2)
    }

    if (input.action === 'update') {
      await this.narrate('Checking for updates')
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
