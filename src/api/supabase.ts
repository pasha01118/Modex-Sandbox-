export interface SupabaseConfigPayload {
  projectUrl: string
  anonKey: string
  serviceKey: string
}

export interface SupabaseConfigStatus {
  configured: boolean
  projectUrl?: string
  anonKey?: string
  serviceKey?: string
}

export interface SchemaInfo {
  name: string
  [key: string]: unknown
}

export interface TableInfo {
  name: string
  schema: string
  [key: string]: unknown
}

export interface AuthUser {
  id: string
  email?: string
  created_at: string
  last_sign_in_at?: string
  [key: string]: unknown
}

export interface StorageBucket {
  id: string
  name: string
  public: boolean
  [key: string]: unknown
}

export interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface ApiResult<T = unknown> {
  success?: boolean
  error?: string
  data?: T
  [key: string]: unknown
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json() as T
  return body
}

export function supabaseSetConfig(config: SupabaseConfigPayload): Promise<{ ok?: boolean; error?: string }> {
  return apiFetch('/codex-api/supabase/set-config', {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export function supabaseGetConfig(): Promise<SupabaseConfigStatus> {
  return apiFetch('/codex-api/supabase/config')
}

export function supabaseTestConnection(): Promise<{ connected: boolean; message?: string }> {
  return apiFetch('/codex-api/supabase/test-connection', {
    method: 'POST',
  })
}

export function supabaseListSchemas(): Promise<ApiResult<SchemaInfo[]>> {
  return apiFetch('/codex-api/supabase/schemas')
}

export function supabaseListTables(schema: string = 'public'): Promise<ApiResult<TableInfo[]>> {
  return apiFetch(`/codex-api/supabase/tables?schema=${encodeURIComponent(schema)}`)
}

export function supabaseGetTableData(
  schema: string,
  table: string,
  page: number = 0,
  pageSize: number = 50,
): Promise<{ success?: boolean; data?: unknown[]; count?: number; error?: string }> {
  return apiFetch('/codex-api/supabase/table-data', {
    method: 'POST',
    body: JSON.stringify({ schema, table, page, pageSize }),
  })
}

export function supabaseRunSql(query: string): Promise<ApiResult> {
  return apiFetch('/codex-api/supabase/sql', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
}

export function supabaseListAuthUsers(page: number = 1, perPage: number = 50): Promise<{
  success?: boolean
  users?: AuthUser[]
  total?: number
  error?: string
}> {
  return apiFetch(`/codex-api/supabase/auth/users?page=${page}&perPage=${perPage}`)
}

export function supabaseListBuckets(): Promise<{
  success?: boolean
  buckets?: StorageBucket[]
  error?: string
}> {
  return apiFetch('/codex-api/supabase/storage/buckets')
}

export function supabaseListFiles(bucket: string, path: string = ''): Promise<{
  success?: boolean
  files?: StorageFile[]
  error?: string
}> {
  return apiFetch('/codex-api/supabase/storage/files', {
    method: 'POST',
    body: JSON.stringify({ bucket, path }),
  })
}
