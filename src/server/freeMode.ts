import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { secretsVault } from './secretsVault.js'

// Community keys are now loaded from encrypted file at runtime
// Run: node scripts/encrypt-community-keys.js (once after first build)
const COMMUNITY_KEYS_FILE = 'community-keys.enc'
let cachedCommunityKeys: string[] | null = null

function getCodexHome(): string {
  const codexHome = process.env.CODEX_HOME?.trim()
  return codexHome && codexHome.length > 0 ? codexHome : join(homedir(), '.codex')
}

function loadCommunityKeys(): string[] {
  if (cachedCommunityKeys) return cachedCommunityKeys

  const codexHome = getCodexHome()
  const encPath = join(codexHome, COMMUNITY_KEYS_FILE)

  if (!existsSync(encPath)) {
    console.warn(`[free-mode] Community keys not found at ${encPath}`)
    console.warn('[free-mode] Run: node scripts/encrypt-community-keys.js')
    cachedCommunityKeys = []
    return cachedCommunityKeys
  }

  try {
    const raw = readFileSync(encPath, 'utf-8')
    const payload = JSON.parse(raw)
    const decrypted = secretsVault.decryptString(payload)
    const keys = JSON.parse(decrypted) as string[]
    cachedCommunityKeys = Array.isArray(keys) ? keys.filter(k => typeof k === 'string' && k.length > 0) : []
    console.log(`[free-mode] Loaded ${cachedCommunityKeys.length} community keys from encrypted vault`)
  } catch (err) {
    console.warn('[free-mode] Failed to decrypt community keys:', (err as Error).message)
    cachedCommunityKeys = []
  }

  return cachedCommunityKeys
}

export function getRandomFreeKey(): string | null {
  const keys = loadCommunityKeys()
  if (keys.length === 0) return null
  const idx = Math.floor(Math.random() * keys.length)
  return keys[idx]!
}

export function getFreeKeyCount(): number {
  return loadCommunityKeys().length
}

export const FREE_MODE_PROVIDER_ID = 'openrouter-free'
export const FREE_MODE_BASE_URL = 'https://openrouter.ai/api/v1'
const FREE_MODE_RUNTIME_PROVIDER_ID = 'openrouter_free'

const FALLBACK_FREE_MODELS = [
  'openrouter/free',
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-coder:free',
]

let cachedFreeModels: string[] | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 10 * 60 * 1000
let freeModelsRefreshPromise: Promise<string[]> | null = null

async function fetchFreeModelsFromOpenRouter(): Promise<string[]> {
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/models')
    if (!resp.ok) return cachedFreeModels ?? FALLBACK_FREE_MODELS
    const json = (await resp.json()) as { data: Array<{ id: string }> }
    const ids = json.data
      .filter((m) => m.id.endsWith(':free') || m.id === 'openrouter/free')
      .map((m) => m.id)
    if (ids.length === 0) return cachedFreeModels ?? FALLBACK_FREE_MODELS
    const sorted = ['openrouter/free', ...ids.filter((id) => id !== 'openrouter/free')]
    cachedFreeModels = sorted
    cacheTimestamp = Date.now()
    return sorted
  } catch {
    return cachedFreeModels ?? FALLBACK_FREE_MODELS
  }
}

export async function getFreeModels(): Promise<string[]> {
  if (cachedFreeModels && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedFreeModels
  }
  return fetchFreeModelsFromOpenRouter()
}

export function getCachedFreeModels(): string[] {
  return cachedFreeModels ?? FALLBACK_FREE_MODELS
}

export function refreshFreeModelsInBackground(): void {
  if (cachedFreeModels && Date.now() - cacheTimestamp < CACHE_TTL_MS) return
  if (freeModelsRefreshPromise) return
  freeModelsRefreshPromise = fetchFreeModelsFromOpenRouter()
    .finally(() => {
      freeModelsRefreshPromise = null
    })
}

export const FREE_MODE_DEFAULT_MODEL = 'openrouter/free'

export const FREE_MODE_STATE_FILE = 'webui-custom-providers.json'

export const CUSTOM_PROVIDER_ID = 'custom-endpoint'
export const OPENCODE_ZEN_PROVIDER_ID = 'opencode-zen'
const CUSTOM_RUNTIME_PROVIDER_ID = 'custom_endpoint'
const OPENCODE_ZEN_RUNTIME_PROVIDER_ID = 'opencode_zen'
export const OPENCODE_ZEN_BASE_URL = 'https://opencode.ai/zen/v1'
export const OPENCODE_ZEN_DEFAULT_MODEL = 'big-pickle'

export type WireApi = 'responses' | 'chat'

export interface FreeModeState {
  enabled: boolean
  apiKey: string | null
  model: string
  customKey?: boolean
  provider?: 'openrouter' | 'custom' | 'opencode-zen'
  customBaseUrl?: string
  wireApi?: WireApi
  providerKeys?: Record<string, string>
}

export function createDefaultOpenRouterFreeModeState(): FreeModeState | null {
  const apiKey = getRandomFreeKey()
  if (!apiKey) return null
  return {
    enabled: true,
    apiKey,
    model: FREE_MODE_DEFAULT_MODEL,
    customKey: false,
    provider: 'openrouter',
    wireApi: 'responses',
    providerKeys: {
      openrouter: apiKey,
    },
  }
}

export function createDefaultOpenCodeZenFreeModeState(): FreeModeState {
  return {
    enabled: true,
    apiKey: null,
    model: OPENCODE_ZEN_DEFAULT_MODEL,
    customKey: false,
    provider: 'opencode-zen',
    wireApi: 'responses',
    providerKeys: {},
  }
}

export function shouldCreateDefaultFreeModeStateForMissingAuth(
  current: FreeModeState | null,
  hasUsableCodexAuth: boolean,
): boolean {
  return current == null && !hasUsableCodexAuth
}

export function shouldSuppressCommunityFreeModeForCodexAuth(
  current: FreeModeState | null,
  hasUsableCodexAuth: boolean,
): boolean {
  if (!hasUsableCodexAuth || !current?.enabled) return false
  if (current.provider === 'custom') return false
  if (current.customKey === true) return false
  if (current.provider === 'opencode-zen' && current.apiKey?.trim()) return false
  return current.provider === 'openrouter' || current.provider === 'opencode-zen' || !current.provider
}

export function shouldMarkOpenRouterKeyAsCustom(
  current: FreeModeState | null,
  explicitApiKey: string,
): boolean {
  if (explicitApiKey.trim().length > 0) return true
  return current?.provider === 'openrouter' && current.customKey === true
}

export function getFreeModeEnvVars(state: FreeModeState): Record<string, string> {
  if (!state.enabled) return {}

  if (state.provider === 'opencode-zen' && state.apiKey) {
    return { OPENCODE_ZEN_API_KEY: state.apiKey }
  }

  if (state.provider === 'custom' && state.customBaseUrl && state.apiKey) {
    return { CUSTOM_ENDPOINT_API_KEY: state.apiKey }
  }

  return {}
}

export function filterOpenCodeZenModelsForAuthState(modelIds: string[], apiKey: string | null | undefined): string[] {
  if (apiKey?.trim()) return modelIds
  return modelIds.filter((id) => id === OPENCODE_ZEN_DEFAULT_MODEL || id.endsWith('-free'))
}

function getOpenCodeZenProviderConfigArgs(serverPort?: number): string[] {
  const providerConfigKey = `model_providers.${OPENCODE_ZEN_RUNTIME_PROVIDER_ID}`
  const baseUrl = serverPort
    ? `http://127.0.0.1:${serverPort}/codex-api/zen-proxy/v1`
    : OPENCODE_ZEN_BASE_URL
  const authArgs: string[] = serverPort
    ? ['-c', `${providerConfigKey}.experimental_bearer_token="zen-proxy-token"`]
    : ['-c', `${providerConfigKey}.env_key="OPENCODE_ZEN_API_KEY"`]

  return [
    '-c', `${providerConfigKey}.name="OpenCode Zen"`,
    '-c', `${providerConfigKey}.base_url="${baseUrl}"`,
    '-c', `${providerConfigKey}.wire_api="responses"`,
    ...authArgs,
  ]
}

export function getProviderCompatibilityConfigArgs(serverPort?: number): string[] {
  return getOpenCodeZenProviderConfigArgs(serverPort)
}

export function getFreeModeConfigArgs(state: FreeModeState, serverPort?: number): string[] {
  if (!state.enabled) return []

  if (state.provider === 'opencode-zen') {
    const model = state.model?.trim() || OPENCODE_ZEN_DEFAULT_MODEL
    return [
      '-c', `model="${model}"`,
      '-c', `model_provider="${OPENCODE_ZEN_RUNTIME_PROVIDER_ID}"`,
      ...getOpenCodeZenProviderConfigArgs(serverPort),
    ]
  }

  if (state.provider === 'custom' && state.customBaseUrl) {
    const providerConfigKey = `model_providers.${CUSTOM_RUNTIME_PROVIDER_ID}`
    const baseUrl = serverPort
      ? `http://127.0.0.1:${serverPort}/codex-api/custom-proxy/v1`
      : state.customBaseUrl
    const wireApi = serverPort ? 'responses' : (state.wireApi || 'responses')
    const authArgs: string[] = serverPort
      ? ['-c', `${providerConfigKey}.experimental_bearer_token="custom-proxy-token"`]
      : ['-c', `${providerConfigKey}.env_key="CUSTOM_ENDPOINT_API_KEY"`]
    const modelArgs: string[] = state.model?.trim()
      ? ['-c', `model="${state.model.trim()}"`]
      : []
    return [
      ...modelArgs,
      '-c', `model_provider="${CUSTOM_RUNTIME_PROVIDER_ID}"`,
      '-c', `${providerConfigKey}.name="Custom Endpoint"`,
      '-c', `${providerConfigKey}.base_url="${baseUrl}"`,
      '-c', `${providerConfigKey}.wire_api="${wireApi}"`,
      ...authArgs,
    ]
  }

  if (!state.apiKey) return []
  const providerConfigKey = `model_providers.${FREE_MODE_RUNTIME_PROVIDER_ID}`
  const baseUrl = serverPort
    ? `http://127.0.0.1:${serverPort}/codex-api/openrouter-proxy/v1`
    : FREE_MODE_BASE_URL
  const bearerToken = serverPort ? 'openrouter-proxy-token' : state.apiKey
  return [
    '-c', `model="${state.model}"`,
    '-c', `model_provider="${FREE_MODE_RUNTIME_PROVIDER_ID}"`,
    '-c', `${providerConfigKey}.name="OpenRouter Free"`,
    '-c', `${providerConfigKey}.base_url="${baseUrl}"`,
    '-c', `${providerConfigKey}.wire_api="responses"`,
    '-c', `${providerConfigKey}.experimental_bearer_token="${bearerToken}"`,
  ]
}
