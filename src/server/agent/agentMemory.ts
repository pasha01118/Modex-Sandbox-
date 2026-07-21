import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const MEMORY_DIR = join(homedir(), '.codex', 'agent-memory')

function ensureDir(): void {
  if (!existsSync(MEMORY_DIR)) mkdirSync(MEMORY_DIR, { recursive: true })
}

function filePath(namespace: string): string {
  return join(MEMORY_DIR, `${namespace.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`)
}

function read(namespace: string): Record<string, any> {
  ensureDir()
  const fp = filePath(namespace)
  if (!existsSync(fp)) return {}
  try {
    return JSON.parse(readFileSync(fp, 'utf-8'))
  } catch {
    return {}
  }
}

function write(namespace: string, data: Record<string, any>): void {
  ensureDir()
  writeFileSync(filePath(namespace), JSON.stringify(data, null, 2), 'utf-8')
}

export const agentMemory = {
  get<T = any>(namespace: string, key: string): T | undefined {
    const store = read(namespace)
    return store[key] as T | undefined
  },

  set(namespace: string, key: string, value: any): void {
    const store = read(namespace)
    store[key] = value
    write(namespace, store)
  },

  delete(namespace: string, key: string): void {
    const store = read(namespace)
    delete store[key]
    write(namespace, store)
  },

  list(namespace: string): string[] {
    return Object.keys(read(namespace))
  },

  clear(namespace: string): void {
    write(namespace, {})
  },

  getAll<T = any>(namespace: string): Record<string, T> {
    return read(namespace) as Record<string, T>
  },

  listNamespaces(): string[] {
    ensureDir()
    return readdirSync(MEMORY_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''))
  },

  deleteNamespace(namespace: string): void {
    const fp = filePath(namespace)
    if (existsSync(fp)) unlinkSync(fp)
  },
}
