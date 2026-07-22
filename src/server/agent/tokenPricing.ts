export interface ModelPricing {
  provider: string
  model: string
  inputPer1k: number
  outputPer1k: number
  isFree: boolean
}

const PRICING_TABLE: Record<string, ModelPricing> = {}

function reg(provider: string, model: string, inputPer1k: number, outputPer1k: number, isFree = false) {
  PRICING_TABLE[`${provider}:${model}`] = { provider, model, inputPer1k, outputPer1k, isFree }
}

reg('ollama', 'llama3.2', 0, 0, true)
reg('ollama', 'llama3.2:1b', 0, 0, true)
reg('ollama', 'qwen2.5', 0, 0, true)
reg('ollama', 'qwen2.5:0.5b', 0, 0, true)
reg('ollama', 'qwen2.5:1.5b', 0, 0, true)
reg('ollama', 'phi3.5', 0, 0, true)
reg('ollama', 'gemma2', 0, 0, true)
reg('ollama', 'mistral', 0, 0, true)
reg('ollama', 'codellama', 0, 0, true)
reg('ollama', 'deepseek-coder', 0, 0, true)
reg('ollama', 'default', 0, 0, true)

reg('openrouter', 'openai/gpt-4o', 2.50, 10.00)
reg('openrouter', 'openai/gpt-4o-mini', 0.15, 0.60)
reg('openrouter', 'openai/gpt-4.1', 2.00, 8.00)
reg('openrouter', 'openai/gpt-4.1-mini', 0.40, 1.60)
reg('openrouter', 'openai/gpt-4.1-nano', 0.10, 0.40)
reg('openrouter', 'anthropic/claude-sonnet-4', 3.00, 15.00)
reg('openrouter', 'anthropic/claude-3.5-sonnet', 3.00, 15.00)
reg('openrouter', 'anthropic/claude-3-haiku', 0.25, 1.25)
reg('openrouter', 'google/gemini-2.5-pro', 1.25, 10.00)
reg('openrouter', 'google/gemini-2.5-flash', 0.15, 0.60)
reg('openrouter', 'deepseek/deepseek-chat', 0.14, 0.28)
reg('openrouter', 'deepseek/deepseek-r1', 0.55, 2.19)
reg('openrouter', 'meta-llama/llama-3.3-70b-instruct', 0.10, 0.10)
reg('openrouter', 'qwen/qwen3-235b-a22b', 0.20, 0.60)

reg('codex', 'o3', 10.00, 40.00)
reg('codex', 'o4-mini', 1.10, 4.40)
reg('codex', 'gpt-4.1', 2.00, 8.00)
reg('codex', 'gpt-4.1-mini', 0.40, 1.60)
reg('codex', 'gpt-4.1-nano', 0.10, 0.40)

reg('zen', 'default', 0, 0)

export function getModelPricing(provider: string, model: string): ModelPricing {
  const key = `${provider}:${model}`
  if (PRICING_TABLE[key]) return PRICING_TABLE[key]
  const fallback = PRICING_TABLE[`${provider}:default`]
  if (fallback) return fallback
  if (provider === 'ollama') return { provider, model, inputPer1k: 0, outputPer1k: 0, isFree: true }
  return { provider, model, inputPer1k: 0, outputPer1k: 0, isFree: false }
}

export function estimateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
  const pricing = getModelPricing(provider, model)
  if (pricing.isFree) return 0
  return (inputTokens / 1000) * pricing.inputPer1k + (outputTokens / 1000) * pricing.outputPer1k
}

export function listPricing(): ModelPricing[] {
  return Object.values(PRICING_TABLE)
}
