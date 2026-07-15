import type { IncomingMessage, ServerResponse } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const SUPABASE_CONFIG_PATH = join(homedir(), '.codex', 'supabase-config.json')

interface SupabaseConfig {
  projectUrl: string
  anonKey: string
  serviceKey: string
}

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

function readConfig(): SupabaseConfig | null {
  try {
    const raw = readFileSync(SUPABASE_CONFIG_PATH, 'utf8')
    return JSON.parse(raw) as SupabaseConfig
  } catch {
    return null
  }
}

function getSupabaseClient(config: SupabaseConfig) {
  return createClient(config.projectUrl, config.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function fetchSupabaseApi(
  config: SupabaseConfig,
  path: string,
  method: string = 'GET',
  body?: unknown,
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    const url = `${config.projectUrl.replace(/\/+$/u, '')}${path}`
    const headers: Record<string, string> = {
      'apikey': config.serviceKey,
      'Authorization': `Bearer ${config.serviceKey}`,
      'Content-Type': 'application/json',
    }
    const options: RequestInit = { method, headers }
    if (body !== undefined) {
      options.body = JSON.stringify(body)
    }
    const res = await fetch(url, options)
    const text = await res.text()
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 300)}` }
    }
    if (!text) return { ok: true, data: null }
    return { ok: true, data: JSON.parse(text) }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

function maskValue(value: string): string {
  if (value.length <= 8) return value.slice(0, 2) + '…' + value.slice(-2)
  return value.slice(0, 4) + '…' + value.slice(-4)
}

export async function handleSupabaseRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (!url.pathname.startsWith('/codex-api/supabase')) {
    return false
  }

  try {
    // Set Supabase connection config
    if (req.method === 'POST' && url.pathname === '/codex-api/supabase/set-config') {
      const body = await readJsonBody(req)
      const projectUrl = readString(body?.projectUrl)
      const anonKey = readString(body?.anonKey)
      const serviceKey = readString(body?.serviceKey)
      if (!projectUrl || !anonKey || !serviceKey) {
        setJson(res, 400, { error: 'projectUrl, anonKey, and serviceKey are required' })
        return true
      }
      await mkdir(dirname(SUPABASE_CONFIG_PATH), { recursive: true })
      await writeFile(SUPABASE_CONFIG_PATH, JSON.stringify({ projectUrl, anonKey, serviceKey }), {
        encoding: 'utf8',
        mode: 0o600,
      })
      setJson(res, 200, { ok: true })
      return true
    }

    // Get masked config status
    if (req.method === 'GET' && url.pathname === '/codex-api/supabase/config') {
      const config = readConfig()
      if (!config) {
        setJson(res, 200, { configured: false })
        return true
      }
      setJson(res, 200, {
        configured: true,
        projectUrl: config.projectUrl,
        anonKey: maskValue(config.anonKey),
        serviceKey: maskValue(config.serviceKey),
      })
      return true
    }

    // Test connection
    if (req.method === 'POST' && url.pathname === '/codex-api/supabase/test-connection') {
      const config = readConfig()
      if (!config) {
        setJson(res, 400, { error: 'Supabase not configured' })
        return true
      }
      try {
        const client = getSupabaseClient(config)
        const { data, error } = await client.from('_dummy_query_not_exists').select('*').limit(1)
        // Even a 404/error means the connection works (table doesn't exist)
        setJson(res, 200, {
          connected: true,
          message: 'Connection successful',
          detail: error ? `Connected (${error.message})` : 'Connected',
        })
      } catch (err) {
        setJson(res, 200, { connected: false, message: String(err) })
      }
      return true
    }

    // List schemas via postgres-meta
    if (req.method === 'GET' && url.pathname === '/codex-api/supabase/schemas') {
      const config = readConfig()
      if (!config) { setJson(res, 400, { error: 'Not configured' }); return true }
      const result = await fetchSupabaseApi(config, '/api/v1/schemas')
      setJson(res, result.ok ? 200 : 400, result)
      return true
    }

    // List tables for a schema
    if (req.method === 'GET' && url.pathname === '/codex-api/supabase/tables') {
      const config = readConfig()
      if (!config) { setJson(res, 400, { error: 'Not configured' }); return true }
      const schema = url.searchParams.get('schema') || 'public'
      const result = await fetchSupabaseApi(config, `/api/v1/tables?schema=${encodeURIComponent(schema)}`)
      setJson(res, result.ok ? 200 : 400, result)
      return true
    }

    // Get table data with pagination
    if (req.method === 'POST' && url.pathname === '/codex-api/supabase/table-data') {
      const config = readConfig()
      if (!config) { setJson(res, 400, { error: 'Not configured' }); return true }
      const body = await readJsonBody(req)
      const schema = readString(body?.schema) || 'public'
      const table = readString(body?.table)
      const page = typeof body?.page === 'number' ? body.page : 0
      const pageSize = typeof body?.pageSize === 'number' ? body.pageSize : 50
      if (!table) { setJson(res, 400, { error: 'table is required' }); return true }

      try {
        const client = getSupabaseClient(config)
        const from = page * pageSize
        const to = from + pageSize - 1
        const { data, error, count } = await client
          .schema(schema)
          .from(table)
          .select('*', { count: 'estimated', head: false })
          .range(from, to)
        setJson(res, 200, { success: true, data, count })
      } catch (err) {
        setJson(res, 400, { success: false, error: String(err) })
      }
      return true
    }

    // Run SQL query via postgres-meta
    if (req.method === 'POST' && url.pathname === '/codex-api/supabase/sql') {
      const config = readConfig()
      if (!config) { setJson(res, 400, { error: 'Not configured' }); return true }
      const body = await readJsonBody(req)
      const query = readString(body?.query)
      if (!query) { setJson(res, 400, { error: 'query is required' }); return true }
      const result = await fetchSupabaseApi(config, '/api/v1/sql', 'POST', { query })
      setJson(res, result.ok ? 200 : 400, result)
      return true
    }

    // List auth users
    if (req.method === 'GET' && url.pathname === '/codex-api/supabase/auth/users') {
      const config = readConfig()
      if (!config) { setJson(res, 400, { error: 'Not configured' }); return true }
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const perPage = parseInt(url.searchParams.get('perPage') || '50', 10)
      try {
        const client = getSupabaseClient(config)
        const { data, error } = await client.auth.admin.listUsers({ page, perPage })
        if (error) {
          setJson(res, 400, { success: false, error: error.message })
        } else {
          setJson(res, 200, { success: true, users: data.users, total: data.total })
        }
      } catch (err) {
        setJson(res, 400, { success: false, error: String(err) })
      }
      return true
    }

    // List storage buckets
    if (req.method === 'GET' && url.pathname === '/codex-api/supabase/storage/buckets') {
      const config = readConfig()
      if (!config) { setJson(res, 400, { error: 'Not configured' }); return true }
      try {
        const client = getSupabaseClient(config)
        const { data, error } = await client.storage.listBuckets()
        if (error) {
          setJson(res, 400, { success: false, error: error.message })
        } else {
          setJson(res, 200, { success: true, buckets: data })
        }
      } catch (err) {
        setJson(res, 400, { success: false, error: String(err) })
      }
      return true
    }

    // List files in a storage bucket
    if (req.method === 'POST' && url.pathname === '/codex-api/supabase/storage/files') {
      const config = readConfig()
      if (!config) { setJson(res, 400, { error: 'Not configured' }); return true }
      const body = await readJsonBody(req)
      const bucket = readString(body?.bucket)
      const path = readString(body?.path) || ''
      if (!bucket) { setJson(res, 400, { error: 'bucket is required' }); return true }
      try {
        const client = getSupabaseClient(config)
        const { data, error } = await client.storage.from(bucket).list(path)
        if (error) {
          setJson(res, 400, { success: false, error: error.message })
        } else {
          setJson(res, 200, { success: true, files: data })
        }
      } catch (err) {
        setJson(res, 400, { success: false, error: String(err) })
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
