import { eventBus } from './eventBus.js'
import { taskQueue } from './taskQueue.js'
import { toolRegistry } from './toolRegistry.js'
import { agentMemory } from './agentMemory.js'

export interface PlanStep {
  id: string
  description: string
  action: string
  params: Record<string, any>
  dependsOn: string[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  error?: string
}

export interface Plan {
  id: string
  goal: string
  steps: PlanStep[]
  status: 'active' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
}

const MAX_PLAN_RETRIES = 3

function nextId(): string {
  return crypto.randomUUID()
}

interface PlannerAgentConfig {
  ollamaEndpoint?: string
  ollamaModel?: string
  useCodex?: boolean
}

const DEFAULT_CONFIG: PlannerAgentConfig = {
  ollamaEndpoint: 'http://127.0.0.1:11434',
  ollamaModel: 'llama3.2',
  useCodex: false,
}

async function callLLM(prompt: string, config: PlannerAgentConfig): Promise<string> {
  if (config.useCodex) {
    throw new Error('Codex RPC planning not implemented')
  }

  const { ollamaEndpoint, ollamaModel } = config
  const response = await fetch(`${ollamaEndpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      prompt,
      stream: false,
      options: { temperature: 0.3, num_predict: 2048 },
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as any
  return data.response || ''
}

function parsePlanFromLLM(raw: string, goal: string): Plan {
  const steps: PlanStep[] = []
  let idCounter = 0

  const lines = raw.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    const match = trimmed.match(/^(?:\d+[\.\)]\s*|\*\s*|\-\s*)(.+)/)
    if (!match) continue
    const description = match[1].trim()
    if (!description || description.length < 5) continue

    const action = guessAction(description)
    const params = guessParams(action, description, goal)

    idCounter++
    steps.push({
      id: `step-${idCounter}`,
      description,
      action,
      params,
      dependsOn: idCounter > 1 ? [`step-${idCounter - 1}`] : [],
      status: 'pending',
    })
  }

  if (steps.length === 0) {
    steps.push({
      id: 'step-1',
      description: `Execute: ${goal}`,
      action: 'executeCommand',
      params: { command: `echo "Executing: ${goal}"` },
      dependsOn: [],
      status: 'pending',
    })
  }

  return {
    id: nextId(),
    goal,
    steps,
    status: 'active',
    createdAt: new Date().toISOString(),
  }
}

function guessAction(description: string): string {
  const lower = description.toLowerCase()
  if (lower.startsWith('run ') || lower.startsWith('execute ') || lower.startsWith('install ')) return 'executeCommand'
  if (lower.startsWith('read ') || lower.startsWith('check ') || lower.startsWith('show ')) return 'readFile'
  if (lower.startsWith('write ') || lower.startsWith('create ') || lower.startsWith('save ')) return 'writeFile'
  if (lower.startsWith('search ') || lower.startsWith('find ') || lower.startsWith('grep ')) return 'searchCode'
  if (lower.startsWith('list ') || lower.startsWith('explore ')) return 'listDirectory'
  if (lower.startsWith('commit ') || lower.startsWith('git commit')) return 'gitCommit'
  if (lower.startsWith('status') || lower.includes('git status')) return 'gitStatus'
  if (lower.startsWith('edit ') || lower.startsWith('update ') || lower.startsWith('modify ')) return 'writeFile'
  return 'executeCommand'
}

function guessParams(action: string, _description: string, _goal: string): Record<string, any> {
  if (action === 'executeCommand') {
    return { command: `echo "TODO: ${_description}"` }
  }
  if (action === 'readFile') return { path: process.cwd() }
  if (action === 'writeFile') return { path: `${process.cwd()}/output.md`, content: `# Result\n\n${_description}\n` }
  if (action === 'searchCode') return { pattern: _description, path: process.cwd() }
  if (action === 'listDirectory') return { path: process.cwd() }
  return {}
}

async function refinePlanStep(step: PlanStep, config: PlannerAgentConfig): Promise<{ action: string; params: Record<string, any> }> {
  const prompt = [
    'You are an autonomous agent planner. Given a step description, choose the best tool and parameters.',
    '',
    `Step: ${step.description}`,
    '',
    'Available tools:',
    ...toolRegistry.list().map(t => `- ${t.name}: ${t.description}`),
    '',
    'Respond with JSON only: { "action": "toolName", "params": { ... } }',
  ].join('\n')

  try {
    const raw = await callLLM(prompt, config)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch { /* fallback */ }

  return { action: step.action, params: step.params }
}

export const taskPlanner = {
  async planGoal(goal: string): Promise<Plan> {
    const config: PlannerAgentConfig = agentMemory.get('planner', 'config') || DEFAULT_CONFIG
    agentMemory.set('planner', 'lastGoal', goal)

    const prompt = [
      'You are an autonomous agent that breaks down high-level goals into concrete steps.',
      'Each step must be specific, actionable, and self-contained.',
      'Use dependencies between steps only when strictly necessary.',
      '',
      `Goal: ${goal}`,
      '',
      'Respond with a numbered list of steps. Example:',
      '1. Check current git branch status',
      '2. List all modified files',
      '3. Stage and commit the changes with a descriptive message',
      '',
      'Steps:',
    ].join('\n')

    try {
      const raw = await callLLM(prompt, config)
      const plan = parsePlanFromLLM(raw, goal)

      for (const step of plan.steps) {
        const refined = await refinePlanStep(step, config)
        step.action = refined.action
        step.params = refined.params
      }

      agentMemory.set('planner', `plan:${plan.id}`, plan)
      agentMemory.set('planner', 'activePlanId', plan.id)
      return plan
    } catch (err: any) {
      const fallback = parsePlanFromLLM('', goal)
      agentMemory.set('planner', `plan:${fallback.id}`, fallback)
      agentMemory.set('planner', 'activePlanId', fallback.id)
      return fallback
    }
  },

  async revisePlan(planId: string, failedStepId: string, error: string): Promise<Plan | null> {
    const plan = agentMemory.get<Plan>('planner', `plan:${planId}`)
    if (!plan) return null

    const config: PlannerAgentConfig = agentMemory.get('planner', 'config') || DEFAULT_CONFIG
    const retries = agentMemory.get<number>('planner', `retry:${planId}`) || 0

    if (retries >= MAX_PLAN_RETRIES) {
      plan.status = 'failed'
      plan.completedAt = new Date().toISOString()
      agentMemory.set('planner', `plan:${plan.id}`, plan)
      eventBus.emit('goal:failed', { plan, error: `Max retries (${MAX_PLAN_RETRIES}) exceeded` })
      return null
    }

    agentMemory.set('planner', `retry:${planId}`, retries + 1)

    const prompt = [
      'A step in the plan failed. Revise the remaining steps to recover.',
      '',
      `Original goal: ${plan.goal}`,
      `Failed step: ${failedStepId}`,
      `Error: ${error}`,
      '',
      'Remaining pending steps:',
      ...plan.steps.filter(s => s.status === 'pending').map(s => `- ${s.description}`),
      '',
      'Provide alternative steps to achieve the goal despite the failure.',
      'Respond with a numbered list.',
    ].join('\n')

    try {
      const raw = await callLLM(prompt, config)
      const revisedSteps = parsePlanFromLLM(raw, plan.goal).steps

      const pending = plan.steps.filter(s => s.status === 'running' || s.status === 'completed')
      plan.steps = [...pending, ...revisedSteps]
      agentMemory.set('planner', `plan:${plan.id}`, plan)
      return plan
    } catch {
      return null
    }
  },

  getPlan(planId: string): Plan | undefined {
    return agentMemory.get<Plan>('planner', `plan:${planId}`)
  },

  listPlans(): Plan[] {
    const keys = agentMemory.list('planner').filter(k => k.startsWith('plan:'))
    return keys.map(k => agentMemory.get<Plan>('planner', k)!).filter(Boolean)
  },

  completePlan(planId: string): void {
    const plan = agentMemory.get<Plan>('planner', `plan:${planId}`)
    if (!plan) return
    plan.status = 'completed'
    plan.completedAt = new Date().toISOString()
    agentMemory.set('planner', `plan:${plan.id}`, plan)
    eventBus.emit('goal:completed', { plan })
  },

  failPlan(planId: string, error: string): void {
    const plan = agentMemory.get<Plan>('planner', `plan:${planId}`)
    if (!plan) return
    plan.status = 'failed'
    plan.completedAt = new Date().toISOString()
    agentMemory.set('planner', `plan:${plan.id}`, plan)
    eventBus.emit('goal:failed', { plan, error })
  },
}
