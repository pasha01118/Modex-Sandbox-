<template>
  <div class="socket-panel">
    <template v-if="!hasApiKey">
      <div class="socket-setup">
        <IconTablerShieldCheck class="socket-setup-icon" />
        <h2 class="socket-setup-title">Socket.dev Security</h2>
        <p class="socket-setup-desc">
          Scan npm packages for malware, vulnerabilities, and license issues before using them in your project.
          Enter your Socket.dev API key to get started.
        </p>
        <div class="socket-setup-form">
          <input
            v-model="apiKeyInput"
            class="socket-setup-input"
            type="password"
            placeholder="Enter your Socket.dev API key"
            @keydown.enter.prevent="onSaveApiKey"
          />
          <button
            class="socket-setup-button"
            :disabled="!apiKeyInput.trim() || isSavingKey"
            @click="onSaveApiKey"
          >
            {{ isSavingKey ? 'Saving…' : 'Save Key' }}
          </button>
        </div>
        <p v-if="setupError" class="socket-setup-error">{{ setupError }}</p>
        <a
          class="socket-setup-link"
          href="https://socket.dev"
          target="_blank"
          rel="noreferrer"
        >
          Get a free API key at socket.dev
        </a>
      </div>
    </template>

    <template v-else>
      <div class="socket-dashboard">
        <div class="socket-header">
          <div class="socket-header-left">
            <IconTablerShieldCheck class="socket-header-icon" />
            <h2 class="socket-header-title">Socket Security</h2>
          </div>
          <div class="socket-header-right">
            <span class="socket-key-badge" :title="'Key: ' + maskedKey">API Key Configured</span>
            <button class="socket-reset-key" title="Reset API key" @click="onResetKey">Reset Key</button>
          </div>
        </div>

        <div class="socket-quota" v-if="quota">
          <div class="socket-quota-item">
            <span class="socket-quota-label">Quota</span>
            <span class="socket-quota-value">{{ formatQuota(quota) }}</span>
          </div>
        </div>

        <div class="socket-search-section">
          <h3 class="socket-section-title">Package Security Check</h3>
          <div class="socket-search-form">
            <input
              v-model="pkgName"
              class="socket-search-input"
              type="text"
              placeholder="Package name (e.g. express)"
              @keydown.enter.prevent="onSearchPackage"
            />
            <input
              v-model="pkgVersion"
              class="socket-search-input socket-search-input-sm"
              type="text"
              placeholder="Version (e.g. 4.18.2)"
              @keydown.enter.prevent="onSearchPackage"
            />
            <button
              class="socket-search-button"
              :disabled="!pkgName.trim() || isSearching"
              @click="onSearchPackage"
            >
              {{ isSearching ? 'Scanning…' : 'Scan Package' }}
            </button>
          </div>

          <div v-if="searchError" class="socket-error">{{ searchError }}</div>

          <div v-if="scoreResult && !isSearching" class="socket-result">
            <div class="socket-score-card">
              <div class="socket-score-header">
                <span class="socket-score-label">Security Score</span>
                <span
                  class="socket-score-badge"
                  :class="scoreClass"
                >
                  {{ scoreResult?.depscore ?? 'N/A' }}
                </span>
              </div>
              <div class="socket-score-bar">
                <div
                  class="socket-score-fill"
                  :class="scoreClass"
                  :style="{ width: Math.min(100, (scoreResult?.depscore ?? 0)) + '%' }"
                />
              </div>
            </div>

            <div v-if="issues && issues.length > 0" class="socket-issues">
              <h4 class="socket-issues-title">Issues ({{ issues.length }})</h4>
              <div
                v-for="(issue, idx) in issues"
                :key="idx"
                class="socket-issue-row"
                :class="'socket-issue-' + (issue.severity || 'unknown').toLowerCase()"
              >
                <span class="socket-issue-severity">{{ issue.severity || 'UNKNOWN' }}</span>
                <span class="socket-issue-title">{{ issue.title || issue.key || 'Unknown issue' }}</span>
              </div>
            </div>
            <p v-else-if="issues && issues.length === 0" class="socket-clean">
              No security issues found for this package.
            </p>
          </div>

          <div v-if="isSearching" class="socket-loading">
            <IconTablerShieldCheck class="socket-loading-icon" />
            <p>Scanning package for vulnerabilities…</p>
          </div>

          <div class="socket-batch-section" v-if="false">
            <h3 class="socket-section-title">Batch Scan</h3>
            <p class="socket-batch-hint">
              Enter multiple packages as <code>name@version</code> (one per line):
            </p>
            <textarea
              v-model="batchInput"
              class="socket-batch-input"
              rows="4"
              placeholder="express@4.18.2&#10;react@18.2.0&#10;lodash@4.17.21"
            />
            <button
              class="socket-search-button"
              :disabled="!batchInput.trim() || isBatchScanning"
              @click="onBatchScan"
            >
              {{ isBatchScanning ? 'Scanning…' : 'Batch Scan' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import IconTablerShieldCheck from '../icons/IconTablerShieldCheck.vue'
import {
  socketSetApiKey,
  socketGetConfig,
  socketGetQuota,
  socketGetScore,
  socketGetIssues,
} from '../../api/socketSecurity'

const hasApiKey = ref(false)
const maskedKey = ref('')
const apiKeyInput = ref('')
const isSavingKey = ref(false)
const setupError = ref('')

const pkgName = ref('')
const pkgVersion = ref('')
const isSearching = ref(false)
const searchError = ref('')
const scoreResult = ref<{ depscore?: number } | null>(null)
const issues = ref<Array<{ severity?: string; title?: string; key?: string }> | null>(null)
const quota = ref<unknown>(null)

const batchInput = ref('')
const isBatchScanning = ref(false)

const scoreClass = computed(() => {
  const score = scoreResult.value?.depscore ?? 0
  if (score >= 80) return 'score-high'
  if (score >= 50) return 'score-mid'
  return 'score-low'
})

function formatQuota(q: any): string {
  if (!q) return 'Unknown'
  if (q.remaining !== undefined && q.limit !== undefined) {
    return `${q.remaining} / ${q.limit}`
  }
  if (q.quota !== undefined) {
    return String(q.quota)
  }
  return JSON.stringify(q).slice(0, 60)
}

async function loadConfig(): Promise<void> {
  try {
    const config = await socketGetConfig()
    if (config.apiKey) {
      hasApiKey.value = true
      maskedKey.value = config.apiKey
    }
  } catch {
    // No config yet
  }
}

async function loadQuota(): Promise<void> {
  try {
    const result = await socketGetQuota()
    if (result.success) {
      quota.value = result.data
    }
  } catch {
    // Quota unavailable
  }
}

async function onSaveApiKey(): Promise<void> {
  const key = apiKeyInput.value.trim()
  if (!key) return
  isSavingKey.value = true
  setupError.value = ''
  try {
    await socketSetApiKey(key)
    hasApiKey.value = true
    maskedKey.value = key.slice(0, 4) + '…' + key.slice(-4)
    apiKeyInput.value = ''
    await loadQuota()
  } catch (err) {
    setupError.value = err instanceof Error ? err.message : 'Failed to save API key'
  } finally {
    isSavingKey.value = false
  }
}

function onResetKey(): void {
  hasApiKey.value = false
  maskedKey.value = ''
  scoreResult.value = null
  issues.value = null
  quota.value = null
  socketSetApiKey('').catch(() => {})
}

async function onSearchPackage(): Promise<void> {
  const name = pkgName.value.trim()
  const version = pkgVersion.value.trim()
  if (!name || !version) return

  isSearching.value = true
  searchError.value = ''
  scoreResult.value = null
  issues.value = null

  try {
    const [scoreRes, issuesRes] = await Promise.all([
      socketGetScore(name, version),
      socketGetIssues(name, version),
    ])
    if (scoreRes.success && scoreRes.data) {
      scoreResult.value = scoreRes.data
    } else {
      searchError.value = scoreRes.error || 'Failed to fetch score'
    }
    if (issuesRes.success && Array.isArray(issuesRes.data)) {
      issues.value = issuesRes.data
    }
  } catch (err) {
    searchError.value = err instanceof Error ? err.message : 'Search failed'
  } finally {
    isSearching.value = false
  }
}

async function onBatchScan(): Promise<void> {
  // Placeholder for batch scan
}

onMounted(async () => {
  await loadConfig()
  if (hasApiKey.value) {
    await loadQuota()
  }
})
</script>

<style scoped>
@reference "tailwindcss";
.socket-panel {
  @apply flex h-full flex-col p-6;
  min-height: 0;
}

.socket-setup {
  @apply mx-auto mt-16 flex max-w-md flex-col items-center gap-4 text-center;
}

.socket-setup-icon {
  @apply h-12 w-12 text-zinc-400;
}

.socket-setup-title {
  @apply m-0 text-xl font-semibold text-zinc-900;
}

.socket-setup-desc {
  @apply m-0 text-sm leading-6 text-zinc-600;
}

.socket-setup-form {
  @apply flex w-full gap-2;
}

.socket-setup-input {
  @apply flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500;
}

.socket-setup-button {
  @apply shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40;
}

.socket-setup-error {
  @apply m-0 text-sm text-red-600;
}

.socket-setup-link {
  @apply text-sm text-zinc-500 underline underline-offset-2 transition hover:text-zinc-700;
}

.socket-dashboard {
  @apply flex flex-1 flex-col gap-4;
  min-height: 0;
}

.socket-header {
  @apply flex items-center justify-between;
}

.socket-header-left {
  @apply flex items-center gap-2;
}

.socket-header-icon {
  @apply h-6 w-6 text-zinc-500;
}

.socket-header-title {
  @apply m-0 text-lg font-semibold text-zinc-900;
}

.socket-header-right {
  @apply flex items-center gap-2;
}

.socket-key-badge {
  @apply rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700;
}

.socket-reset-key {
  @apply rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50;
}

.socket-quota {
  @apply flex gap-3;
}

.socket-quota-item {
  @apply rounded-lg border border-zinc-200 bg-white px-3 py-2;
}

.socket-quota-label {
  @apply text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500;
}

.socket-quota-value {
  @apply text-sm font-medium text-zinc-900;
}

.socket-search-section {
  @apply flex flex-col gap-3;
}

.socket-section-title {
  @apply m-0 text-sm font-semibold text-zinc-800;
}

.socket-search-form {
  @apply flex gap-2;
}

.socket-search-input {
  @apply flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500;
}

.socket-search-input-sm {
  @apply max-w-36;
}

.socket-search-button {
  @apply shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40;
}

.socket-error {
  @apply rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700;
}

.socket-result {
  @apply flex flex-col gap-3;
}

.socket-score-card {
  @apply flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4;
}

.socket-score-header {
  @apply flex items-center justify-between;
}

.socket-score-label {
  @apply text-sm font-medium text-zinc-700;
}

.socket-score-badge {
  @apply rounded-md px-2 py-0.5 text-xs font-bold;
}

.socket-score-badge.score-high {
  @apply bg-emerald-100 text-emerald-800;
}

.socket-score-badge.score-mid {
  @apply bg-amber-100 text-amber-800;
}

.socket-score-badge.score-low {
  @apply bg-red-100 text-red-800;
}

.socket-score-bar {
  @apply h-2 w-full overflow-hidden rounded-full bg-zinc-100;
}

.socket-score-fill {
  @apply h-full rounded-full transition-all duration-300;
}

.socket-score-fill.score-high {
  @apply bg-emerald-500;
}

.socket-score-fill.score-mid {
  @apply bg-amber-500;
}

.socket-score-fill.score-low {
  @apply bg-red-500;
}

.socket-issues {
  @apply flex flex-col gap-2;
}

.socket-issues-title {
  @apply m-0 text-sm font-semibold text-zinc-800;
}

.socket-issue-row {
  @apply flex items-center gap-2 rounded-lg border px-3 py-2 text-sm;
}

.socket-issue-critical,
.socket-issue-high {
  @apply border-red-200 bg-red-50;
}

.socket-issue-medium,
.socket-issue-moderate {
  @apply border-amber-200 bg-amber-50;
}

.socket-issue-low {
  @apply border-zinc-200 bg-zinc-50;
}

.socket-issue-severity {
  @apply shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase;
}

.socket-issue-critical .socket-issue-severity,
.socket-issue-high .socket-issue-severity {
  @apply bg-red-200 text-red-800;
}

.socket-issue-medium .socket-issue-severity,
.socket-issue-moderate .socket-issue-severity {
  @apply bg-amber-200 text-amber-800;
}

.socket-issue-low .socket-issue-severity {
  @apply bg-zinc-200 text-zinc-700;
}

.socket-issue-title {
  @apply text-zinc-800;
}

.socket-clean {
  @apply m-0 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700;
}

.socket-loading {
  @apply flex flex-col items-center gap-2 py-8 text-zinc-500;
}

.socket-loading-icon {
  @apply h-8 w-8 animate-pulse text-zinc-400;
}

.socket-loading p {
  @apply m-0 text-sm;
}

.socket-batch-section {
  @apply flex flex-col gap-3;
}

.socket-batch-hint {
  @apply m-0 text-xs text-zinc-500;
}

.socket-batch-hint code {
  @apply rounded bg-zinc-100 px-1 py-0.5 text-xs font-mono text-zinc-700;
}

.socket-batch-input {
  @apply w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500;
}
</style>
