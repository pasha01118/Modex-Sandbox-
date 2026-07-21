import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { eventBus } from './eventBus.js'

const QUEUE_FILE = join(homedir(), '.codex', 'agent-tasks.json')

export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface Task {
  id: string
  type: string
  goalId: string
  agentId: string
  priority: number
  status: TaskStatus
  input: string
  output?: string
  error?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  retryCount: number
  maxRetries: number
  dependsOn: string[]
}

interface QueueStore {
  tasks: Task[]
  maxConcurrency: number
}

function load(): QueueStore {
  if (!existsSync(QUEUE_FILE)) return { tasks: [], maxConcurrency: 3 }
  try {
    return JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'))
  } catch {
    return { tasks: [], maxConcurrency: 3 }
  }
}

function save(store: QueueStore): void {
  const dir = join(homedir(), '.codex')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(QUEUE_FILE, JSON.stringify(store, null, 2), 'utf-8')
}

let runningCount = 0

export const taskQueue = {
  enqueue(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'retryCount'>): Task {
    const store = load()
    const t: Task = {
      ...task,
      id: crypto.randomUUID(),
      status: 'queued',
      createdAt: new Date().toISOString(),
      retryCount: 0,
    }
    store.tasks.push(t)
    save(store)
    eventBus.emit('task:created', { task: t })
    return t
  },

  dequeue(): Task | null {
    const store = load()
    if (runningCount >= (store.maxConcurrency || 3)) return null

    const idx = store.tasks.findIndex(
      t => t.status === 'queued' && t.dependsOn.every(d => {
        const dep = store.tasks.find(x => x.id === d)
        return dep && dep.status === 'completed'
      })
    )
    if (idx === -1) return null

    const task = store.tasks[idx]
    task.status = 'running'
    task.startedAt = new Date().toISOString()
    runningCount++
    save(store)
    eventBus.emit('task:started', { task })
    return task
  },

  complete(taskId: string, output: string): void {
    const store = load()
    const task = store.tasks.find(t => t.id === taskId)
    if (!task) return
    task.status = 'completed'
    task.output = output
    task.completedAt = new Date().toISOString()
    runningCount = Math.max(0, runningCount - 1)
    save(store)
    eventBus.emit('task:completed', { task })
  },

  fail(taskId: string, error: string): void {
    const store = load()
    const task = store.tasks.find(t => t.id === taskId)
    if (!task) return
    task.status = 'failed'
    task.error = error
    task.completedAt = new Date().toISOString()
    runningCount = Math.max(0, runningCount - 1)
    save(store)

    if (task.retryCount < task.maxRetries) {
      task.retryCount++
      task.status = 'queued'
      task.error = undefined
      task.completedAt = undefined
      save(store)
      eventBus.emit('task:created', { task, retry: true })
    } else {
      eventBus.emit('task:failed', { task, error })
    }
  },

  cancel(taskId: string): void {
    const store = load()
    const task = store.tasks.find(t => t.id === taskId)
    if (!task) return
    if (task.status === 'running') runningCount = Math.max(0, runningCount - 1)
    task.status = 'cancelled'
    task.completedAt = new Date().toISOString()
    save(store)
    eventBus.emit('task:failed', { task, error: 'Cancelled' })
  },

  retry(taskId: string): void {
    const store = load()
    const task = store.tasks.find(t => t.id === taskId)
    if (!task || task.status !== 'failed') return
    task.status = 'queued'
    task.error = undefined
    task.completedAt = undefined
    task.retryCount = 0
    save(store)
    eventBus.emit('task:created', { task, retry: true })
  },

  get(taskId: string): Task | undefined {
    return load().tasks.find(t => t.id === taskId)
  },

  list(filter?: { status?: TaskStatus; goalId?: string }): Task[] {
    const store = load()
    let result = store.tasks
    if (filter?.status) result = result.filter(t => t.status === filter.status)
    if (filter?.goalId) result = result.filter(t => t.goalId === filter.goalId)
    return result.sort((a, b) => b.priority - a.priority || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  listByGoal(goalId: string): Task[] {
    return this.list({ goalId })
  },

  recover(): void {
    const store = load()
    for (const task of store.tasks) {
      if (task.status === 'running') {
        task.status = 'queued'
        task.startedAt = undefined
      }
    }
    runningCount = 0
    save(store)
  },

  setConcurrency(n: number): void {
    const store = load()
    store.maxConcurrency = n
    save(store)
  },

  getConcurrency(): number {
    return load().maxConcurrency || 3
  },

  clearCompleted(): void {
    const store = load()
    store.tasks = store.tasks.filter(t => t.status === 'queued' || t.status === 'running')
    save(store)
  },
}
