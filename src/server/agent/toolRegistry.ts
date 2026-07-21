import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

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

function run(cmd: string, cwd?: string): string {
  return execSync(cmd, {
    cwd: cwd || process.cwd(),
    timeout: 30_000,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  }).trim()
}

function define(t: ToolDefinition): void {
  tools.set(t.name, t)
}

define({
  name: 'executeCommand',
  description: 'Run a shell command and return its output',
  parameters: [
    { name: 'command', type: 'string', description: 'The shell command to execute', required: true },
    { name: 'cwd', type: 'string', description: 'Working directory', required: false },
  ],
  async execute(params) {
    return run(params.command, params.cwd)
  },
})

define({
  name: 'readFile',
  description: 'Read the full contents of a file',
  parameters: [
    { name: 'path', type: 'string', description: 'Absolute file path', required: true },
  ],
  async execute(params) {
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
    return run('git status --short', params.cwd)
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
    run('git add -A', params.cwd)
    return run(`git commit -m ${JSON.stringify(params.message)}`, params.cwd)
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
    const n = params.count || 10
    return run(`git log --oneline -${n}`, params.cwd)
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
    const ext = params.include ? `--include '${params.include}'` : ''
    return run(`grep -rn ${ext} '${params.pattern}' ${dir} | head -100`, params.cwd || process.cwd())
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
