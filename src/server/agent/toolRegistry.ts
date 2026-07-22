import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, relative, resolve, isAbsolute } from 'node:path'
import { homedir } from 'node:os'

interface ToolParam {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array'
  description: string
  required?: boolean
}

interface ToolDefinition {
  name: string
  description: string
  parameters: ToolParam[]
  execute: (params: Record<string, any>) => Promise<any>
}

const tools = new Map<string, ToolDefinition>()

const BLOCKED_PATHS = ['/etc', '/root', '/proc', '/sys']

function isPathSafe(filePath: string): boolean {
  const resolved = resolve(filePath)
  for (const blocked of BLOCKED_PATHS) {
    if (resolved.startsWith(blocked)) return false
  }
  if (resolved.includes('/../')) return false
  return true
}

function runSafe(command: string, args: string[], cwd?: string): string {
  return execFileSync(command, args, {
    cwd: cwd || process.cwd(),
    timeout: 30_000,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  }).trim()
}

function parseCommand(cmd: string): { command: string; args: string[] } {
  const tokens: string[] = []
  let current = ''
  let inQuote = false
  for (const ch of cmd) {
    if (ch === '"') { inQuote = !inQuote; continue }
    if (ch === ' ' && !inQuote) {
      if (current) { tokens.push(current); current = '' }
      continue
    }
    current += ch
  }
  if (current) tokens.push(current)
  if (tokens.length === 0) throw new Error('Empty command')
  return { command: tokens[0]!, args: tokens.slice(1) }
}

function define(t: ToolDefinition): void {
  tools.set(t.name, t)
}

define({
  name: 'executeCommand',
  description: 'Run a command and return its output (piped shell features disabled for security)',
  parameters: [
    { name: 'command', type: 'string', description: 'Command with arguments', required: true },
    { name: 'cwd', type: 'string', description: 'Working directory', required: false },
  ],
  async execute(params) {
    const parsed = parseCommand(params.command)
    return runSafe(parsed.command, parsed.args, params.cwd)
  },
})

define({
  name: 'readFile',
  description: 'Read the full contents of a file',
  parameters: [
    { name: 'path', type: 'string', description: 'Absolute file path', required: true },
  ],
  async execute(params) {
    if (!isPathSafe(params.path)) throw new Error('Access denied: path not allowed')
    if (!existsSync(params.path)) throw new Error(`File not found: ${params.path}`)
    return readFileSync(params.path, 'utf-8')
  },
})

define({
  name: 'writeFile',
  description: 'Write content to a file',
  parameters: [
    { name: 'path', type: 'string', description: 'Absolute file path', required: true },
    { name: 'content', type: 'string', description: 'Content to write', required: true },
  ],
  async execute(params) {
    if (!isPathSafe(params.path)) throw new Error('Access denied: path not allowed')
    writeFileSync(params.path, params.content, 'utf-8')
    return `Written ${params.content.length} bytes to ${params.path}`
  },
})

define({
  name: 'listDirectory',
  description: 'List files and directories in a path',
  parameters: [
    { name: 'path', type: 'string', description: 'Directory path', required: true },
  ],
  async execute(params) {
    if (!isPathSafe(params.path)) throw new Error('Access denied: path not allowed')
    const entries = await readdir(params.path, { withFileTypes: true })
    return entries.map(e => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      isFile: e.isFile(),
      isSymlink: e.isSymbolicLink(),
    }))
  },
})

define({
  name: 'gitStatus',
  description: 'Show git working tree status',
  parameters: [
    { name: 'cwd', type: 'string', description: 'Git repository path', required: false },
  ],
  async execute(params) {
    return runSafe('git', ['status', '--short'], params.cwd)
  },
})

define({
  name: 'gitCommit',
  description: 'Stage all changes and commit',
  parameters: [
    { name: 'message', type: 'string', description: 'Commit message', required: true },
    { name: 'cwd', type: 'string', description: 'Git repository path', required: false },
  ],
  async execute(params) {
    runSafe('git', ['add', '-A'], params.cwd)
    return runSafe('git', ['commit', '-m', params.message], params.cwd)
  },
})

define({
  name: 'gitLog',
  description: 'Show recent git log',
  parameters: [
    { name: 'count', type: 'number', description: 'Number of commits', required: false },
    { name: 'cwd', type: 'string', description: 'Git repository path', required: false },
  ],
  async execute(params) {
    const n = Math.min(Math.max(Number(params.count) || 10, 1), 100)
    return runSafe('git', ['log', '--oneline', `-${n}`], params.cwd)
  },
})

define({
  name: 'searchCode',
  description: 'Search file contents for a pattern',
  parameters: [
    { name: 'pattern', type: 'string', description: 'Regex or text to search for', required: true },
    { name: 'path', type: 'string', description: 'Directory to search', required: false },
    { name: 'include', type: 'string', description: 'File pattern (e.g. *.ts)', required: false },
  ],
  async execute(params) {
    const dir = params.path || '.'
    if (!isPathSafe(dir)) throw new Error('Access denied: path not allowed')
    const args = ['-rn', '--max-count=100']
    if (params.include) args.push(`--include=${params.include}`)
    args.push(params.pattern, dir)
    return runSafe('grep', args, params.cwd || process.cwd())
  },
})

define({
  name: 'globFiles',
  description: 'Find files matching a glob pattern (simple **/*.ext only)',
  parameters: [
    { name: 'pattern', type: 'string', description: 'Glob pattern (e.g. **/*.ts)', required: true },
    { name: 'path', type: 'string', description: 'Root directory', required: false },
  ],
  async execute(params) {
    const root = params.path || process.cwd()
    const pattern = params.pattern
    const ext = pattern.includes('.') ? pattern.split('.').pop()?.replace('*', '') : ''
    const recursive = pattern.startsWith('**/')

    const { readdirSync, statSync } = await import('node:fs')
    const { join, relative } = await import('node:path')

    const results: string[] = []
    function walk(dir: string) {
      let entries: string[]
      try { entries = readdirSync(dir) } catch { return }
      for (const e of entries) {
        const fp = join(dir, e)
        try {
          const s = statSync(fp)
          if (s.isDirectory() && recursive) walk(fp)
          else if (s.isFile() && (!ext || e.endsWith(`.${ext}`))) results.push(relative(root, fp))
        } catch { /* skip */ }
      }
    }
    walk(root)
    return results
  },
})

define({
  name: 'readEnv',
  description: 'Read an environment variable',
  parameters: [
    { name: 'name', type: 'string', description: 'Environment variable name', required: true },
  ],
  async execute(params) {
    // Block sensitive env vars using regex pattern
    const SENSITIVE_ENV_REGEX = /KEY|TOKEN|SECRET|PASSWORD|AUTH|CREDENTIAL|API|_KEY|_SECRET|_TOKEN|_PASS/i
    if (SENSITIVE_ENV_REGEX.test(params.name)) return '(redacted)'
    return process.env[params.name] || '(not set)'
  },
})

define({
  name: 'readJson',
  description: 'Read and parse a JSON file',
  parameters: [
    { name: 'path', type: 'string', description: 'JSON file path', required: true },
  ],
  async execute(params) {
    if (!isPathSafe(params.path)) throw new Error('Access denied: path not allowed')
    if (!existsSync(params.path)) throw new Error(`File not found: ${params.path}`)
    return JSON.parse(readFileSync(params.path, 'utf-8'))
  },
})

define({
  name: 'writeJson',
  description: 'Write a JSON object to a file',
  parameters: [
    { name: 'path', type: 'string', description: 'JSON file path', required: true },
    { name: 'data', type: 'string', description: 'JSON string to write', required: true },
  ],
  async execute(params) {
    if (!isPathSafe(params.path)) throw new Error('Access denied: path not allowed')
    const data = typeof params.data === 'string' ? JSON.parse(params.data) : params.data
    writeFileSync(params.path, JSON.stringify(data, null, 2), 'utf-8')
    return `Written to ${params.path}`
  },
})

export const toolRegistry = {
  get(name: string): ToolDefinition | undefined {
    return tools.get(name)
  },

  list(): ToolDefinition[] {
    return Array.from(tools.values())
  },

  async execute(name: string, params: Record<string, any>): Promise<any> {
    const tool = tools.get(name)
    if (!tool) throw new Error(`Unknown tool: ${name}`)
    return tool.execute(params)
  },
}

export type { ToolDefinition, ToolParam }
