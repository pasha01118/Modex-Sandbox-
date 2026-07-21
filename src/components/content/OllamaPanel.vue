<template>
  <div class="ollama-panel">
    <!-- Connection status -->
    <div class="ollama-header">
      <div class="ollama-header-left">
        <span class="ollama-status-dot" :class="ollamaRunning ? 'is-online' : 'is-offline'" />
        <h2 class="ollama-title">Ollama</h2>
        <span v-if="ollamaRunning" class="ollama-badge">Connected</span>
        <span v-else class="ollama-badge ollama-badge-offline">Offline</span>
      </div>
      <div class="ollama-header-right">
        <button class="ollama-btn ollama-btn-secondary" @click="onRefresh">Refresh</button>
        <a class="ollama-link" href="https://ollama.com/download" target="_blank" rel="noreferrer">Install Ollama</a>
      </div>
    </div>

    <p v-if="!ollamaRunning" class="ollama-offline-msg">
      Ollama is not running. Install it from
      <a href="https://ollama.com/download" target="_blank" rel="noreferrer">ollama.com</a>,
      start the service, and click Refresh.
    </p>

    <template v-if="ollamaRunning">
      <!-- Device info bar -->
      <div class="ollama-device-bar" v-if="deviceInfo">
        <span>💻 {{ deviceInfo.platform }} / {{ deviceInfo.arch }}</span>
        <span>🧠 {{ deviceInfo.totalMemoryGB }} GB RAM</span>
        <span>⚡ {{ deviceInfo.cpuCores }} cores</span>
      </div>

      <!-- Suggestions -->
      <section v-if="suggestions.length > 0" class="ollama-section">
        <h3 class="ollama-section-title">Suggested Models for Your Device</h3>
        <p class="ollama-section-desc">Based on {{ deviceInfo?.totalMemoryGB }}GB RAM — click to pull & download.</p>
        <div class="ollama-suggestion-grid">
          <button
            v-for="s in suggestions"
            :key="s.name"
            class="ollama-suggestion-card"
            :disabled="pullingModel === s.name"
            @click="onPullModel(s.name)"
          >
            <strong class="ollama-suggestion-name">{{ s.name }}</strong>
            <span class="ollama-suggestion-size">{{ s.size }}</span>
            <span class="ollama-suggestion-reason">{{ s.reason }}</span>
          </button>
        </div>
      </section>

      <!-- Local models -->
      <section class="ollama-section">
        <h3 class="ollama-section-title">
          Local Models
          <span class="ollama-count-badge">{{ localModels.length }}</span>
        </h3>
        <div v-if="localModels.length === 0" class="ollama-empty">No models downloaded yet. Pull one above or manually below.</div>
        <div v-else class="ollama-model-list">
          <div v-for="m in localModels" :key="m.name" class="ollama-model-row">
            <div class="ollama-model-info">
              <strong class="ollama-model-name">{{ m.name }}</strong>
              <span class="ollama-model-meta">
                {{ formatSize(m.size) }}
                <template v-if="m.details?.parameter_size"> · {{ m.details.parameter_size }}</template>
                <template v-if="m.details?.quantization_level"> · {{ m.details.quantization_level }}</template>
              </span>
            </div>
            <div class="ollama-model-actions">
              <button class="ollama-btn ollama-btn-small" @click="onTestModel(m.name)">Test</button>
              <button class="ollama-btn ollama-btn-small ollama-btn-danger" @click="onDeleteModel(m.name)">Delete</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Manual pull -->
      <section class="ollama-section">
        <h3 class="ollama-section-title">Pull a Model</h3>
        <div class="ollama-pull-row">
          <input
            v-model="manualModelName"
            class="ollama-input"
            type="text"
            placeholder="e.g. llama3.2:1b, qwen2.5:0.5b"
            @keydown.enter="onPullModel(manualModelName)"
          />
          <button
            class="ollama-btn ollama-btn-primary"
            :disabled="!manualModelName.trim() || !!pullingModel"
            @click="onPullModel(manualModelName)"
          >
            {{ pullingModel ? `Pulling ${pullingModel}…` : 'Pull' }}
          </button>
        </div>
        <!-- Progress bar -->
        <div v-if="pullProgress" class="ollama-progress">
          <div class="ollama-progress-bar">
            <div class="ollama-progress-fill" :style="{ width: pullProgressPercent + '%' }" />
          </div>
          <span class="ollama-progress-text">{{ pullProgress }}</span>
        </div>
      </section>

      <!-- Quick test chat -->
      <section v-if="testModel" class="ollama-section">
        <h3 class="ollama-section-title">Test: {{ testModel }}</h3>
        <div class="ollama-test-row">
          <input
            v-model="testPrompt"
            class="ollama-input"
            type="text"
            placeholder="Enter a prompt…"
            @keydown.enter="onRunTest"
          />
          <button
            class="ollama-btn ollama-btn-primary"
            :disabled="!testPrompt.trim() || isGenerating"
            @click="onRunTest"
          >
            {{ isGenerating ? 'Generating…' : 'Generate' }}
          </button>
        </div>
        <div v-if="testResult" class="ollama-test-result">{{ testResult }}</div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  checkOllamaStatus,
  listLocalModels,
  scanDevice,
  getSuggestions,
  pullModel,
  deleteModel,
  generateCompletion,
  type OllamaModel,
  type DeviceInfo,
  type SuggestedModel,
} from '../../api/ollama'

const ollamaRunning = ref(false)
const ollamaVersion = ref('')
const localModels = ref<OllamaModel[]>([])
const deviceInfo = ref<DeviceInfo | null>(null)
const suggestions = ref<SuggestedModel[]>([])
const pullingModel = ref('')
const pullProgress = ref('')
const pullProgressPercent = ref(0)
const manualModelName = ref('')
const testModel = ref('')
const testPrompt = ref('')
const testResult = ref('')
const isGenerating = ref(false)

async function onRefresh() {
  try {
    const status = await checkOllamaStatus()
    ollamaRunning.value = status.running
    ollamaVersion.value = status.version || ''
    if (status.running) {
      const [modelsRes, device, sugg] = await Promise.all([
        listLocalModels(),
        scanDevice(),
        getSuggestions(),
      ])
      localModels.value = modelsRes.models || []
      deviceInfo.value = device
      suggestions.value = sugg.suggestions || []
    }
  } catch {
    ollamaRunning.value = false
  }
}

async function onPullModel(name: string) {
  const modelName = name.trim()
  if (!modelName || pullingModel.value) return
  pullingModel.value = modelName
  pullProgress.value = 'Starting…'
  pullProgressPercent.value = 0
  try {
    const body = await pullModel(modelName)
    const reader = body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      for (const line of text.split('\n').filter(Boolean)) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.slice(6))
          if (data.status) pullProgress.value = data.status
          if (data.completed != null && data.total != null) {
            pullProgressPercent.value = Math.round((data.completed / data.total) * 100)
          }
          if (data.status === 'success') {
            pullProgress.value = 'Done!'
            pullProgressPercent.value = 100
          }
        } catch { /* skip */ }
      }
    }
    await onRefresh()
  } catch (e) {
    pullProgress.value = `Error: ${e instanceof Error ? e.message : String(e)}`
  } finally {
    pullingModel.value = ''
    manualModelName.value = ''
    setTimeout(() => { pullProgress.value = ''; pullProgressPercent.value = 0 }, 3000)
  }
}

async function onDeleteModel(name: string) {
  if (!confirm(`Delete ${name}?`)) return
  try {
    await deleteModel(name)
    await onRefresh()
  } catch (e) {
    alert(`Failed: ${e instanceof Error ? e.message : String(e)}`)
  }
}

async function onTestModel(name: string) {
  testModel.value = name
  testPrompt.value = ''
  testResult.value = ''
}

async function onRunTest() {
  if (!testPrompt.value.trim() || !testModel.value) return
  isGenerating.value = true
  testResult.value = ''
  try {
    testResult.value = await generateCompletion(testModel.value, testPrompt.value)
  } catch (e) {
    testResult.value = `Error: ${e instanceof Error ? e.message : String(e)}`
  } finally {
    isGenerating.value = false
  }
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' GB'
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(1) + ' MB'
  return (bytes / 1024).toFixed(1) + ' KB'
}

onMounted(onRefresh)
</script>

<style scoped>
.ollama-panel {
  padding: 24px 32px;
  max-width: 900px;
}

.ollama-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.ollama-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ollama-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ollama-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ollama-status-dot.is-online {
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e88;
}

.ollama-status-dot.is-offline {
  background: #ef4444;
  box-shadow: 0 0 6px #ef444488;
}

.ollama-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.ollama-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 99px;
  background: #22c55e20;
  color: #22c55e;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.ollama-badge-offline {
  background: #ef444420;
  color: #ef4444;
}

.ollama-offline-msg {
  color: color-mix(in srgb, currentColor 60%, transparent);
  font-size: 0.9rem;
}

.ollama-link {
  font-size: 0.85rem;
  color: var(--link, #6366f1);
}

.ollama-device-bar {
  display: flex;
  gap: 16px;
  padding: 10px 14px;
  background: color-mix(in srgb, currentColor 5%, transparent);
  border-radius: 8px;
  font-size: 0.82rem;
  margin-bottom: 20px;
  color: color-mix(in srgb, currentColor 65%, transparent);
}

.ollama-section {
  margin-bottom: 28px;
}

.ollama-section-title {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ollama-section-desc {
  margin: 0 0 12px;
  font-size: 0.82rem;
  color: color-mix(in srgb, currentColor 55%, transparent);
}

.ollama-count-badge {
  font-size: 0.7rem;
  background: color-mix(in srgb, currentColor 12%, transparent);
  padding: 0 7px;
  border-radius: 99px;
  font-weight: 600;
}

.ollama-empty {
  font-size: 0.85rem;
  color: color-mix(in srgb, currentColor 45%, transparent);
  padding: 12px 0;
}

.ollama-suggestion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.ollama-suggestion-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
}

.ollama-suggestion-card:hover:not(:disabled) {
  border-color: #6366f1;
  background: #6366f108;
}

.ollama-suggestion-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ollama-suggestion-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.ollama-suggestion-size {
  font-size: 0.78rem;
  color: color-mix(in srgb, currentColor 50%, transparent);
}

.ollama-suggestion-reason {
  font-size: 0.75rem;
  color: color-mix(in srgb, currentColor 40%, transparent);
}

.ollama-model-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ollama-model-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 6px;
}

.ollama-model-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.ollama-model-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.ollama-model-meta {
  font-size: 0.78rem;
  color: color-mix(in srgb, currentColor 50%, transparent);
}

.ollama-model-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.ollama-pull-row {
  display: flex;
  gap: 8px;
}

.ollama-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-size: 0.9rem;
  outline: none;
}

.ollama-input:focus {
  border-color: #6366f1;
}

.ollama-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
  background: transparent;
  color: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
}

.ollama-btn-primary {
  background: #6366f1;
  color: #fff;
  border-color: #6366f1;
}

.ollama-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ollama-btn-secondary:hover {
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.ollama-btn-small {
  padding: 4px 10px;
  font-size: 0.78rem;
}

.ollama-btn-danger {
  color: #ef4444;
  border-color: #ef444444;
}

.ollama-btn-danger:hover {
  background: #ef444410;
}

.ollama-test-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.ollama-test-result {
  padding: 10px 14px;
  background: color-mix(in srgb, currentColor 5%, transparent);
  border-radius: 6px;
  font-size: 0.85rem;
  white-space: pre-wrap;
  line-height: 1.5;
}

.ollama-progress {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ollama-progress-bar {
  flex: 1;
  height: 6px;
  background: color-mix(in srgb, currentColor 10%, transparent);
  border-radius: 99px;
  overflow: hidden;
}

.ollama-progress-fill {
  height: 100%;
  background: #6366f1;
  border-radius: 99px;
  transition: width 0.3s;
}

.ollama-progress-text {
  font-size: 0.78rem;
  color: color-mix(in srgb, currentColor 50%, transparent);
  min-width: 80px;
}

:root.dark .ollama-input {
  border-color: rgba(255,255,255,0.15);
}

:root.dark .ollama-suggestion-card {
  border-color: rgba(255,255,255,0.1);
}

:root.dark .ollama-model-row {
  border-color: rgba(255,255,255,0.08);
}
</style>
