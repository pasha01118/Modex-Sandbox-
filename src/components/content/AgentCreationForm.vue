<template>
  <div class="agent-creation-form">
    <h3 class="agent-creation-form-title">Create Custom Agent</h3>
    <div class="agent-creation-form-grid">
      <label class="agent-creation-field">
        <span class="agent-creation-label">Name</span>
        <input v-model="form.name" class="agent-creation-input" type="text" placeholder="e.g. Scout" />
      </label>
      <label class="agent-creation-field">
        <span class="agent-creation-label">Role</span>
        <input v-model="form.role" class="agent-creation-input" type="text" placeholder="e.g. Research Analyst" />
      </label>
      <label class="agent-creation-field">
        <span class="agent-creation-label">Avatar</span>
        <input v-model="form.avatar" class="agent-creation-input" type="text" placeholder="🤖" />
      </label>
      <label class="agent-creation-field">
        <span class="agent-creation-label">Color</span>
        <input v-model="form.color" class="agent-creation-input" type="color" />
      </label>
    </div>
    <label class="agent-creation-field">
      <span class="agent-creation-label">Personality</span>
      <textarea v-model="form.personality" class="agent-creation-textarea" rows="2" placeholder="Describe the agent's personality and approach..." />
    </label>
    <label class="agent-creation-field">
      <span class="agent-creation-label">Capabilities (comma-separated)</span>
      <input v-model="form.capabilitiesStr" class="agent-creation-input" type="text" placeholder="planning, code, monitoring" />
    </label>
    <label class="agent-creation-field">
      <span class="agent-creation-label">Skills (comma-separated)</span>
      <input v-model="form.skillsStr" class="agent-creation-input" type="text" placeholder="research, analysis, writing" />
    </label>
    <label class="agent-creation-field">
      <span class="agent-creation-label">Qualifications (comma-separated)</span>
      <input v-model="form.qualificationsStr" class="agent-creation-input" type="text" placeholder="Data Science, ML, Statistics" />
    </label>
    <div class="agent-creation-form-actions">
      <button class="agent-creation-cancel" type="button" @click="$emit('cancel')">Cancel</button>
      <button class="agent-creation-submit" type="button" :disabled="!canSubmit || isSubmitting" @click="onSubmit">
        {{ isSubmitting ? 'Creating...' : 'Create Agent' }}
      </button>
    </div>
    <p v-if="error" class="agent-creation-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'

const emit = defineEmits<{
  created: [data: any]
  cancel: []
}>()

const form = reactive({
  name: '',
  role: '',
  avatar: '🤖',
  color: '#8b5cf6',
  personality: '',
  capabilitiesStr: 'execution, code',
  skillsStr: '',
  qualificationsStr: '',
})

const isSubmitting = ref(false)
const error = ref('')

import { ref } from 'vue'

const canSubmit = computed(() => form.name.trim().length > 0 && form.role.trim().length > 0)

async function onSubmit() {
  isSubmitting.value = true
  error.value = ''
  try {
    const data = {
      name: form.name.trim(),
      role: form.role.trim(),
      avatar: form.avatar || '🤖',
      color: form.color,
      personality: form.personality.trim() || 'Helpful and capable.',
      capabilities: form.capabilitiesStr.split(',').map(s => s.trim()).filter(Boolean),
      skills: form.skillsStr.split(',').map(s => s.trim()).filter(Boolean),
      qualifications: form.qualificationsStr.split(',').map(s => s.trim()).filter(Boolean),
    }
    const res = await fetch('/api/agents/identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create agent')
    const result = await res.json()
    emit('created', result.agent)
  } catch (e: any) {
    error.value = e.message || 'Failed to create agent'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.agent-creation-form {
  padding: 16px;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 12px;
  border: 1px solid var(--border-color, #e0e0e0);
}
.agent-creation-form-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
}
.agent-creation-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}
.agent-creation-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}
.agent-creation-label {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.7;
}
.agent-creation-input,
.agent-creation-textarea {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #d0d0d0);
  background: var(--bg-primary, #fff);
  font-size: 13px;
  color: inherit;
  resize: vertical;
}
.agent-creation-form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
}
.agent-creation-cancel,
.agent-creation-submit {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.agent-creation-cancel {
  background: var(--bg-secondary, #eee);
  color: inherit;
}
.agent-creation-submit {
  background: #8b5cf6;
  color: #fff;
}
.agent-creation-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.agent-creation-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 8px;
}
</style>
