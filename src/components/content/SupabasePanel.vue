<template>
  <div class="supabase-panel">
    <!-- Setup view -->
    <template v-if="!configured">
      <div class="supabase-setup">
        <IconTablerDatabase class="supabase-setup-icon" />
        <h2 class="supabase-setup-title">Supabase Database</h2>
        <p class="supabase-setup-desc">
          Connect to your Supabase project to browse tables, run SQL queries,
          manage auth users, and view storage — all from inside Codex.
        </p>
        <div class="supabase-setup-fields">
          <label class="supabase-setup-label">
            Project URL
            <input v-model="form.projectUrl" class="supabase-input" type="url" placeholder="https://xxx.supabase.co" />
          </label>
          <label class="supabase-setup-label">
            Anon / Public Key
            <input v-model="form.anonKey" class="supabase-input" type="text" placeholder="anon public key" />
          </label>
          <label class="supabase-setup-label">
            Service Role Key
            <input v-model="form.serviceKey" class="supabase-input" type="password" placeholder="service_role key (admin)" />
          </label>
          <button
            class="supabase-setup-button"
            :disabled="!canConnect || isConnecting"
            @click="onConnect"
          >
            {{ isConnecting ? 'Connecting…' : 'Connect to Supabase' }}
          </button>
          <p v-if="setupError" class="supabase-setup-error">{{ setupError }}</p>
        </div>
        <a class="supabase-setup-link" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
          Don't have a project? Create one at supabase.com
        </a>
      </div>
    </template>

    <!-- Dashboard view -->
    <template v-else>
      <div class="supabase-dashboard">
        <!-- Header -->
        <div class="supabase-header">
          <div class="supabase-header-left">
            <IconTablerDatabase class="supabase-header-icon" />
            <h2 class="supabase-header-title">Supabase</h2>
          </div>
          <div class="supabase-header-right">
            <span class="supabase-connected-badge">Connected</span>
            <button class="supabase-disconnect-button" @click="onDisconnect">Disconnect</button>
          </div>
        </div>

        <!-- Tab bar -->
        <div class="supabase-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="supabase-tab"
            :class="{ 'is-active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- TAB: SQL Query -->
        <div v-if="activeTab === 'sql'" class="supabase-tab-content">
          <div class="supabase-sql-toolbar">
            <textarea
              v-model="sqlQuery"
              class="supabase-sql-editor"
              rows="6"
              placeholder="SELECT * FROM pg_catalog.pg_tables LIMIT 10"
              spellcheck="false"
            />
            <div class="supabase-sql-actions">
              <button class="supabase-button" :disabled="!sqlQuery.trim() || isSqlRunning" @click="onRunSql">
                {{ isSqlRunning ? 'Running…' : 'Run Query' }}
              </button>
              <button class="supabase-button supabase-button-secondary" @click="sqlQuery = ''; sqlResult = null">
                Clear
              </button>
            </div>
          </div>
          <div v-if="sqlError" class="supabase-error">{{ sqlError }}</div>
          <div v-if="sqlResult" class="supabase-sql-result">
            <pre class="supabase-sql-output">{{ sqlResult }}</pre>
          </div>
        </div>

        <!-- TAB: Tables -->
        <div v-if="activeTab === 'tables'" class="supabase-tab-content">
          <div class="supabase-tables-toolbar">
            <label class="supabase-tables-schema-label">
              Schema
              <select v-model="selectedSchema" class="supabase-select" @change="onLoadTables">
                <option v-for="s in schemas" :key="s" :value="s">{{ s }}</option>
              </select>
            </label>
            <button class="supabase-button supabase-button-secondary" @click="onLoadSchemas">
              Refresh
            </button>
          </div>
          <div v-if="isLoadingTables" class="supabase-loading">Loading tables…</div>
          <div v-else-if="tables.length === 0" class="supabase-empty">
            No tables found in schema "{{ selectedSchema }}"
          </div>
          <div v-else class="supabase-table-list">
            <button
              v-for="t in tables"
              :key="t.name"
              class="supabase-table-row"
              :class="{ 'is-active': selectedTable?.name === t.name }"
              @click="onSelectTable(t)"
            >
              <span class="supabase-table-row-icon">
                <IconTablerDatabase />
              </span>
              <span class="supabase-table-row-name">{{ t.name }}</span>
            </button>
          </div>
        </div>

        <!-- Table data detail -->
        <div v-if="selectedTable && activeTab === 'tables'" class="supabase-tab-content">
          <div class="supabase-data-header">
            <h3 class="supabase-data-title">{{ selectedTable.name }}</h3>
            <button class="supabase-button supabase-button-secondary" @click="onLoadTableData">
              Refresh
            </button>
          </div>
          <div v-if="isLoadingData" class="supabase-loading">Loading data…</div>
          <div v-else-if="tableData.length === 0" class="supabase-empty">No rows returned</div>
          <div v-else class="supabase-data-table-wrap">
            <table class="supabase-data-table">
              <thead>
                <tr>
                  <th v-for="col in tableColumns" :key="col" class="supabase-data-th">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, ri) in tableData" :key="ri" class="supabase-data-tr">
                  <td v-for="col in tableColumns" :key="col" class="supabase-data-td">
                    {{ formatCell(row[col]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="tableCount !== null" class="supabase-data-count">
            Showing {{ tableData.length }} of ~{{ tableCount }} rows
          </div>
        </div>

        <!-- TAB: Auth Users -->
        <div v-if="activeTab === 'auth'" class="supabase-tab-content">
          <div class="supabase-auth-toolbar">
            <span class="supabase-auth-count" v-if="authTotal !== null">{{ authTotal }} total users</span>
            <button class="supabase-button supabase-button-secondary" @click="onLoadAuthUsers">Refresh</button>
          </div>
          <div v-if="isLoadingAuth" class="supabase-loading">Loading users…</div>
          <div v-else-if="authUsers.length === 0" class="supabase-empty">
            No users found
          </div>
          <div v-else class="supabase-auth-list">
            <div v-for="u in authUsers" :key="u.id" class="supabase-auth-row">
              <span class="supabase-auth-email">{{ u.email || '(no email)' }}</span>
              <span class="supabase-auth-meta">
                {{ formatDate(u.created_at) }}
                <span v-if="u.last_sign_in_at" class="supabase-auth-last-seen">
                  &middot; last seen {{ formatDate(u.last_sign_in_at) }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- TAB: Storage -->
        <div v-if="activeTab === 'storage'" class="supabase-tab-content">
          <div v-if="isLoadingBuckets" class="supabase-loading">Loading buckets…</div>
          <div v-else-if="buckets.length === 0" class="supabase-empty">No storage buckets</div>
          <div v-else class="supabase-bucket-list">
            <div
              v-for="b in buckets"
              :key="b.id"
              class="supabase-bucket-row"
              :class="{ 'is-active': selectedBucket?.id === b.id }"
              @click="onSelectBucket(b)"
            >
              <span class="supabase-bucket-name">{{ b.name }}</span>
              <span class="supabase-bucket-badge" :class="b.public ? 'badge-public' : 'badge-private'">
                {{ b.public ? 'public' : 'private' }}
              </span>
            </div>
          </div>
          <div v-if="selectedBucket && bucketFiles" class="supabase-bucket-files">
            <h4 class="supabase-bucket-files-title">{{ selectedBucket.name }} /</h4>
            <div v-if="bucketFiles.length === 0" class="supabase-empty">Empty bucket</div>
            <div v-else class="supabase-file-list">
              <div v-for="f in bucketFiles" :key="f.id || f.name" class="supabase-file-row">
                <span class="supabase-file-name">{{ f.name }}</span>
                <span class="supabase-file-meta">{{ formatDate(f.updated_at || f.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import IconTablerDatabase from '../icons/IconTablerDatabase.vue'
import {
  supabaseSetConfig,
  supabaseGetConfig,
  supabaseTestConnection,
  supabaseListSchemas,
  supabaseListTables,
  supabaseGetTableData,
  supabaseRunSql,
  supabaseListAuthUsers,
  supabaseListBuckets,
  supabaseListFiles,
  type TableInfo,
  type AuthUser,
  type StorageBucket,
  type StorageFile,
} from '../../api/supabase'

const tabs = [
  { id: 'sql', label: 'SQL Query' },
  { id: 'tables', label: 'Tables' },
  { id: 'auth', label: 'Auth' },
  { id: 'storage', label: 'Storage' },
]

const activeTab = ref('sql')

// Setup
const configured = ref(false)
const isConnecting = ref(false)
const setupError = ref('')
const form = ref({ projectUrl: '', anonKey: '', serviceKey: '' })
const projectUrl = ref('')

const canConnect = computed(() =>
  form.value.projectUrl.trim().length > 0 &&
  form.value.anonKey.trim().length > 0 &&
  form.value.serviceKey.trim().length > 0,
)

// SQL
const sqlQuery = ref('')
const isSqlRunning = ref(false)
const sqlResult = ref<string | null>(null)
const sqlError = ref('')

// Schemas & Tables
const schemas = ref<string[]>(['public'])
const selectedSchema = ref('public')
const tables = ref<TableInfo[]>([])
const isLoadingTables = ref(false)
const selectedTable = ref<TableInfo | null>(null)
const tableData = ref<Record<string, unknown>[]>([])
const tableColumns = ref<string[]>([])
const isLoadingData = ref(false)
const tableCount = ref<number | null>(null)

// Auth
const authUsers = ref<AuthUser[]>([])
const isLoadingAuth = ref(false)
const authTotal = ref<number | null>(null)

// Storage
const buckets = ref<StorageBucket[]>([])
const isLoadingBuckets = ref(false)
const selectedBucket = ref<StorageBucket | null>(null)
const bucketFiles = ref<StorageFile[] | null>(null)

function formatDate(iso: string | undefined): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 100)
  return String(val)
}

async function onConnect(): Promise<void> {
  isConnecting.value = true
  setupError.value = ''
  try {
    await supabaseSetConfig({
      projectUrl: form.value.projectUrl.trim(),
      anonKey: form.value.anonKey.trim(),
      serviceKey: form.value.serviceKey.trim(),
    })
    const test = await supabaseTestConnection()
    if (test.connected) {
      configured.value = true
      projectUrl.value = form.value.projectUrl.trim()
      await loadInitialData()
    } else {
      setupError.value = test.message || 'Connection failed'
    }
  } catch (err) {
    setupError.value = err instanceof Error ? err.message : 'Connection failed'
  } finally {
    isConnecting.value = false
  }
}

function onDisconnect(): void {
  configured.value = false
  form.value = { projectUrl: '', anonKey: '', serviceKey: '' }
  projectUrl.value = ''
  tables.value = []
  schemas.value = ['public']
  selectedSchema.value = 'public'
  selectedTable.value = null
  tableData.value = []
  authUsers.value = []
  buckets.value = []
  activeTab.value = 'sql'
}

async function loadInitialData(): Promise<void> {
  await onLoadSchemas()
  await onLoadAuthUsers()
  await onLoadBuckets()
}

async function onLoadSchemas(): Promise<void> {
  try {
    const result = await supabaseListSchemas()
    if (result.success && Array.isArray(result.data)) {
      const names = result.data.map((s: any) => s.name || s.schema_name).filter(Boolean)
      if (names.length > 0) {
        schemas.value = names
        if (!names.includes(selectedSchema.value)) {
          selectedSchema.value = names[0]
        }
      }
    }
    await onLoadTables()
  } catch {
    // Fall back to public
  }
}

async function onLoadTables(): Promise<void> {
  isLoadingTables.value = true
  selectedTable.value = null
  tableData.value = []
  try {
    const result = await supabaseListTables(selectedSchema.value)
    if (result.success && Array.isArray(result.data)) {
      tables.value = result.data as TableInfo[]
    }
  } catch {
    tables.value = []
  } finally {
    isLoadingTables.value = false
  }
}

async function onSelectTable(table: TableInfo): Promise<void> {
  selectedTable.value = table
  await onLoadTableData()
}

async function onLoadTableData(): Promise<void> {
  if (!selectedTable.value) return
  isLoadingData.value = true
  try {
    const result = await supabaseGetTableData(
      selectedSchema.value,
      selectedTable.value.name,
      0,
      50,
    )
    if (result.success && Array.isArray(result.data)) {
      tableData.value = result.data as Record<string, unknown>[]
      tableCount.value = typeof result.count === 'number' ? result.count : null
      if (result.data.length > 0) {
        tableColumns.value = Object.keys(result.data[0] as Record<string, unknown>)
      }
    } else {
      tableData.value = []
      tableColumns.value = []
      tableCount.value = null
    }
  } catch {
    tableData.value = []
    tableColumns.value = []
    tableCount.value = null
  } finally {
    isLoadingData.value = false
  }
}

async function onRunSql(): Promise<void> {
  if (!sqlQuery.value.trim()) return
  isSqlRunning.value = true
  sqlResult.value = ''
  sqlError.value = ''
  try {
    const result = await supabaseRunSql(sqlQuery.value)
    if (result.ok !== false && !result.error) {
      sqlResult.value = JSON.stringify(result.data ?? result, null, 2)
    } else {
      sqlError.value = result.error || 'Query failed'
    }
  } catch (err) {
    sqlError.value = err instanceof Error ? err.message : 'Query failed'
  } finally {
    isSqlRunning.value = false
  }
}

async function onLoadAuthUsers(): Promise<void> {
  isLoadingAuth.value = true
  try {
    const result = await supabaseListAuthUsers(1, 50)
    if (result.success && Array.isArray(result.users)) {
      authUsers.value = result.users as AuthUser[]
      authTotal.value = typeof result.total === 'number' ? result.total : result.users.length
    }
  } catch {
    authUsers.value = []
    authTotal.value = null
  } finally {
    isLoadingAuth.value = false
  }
}

async function onLoadBuckets(): Promise<void> {
  isLoadingBuckets.value = true
  try {
    const result = await supabaseListBuckets()
    if (result.success && Array.isArray(result.buckets)) {
      buckets.value = result.buckets as StorageBucket[]
    }
  } catch {
    buckets.value = []
  } finally {
    isLoadingBuckets.value = false
  }
}

async function onSelectBucket(bucket: StorageBucket): Promise<void> {
  selectedBucket.value = bucket
  try {
    const result = await supabaseListFiles(bucket.id)
    if (result.success && Array.isArray(result.files)) {
      bucketFiles.value = result.files as StorageFile[]
    } else {
      bucketFiles.value = []
    }
  } catch {
    bucketFiles.value = []
  }
}

onMounted(async () => {
  try {
    const status = await supabaseGetConfig()
    if (status.configured && status.projectUrl) {
      configured.value = true
      projectUrl.value = status.projectUrl
      form.value.projectUrl = status.projectUrl
      await loadInitialData()
    }
  } catch {
    // Not configured
  }
})
</script>

<style scoped>
@reference "tailwindcss";
.supabase-panel {
  @apply flex h-full flex-col overflow-y-auto;
  min-height: 0;
}

/* Setup */
.supabase-setup {
  @apply mx-auto mt-12 flex max-w-md flex-col items-center gap-4 px-4 text-center;
}

.supabase-setup-icon {
  @apply h-12 w-12 text-zinc-400;
}

.supabase-setup-title {
  @apply m-0 text-xl font-semibold text-zinc-900;
}

.supabase-setup-desc {
  @apply m-0 text-sm leading-6 text-zinc-600;
}

.supabase-setup-fields {
  @apply flex w-full flex-col gap-3;
}

.supabase-setup-label {
  @apply flex flex-col gap-1 text-left text-xs font-medium text-zinc-700;
}

.supabase-input {
  @apply rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500;
}

.supabase-setup-button {
  @apply w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40;
}

.supabase-setup-error {
  @apply m-0 text-sm text-red-600;
}

.supabase-setup-link {
  @apply text-sm text-zinc-500 underline underline-offset-2 transition hover:text-zinc-700;
}

/* Dashboard */
.supabase-dashboard {
  @apply flex flex-1 flex-col gap-3 p-4 sm:p-6;
  min-height: 0;
}

.supabase-header {
  @apply flex items-center justify-between;
}

.supabase-header-left {
  @apply flex items-center gap-2;
}

.supabase-header-icon {
  @apply h-5 w-5 text-zinc-500;
}

.supabase-header-title {
  @apply m-0 text-lg font-semibold text-zinc-900;
}

.supabase-header-right {
  @apply flex items-center gap-2;
}

.supabase-connected-badge {
  @apply rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700;
}

.supabase-disconnect-button {
  @apply rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50;
}

/* Tabs */
.supabase-tabs {
  @apply flex gap-1 border-b border-zinc-200;
}

.supabase-tab {
  @apply rounded-t-lg border border-transparent px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-800;
}

.supabase-tab.is-active {
  @apply border-zinc-200 border-b-white bg-white text-zinc-900;
}

.supabase-tab-content {
  @apply flex flex-col gap-3 pt-3;
}

/* Buttons */
.supabase-button {
  @apply rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40;
}

.supabase-button-secondary {
  @apply border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50;
}

.supabase-select {
  @apply rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-800 outline-none;
}

/* SQL */
.supabase-sql-toolbar {
  @apply flex flex-col gap-2;
}

.supabase-sql-editor {
  @apply w-full rounded-lg border border-zinc-300 bg-white p-3 font-mono text-xs leading-5 text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500;
}

.supabase-sql-actions {
  @apply flex gap-2;
}

.supabase-sql-result {
  @apply max-h-96 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3;
}

.supabase-sql-output {
  @apply m-0 whitespace-pre-wrap font-mono text-xs leading-5 text-zinc-800;
}

/* Tables */
.supabase-tables-toolbar {
  @apply flex items-center gap-2;
}

.supabase-tables-schema-label {
  @apply flex items-center gap-2 text-xs font-medium text-zinc-600;
}

.supabase-table-list {
  @apply flex flex-col gap-1;
}

.supabase-table-row {
  @apply flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-100;
}

.supabase-table-row.is-active {
  @apply bg-zinc-100 font-medium text-zinc-900;
}

.supabase-table-row-icon {
  @apply h-3.5 w-3.5 text-zinc-400;
}

.supabase-table-row-icon :deep(svg) {
  @apply h-3.5 w-3.5;
}

.supabase-table-row-name {
  @apply truncate;
}

/* Table Data */
.supabase-data-header {
  @apply flex items-center justify-between;
}

.supabase-data-title {
  @apply m-0 text-sm font-semibold text-zinc-800;
}

.supabase-data-table-wrap {
  @apply overflow-x-auto rounded-lg border border-zinc-200;
}

.supabase-data-table {
  @apply w-full border-collapse text-xs;
}

.supabase-data-th {
  @apply border-b border-zinc-200 bg-zinc-50 px-2 py-1.5 text-left font-semibold text-zinc-600;
}

.supabase-data-tr {
  @apply border-b border-zinc-100 last:border-b-0;
}

.supabase-data-td {
  @apply max-w-60 truncate px-2 py-1 text-zinc-800;
}

.supabase-data-count {
  @apply text-xs text-zinc-500;
}

/* Auth */
.supabase-auth-toolbar {
  @apply flex items-center justify-between;
}

.supabase-auth-count {
  @apply text-xs text-zinc-500;
}

.supabase-auth-list {
  @apply flex flex-col gap-1;
}

.supabase-auth-row {
  @apply flex flex-col gap-0.5 rounded-lg border border-zinc-100 px-3 py-2;
}

.supabase-auth-email {
  @apply text-sm font-medium text-zinc-800;
}

.supabase-auth-meta {
  @apply text-xs text-zinc-500;
}

.supabase-auth-last-seen {
  @apply text-zinc-400;
}

/* Storage */
.supabase-bucket-list {
  @apply flex flex-col gap-1;
}

.supabase-bucket-row {
  @apply flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-zinc-100;
}

.supabase-bucket-row.is-active {
  @apply bg-zinc-100;
}

.supabase-bucket-name {
  @apply flex-1 text-sm font-medium text-zinc-800;
}

.supabase-bucket-badge {
  @apply rounded px-1.5 py-0.5 text-[10px] font-bold uppercase;
}

.badge-public {
  @apply bg-emerald-100 text-emerald-700;
}

.badge-private {
  @apply bg-zinc-100 text-zinc-600;
}

.supabase-bucket-files {
  @apply flex flex-col gap-2;
}

.supabase-bucket-files-title {
  @apply m-0 text-xs font-semibold text-zinc-600;
}

.supabase-file-list {
  @apply flex flex-col gap-1;
}

.supabase-file-row {
  @apply flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-1.5;
}

.supabase-file-name {
  @apply truncate text-xs font-medium text-zinc-700;
}

.supabase-file-meta {
  @apply shrink-0 text-[10px] text-zinc-400;
}

/* Shared utilities */
.supabase-loading {
  @apply py-4 text-center text-sm text-zinc-500;
}

.supabase-empty {
  @apply py-4 text-center text-sm text-zinc-400;
}

.supabase-error {
  @apply rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700;
}
</style>
