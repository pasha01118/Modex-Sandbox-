import type { IncomingMessage, ServerResponse } from 'node:http'
import { totalmem, cpus, platform, arch } from 'node:os'

const OLLAMA_BASE = 'http://127.0.0.1:11434'

const MODEL_SUGGESTIONS = [
  { name: 'llama3.2:1b', size: '1.0B', minRamGB: 1 },
  { name: 'qwen2.5:0.5b', size: '0.5B', minRamGB: 0.5 },
  { name: 'qwen2.5:1.5b', size: '1.5B', minRamGB: 1.5 },
  { name: 'phi3.5:3.8b', size: '3.8B', minRamGB: 3 },
  { name: 'gemma2:2b', size: '2B', minRamGB: 2 },
  { name: 'tinyllama:1.1b', size: '1.1B', minRamGB: 1 },
  { name: 'stablelm2:1.6b', size: '1.6B', minRamGB: 1.5 },
  { name: 'smollm2:1.7b', size: '1.7B', minRamGB: 1.5 },
  { name: 'llama3.2:3b', size: '3B', minRamGB: 3 },
]

function setJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown> | null> {
  const rawBody = await new Promise<string>((resolve, reject) => {
    let body = ''
    req.setEncoding('utf8')
    req.on('data', (chunk: string) => { body += chunk })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
  try {
    const parsed = JSON.parse(rawBody)
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

async function ollamaFetch(path: string, method = 'GET', body?: unknown): Promise<Response> {
  const opts: RequestInit = { method, headers: {} }
  if (body) {
    opts.headers = { 'Content-Type': 'application/json' }
    opts.body = JSON.stringify(body)
  }
  return fetch(`${OLLAMA_BASE}${path}`, opts)
}

export async function handleOllamaRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (!url.pathname.startsWith('/codex-api/ollama')) return false

  try {
    // GET /codex-api/ollama/status
    if (req.method === 'GET' && url.pathname === '/codex-api/ollama/status') {
      try {
        const ollamaRes = await ollamaFetch('/api/version')
        if (!ollamaRes.ok) throw new Error('Not reachable')
        const data = await ollamaRes.json() as { version?: string }
        setJson(res, 200, { running: true, version: data.version || 'unknown' })
      } catch {
        setJson(res, 200, { running: false })
      }
      return true
    }

    // GET /codex-api/ollama/models
    if (req.method === 'GET' && url.pathname === '/codex-api/ollama/models') {
      const ollamaRes = await ollamaFetch('/api/tags')
      if (!ollamaRes.ok) {
        setJson(res, 200, { models: [] })
        return true
      }
      const data = await ollamaRes.json() as { models?: OllamaModel[] }
      setJson(res, 200, { models: data.models || [] })
      return true
    }

    // GET /codex-api/ollama/available
    if (req.method === 'GET' && url.pathname === '/codex-api/ollama/available') {
      const searchTags = [
        'llama3.2:1b', 'llama3.2:3b',
        'qwen2.5:0.5b', 'qwen2.5:1.5b', 'qwen2.5:3b',
        'phi3.5:3.8b', 'phi3:latest',
        'gemma2:2b', 'gemma2:latest',
        'tinyllama:1.1b',
        'stablelm2:1.6b',
        'smollm2:1.7b',
      ]
      setJson(res, 200, { models: searchTags })
      return true
    }

    // GET /codex-api/ollama/device-scan
    if (req.method === 'GET' && url.pathname === '/codex-api/ollama/device-scan') {
      const memBytes = totalmem()
      const totalMemoryGB = Math.round((memBytes / (1024 ** 3)) * 10) / 10
      const cpuCores = cpus().length
      setJson(res, 200, { totalMemoryGB, cpuCores, platform: platform(), arch: arch() })
      return true
    }

    // GET /codex-api/ollama/suggestions
    if (req.method === 'GET' && url.pathname === '/codex-api/ollama/suggestions') {
      const memBytes = totalmem()
      const totalMemoryGB = (memBytes / (1024 ** 3))
      const suggestions = MODEL_SUGGESTIONS
        .filter(m => totalMemoryGB >= m.minRamGB * 2)
        .map(m => ({
          name: m.name,
          size: m.size,
          reason: `Fits device RAM (${Math.round(totalMemoryGB * 10) / 10}GB)`,
        }))
      setJson(res, 200, { suggestions })
      return true
    }

    // POST /codex-api/ollama/pull
    if (req.method === 'POST' && url.pathname === '/codex-api/ollama/pull') {
      const body = await readJsonBody(req)
      const name = typeof body?.name === 'string' && body.name.trim().length > 0 ? body.name.trim() : null
      if (!name) {
        setJson(res, 400, { error: 'Model name is required' })
        return true
      }

      const ollamaRes = await ollamaFetch('/api/pull', 'POST', { name, stream: true })
      if (!ollamaRes.ok || !ollamaRes.body) {
        setJson(res, 500, { error: 'Pull failed' })
        return true
      }

      res.statusCode = 200
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const reader = ollamaRes.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value, { stream: true })
          const lines = text.split('\n').filter(Boolean)
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line)
              res.write(`data: ${JSON.stringify(parsed)}\n\n`)
            } catch { /* skip malformed */ }
          }
        }
      } finally {
        reader.releaseLock()
      }
      res.end()
      return true
    }

    // POST /codex-api/ollama/delete
    if (req.method === 'POST' && url.pathname === '/codex-api/ollama/delete') {
      const body = await readJsonBody(req)
      const name = typeof body?.name === 'string' && body.name.trim().length > 0 ? body.name.trim() : null
      if (!name) {
        setJson(res, 400, { error: 'Model name is required' })
        return true
      }
      await ollamaFetch('/api/delete', 'DELETE', { name })
      setJson(res, 200, { ok: true })
      return true
    }

    // POST /codex-api/ollama/generate
    if (req.method === 'POST' && url.pathname === '/codex-api/ollama/generate') {
      const body = await readJsonBody(req)
      const model = typeof body?.model === 'string' ? body.model : ''
      const prompt = typeof body?.prompt === 'string' ? body.prompt : ''
      if (!model || !prompt) {
        setJson(res, 400, { error: 'Model and prompt are required' })
        return true
      }
      const ollamaRes = await ollamaFetch('/api/generate', 'POST', { model, prompt, stream: false })
      if (!ollamaRes.ok) {
        setJson(res, 500, { error: 'Generation failed' })
        return true
      }
      const data = await ollamaRes.json()
      setJson(res, 200, data)
      return true
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    setJson(res, 500, { error: message })
    return true
  }

  return false
}

interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
  details?: {
    parameter_size: string
    quantization_level: string
    family: string
    families: string[]
  }
}
