export interface OllamaModel {
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

export interface DeviceInfo {
  totalMemoryGB: number
  cpuCores: number
  platform: string
  arch: string
}

export interface SuggestedModel {
  name: string
  size: string
  reason: string
}

export interface OllamaPullProgress {
  status: string
  completed?: number
  total?: number
  digest?: string
}

export async function checkOllamaStatus(): Promise<{ running: boolean; version?: string }> {
  const res = await fetch('/codex-api/ollama/status')
  return res.json()
}

export async function listLocalModels(): Promise<{ models: OllamaModel[] }> {
  const res = await fetch('/codex-api/ollama/models')
  return res.json()
}

export async function listAvailableModels(): Promise<{ models: string[] }> {
  const res = await fetch('/codex-api/ollama/available')
  return res.json()
}

export async function pullModel(name: string): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch('/codex-api/ollama/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok || !res.body) throw new Error('Failed to pull model')
  return res.body
}

export async function deleteModel(name: string): Promise<void> {
  const res = await fetch('/codex-api/ollama/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to delete model')
}

export async function scanDevice(): Promise<DeviceInfo> {
  const res = await fetch('/codex-api/ollama/device-scan')
  return res.json()
}

export async function getSuggestions(): Promise<{ suggestions: SuggestedModel[] }> {
  const res = await fetch('/codex-api/ollama/suggestions')
  return res.json()
}

export async function generateCompletion(model: string, prompt: string): Promise<string> {
  const res = await fetch('/codex-api/ollama/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt }),
  })
  if (!res.ok) throw new Error('Generation failed')
  const data = await res.json()
  return data.response || ''
}
