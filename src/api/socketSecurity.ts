export interface SocketScoreResult {
  depscore?: number
  [key: string]: unknown
}

export interface SocketIssue {
  key?: string
  title?: string
  severity?: string
  [key: string]: unknown
}

export interface SocketPackageLookup {
  name: string
  version: string
}

export async function socketSetApiKey(apiKey: string): Promise<void> {
  const res = await fetch('/codex-api/socket-security/set-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to save API key' }))
    throw new Error(err.error || 'Failed to save API key')
  }
}

export async function socketGetConfig(): Promise<{ apiKey: string | null }> {
  const res = await fetch('/codex-api/socket-security/config')
  if (!res.ok) return { apiKey: null }
  return res.json()
}

export async function socketGetQuota(): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const res = await fetch('/codex-api/socket-security/quota')
  return res.json()
}

export async function socketGetScore(name: string, version: string): Promise<{ success: boolean; data?: SocketScoreResult; error?: string }> {
  const res = await fetch('/codex-api/socket-security/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, version }),
  })
  return res.json()
}

export async function socketGetIssues(name: string, version: string): Promise<{ success: boolean; data?: SocketIssue[]; error?: string }> {
  const res = await fetch('/codex-api/socket-security/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, version }),
  })
  return res.json()
}

export async function socketBatchFetch(packages: SocketPackageLookup[]): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const res = await fetch('/codex-api/socket-security/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packages }),
  })
  return res.json()
}

export async function socketCheckMalware(packages: SocketPackageLookup[]): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const res = await fetch('/codex-api/socket-security/malware-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packages }),
  })
  return res.json()
}
