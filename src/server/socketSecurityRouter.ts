import type { IncomingMessage, ServerResponse } from 'node:http'
import { SocketSdk } from '@socketsecurity/sdk'
import { readFileSync } from 'node:fs'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const SOCKET_CONFIG_PATH = join(homedir(), '.codex', 'socket-security-config.json')

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

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
  return asRecord(rawBody.length > 0 ? JSON.parse(rawBody) : {})
}

interface SocketConfig {
  apiKey: string
}

function readConfig(): SocketConfig | null {
  try {
    const raw = readFileSync(SOCKET_CONFIG_PATH, 'utf8')
    return JSON.parse(raw) as SocketConfig
  } catch {
    return null
  }
}

function getClient(): SocketSdk {
  const config = readConfig()
  const apiKey = config?.apiKey?.trim()
  if (!apiKey) {
    throw new Error('Socket.dev API key not configured. Set one in the Socket Security tab.')
  }
  return new SocketSdk(apiKey, {
    retries: 2,
    retryDelay: 500,
    timeout: 15000,
  })
}

export async function handleSocketSecurityRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (!url.pathname.startsWith('/codex-api/socket-security')) {
    return false
  }

  try {
    if (req.method === 'POST' && url.pathname === '/codex-api/socket-security/set-key') {
      const body = await readJsonBody(req)
      const apiKey = readString(body?.apiKey)
      if (!apiKey) {
        setJson(res, 400, { error: 'API key is required' })
        return true
      }
      await mkdir(dirname(SOCKET_CONFIG_PATH), { recursive: true })
      await writeFile(SOCKET_CONFIG_PATH, JSON.stringify({ apiKey }), { encoding: 'utf8', mode: 0o600 })
      setJson(res, 200, { ok: true })
      return true
    }

    if (req.method === 'GET' && url.pathname === '/codex-api/socket-security/config') {
      const config = readConfig()
      const masked = config?.apiKey
        ? config.apiKey.slice(0, 4) + '…' + config.apiKey.slice(-4)
        : null
      setJson(res, 200, { apiKey: masked })
      return true
    }

    if (req.method === 'GET' && url.pathname === '/codex-api/socket-security/quota') {
      const config = readConfig()
      if (!config?.apiKey) {
        setJson(res, 400, { success: false, error: 'API key not configured' })
        return true
      }
      const client = new SocketSdk(config.apiKey)
      const result = await client.getQuota()
      if (result.success) {
        setJson(res, 200, { success: true, data: result.data })
      } else {
        setJson(res, 400, { success: false, error: result.error, cause: result.cause })
      }
      return true
    }

    if (req.method === 'POST' && url.pathname === '/codex-api/socket-security/score') {
      const body = await readJsonBody(req)
      const name = readString(body?.name)
      const version = readString(body?.version)
      if (!name || !version) {
        setJson(res, 400, { error: 'Package name and version are required' })
        return true
      }
      const client = getClient()
      const result = await client.getScoreByNpmPackage(name, version)
      if (result.success) {
        setJson(res, 200, { success: true, data: result.data })
      } else {
        setJson(res, 400, { success: false, error: result.error, cause: result.cause })
      }
      return true
    }

    if (req.method === 'POST' && url.pathname === '/codex-api/socket-security/issues') {
      const body = await readJsonBody(req)
      const name = readString(body?.name)
      const version = readString(body?.version)
      if (!name || !version) {
        setJson(res, 400, { error: 'Package name and version are required' })
        return true
      }
      const client = getClient()
      const result = await client.getIssuesByNpmPackage(name, version)
      if (result.success) {
        setJson(res, 200, { success: true, data: result.data })
      } else {
        setJson(res, 400, { success: false, error: result.error, cause: result.cause })
      }
      return true
    }

    if (req.method === 'POST' && url.pathname === '/codex-api/socket-security/batch') {
      const body = await readJsonBody(req)
      const rawPackages = body && Array.isArray(body.packages) ? body.packages : []
      if (rawPackages.length === 0) {
        setJson(res, 400, { error: 'At least one package is required' })
        return true
      }
      const client = getClient()
      const components: Array<{ purl: string }> = []
      for (const pkg of rawPackages) {
        const record = asRecord(pkg)
        const name = readString(record?.name)
        const version = readString(record?.version)
        if (name && version) {
          components.push({ purl: `pkg:npm/${name}@${version}` })
        }
      }
      if (components.length === 0) {
        setJson(res, 400, { error: 'No valid package entries provided' })
        return true
      }
      const result = await client.batchPackageFetch({ components })
      if (result.success) {
        setJson(res, 200, { success: true, data: result.data })
      } else {
        setJson(res, 400, { success: false, error: result.error, cause: result.cause })
      }
      return true
    }

    if (req.method === 'POST' && url.pathname === '/codex-api/socket-security/malware-check') {
      const body = await readJsonBody(req)
      const rawPackages = body && Array.isArray(body.packages) ? body.packages : []
      if (rawPackages.length === 0) {
        setJson(res, 400, { error: 'At least one package is required' })
        return true
      }
      const client = getClient()
      const components: Array<{ purl: string }> = []
      for (const pkg of rawPackages) {
        const record = asRecord(pkg)
        const name = readString(record?.name)
        const version = readString(record?.version)
        if (name && version) {
          components.push({ purl: `pkg:npm/${name}@${version}` })
        }
      }
      if (components.length === 0) {
        setJson(res, 400, { error: 'No valid package entries provided' })
        return true
      }
      const result = await client.checkMalware(components)
      if (typeof result === 'object' && result !== null && 'success' in result && (result as Record<string, unknown>).success) {
        setJson(res, 200, { success: true, data: (result as Record<string, unknown>).data })
      } else if (typeof result === 'object' && result !== null && 'error' in result) {
        setJson(res, 400, { success: false, error: String((result as Record<string, unknown>).error) })
      } else {
        setJson(res, 200, { success: true, data: result })
      }
      return true
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    setJson(res, 500, { success: false, error: message })
    return true
  }

  return false
}
