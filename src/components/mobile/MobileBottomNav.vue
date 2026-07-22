<template>
  <nav class="mobile-bottom-nav">
    <button
      v-for="tab in tabs"
      :key="tab.name"
      class="mobile-bottom-nav-item"
      :class="{ 'is-active': activeTab === tab.name }"
      @click="$emit('select', tab.name)"
      :aria-label="tab.label"
    >
      <component :is="tab.icon" class="mobile-bottom-nav-icon" />
      <span class="mobile-bottom-nav-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import IconTablerBolt from '../icons/IconTablerBolt.vue'
import IconTablerShieldCheck from '../icons/IconTablerShieldCheck.vue'
import IconTablerShieldScan from '../icons/IconTablerShieldScan.vue'
import IconTablerDatabase from '../icons/IconTablerDatabase.vue'
import IconTablerTerminal from '../icons/IconTablerTerminal.vue'
import IconTablerSettings from '../icons/IconTablerSettings.vue'

defineProps<{
  activeTab: string
}>()

defineEmits<{
  select: [tab: string]
}>()

interface NavTab {
  name: string
  label: string
  icon: Component
}

const tabs: NavTab[] = [
  { name: 'home', label: 'Chat', icon: IconTablerTerminal },
  { name: 'skills', label: 'Skills', icon: IconTablerBolt },
  { name: 'automations', label: 'Auto', icon: IconTablerBolt },
  { name: 'socket-security', label: 'Security', icon: IconTablerShieldCheck },
  { name: 'supabase', label: 'Supabase', icon: IconTablerDatabase },
  { name: 'sentinels', label: 'Sentinels', icon: IconTablerShieldScan },
  { name: 'ollama', label: 'Ollama', icon: IconTablerSettings },
  { name: 'auto-pilot', label: 'Agents', icon: IconTablerBolt },
  { name: 'modex', label: 'MODEX', icon: IconTablerShieldScan },
  { name: 'token-accountant', label: 'Tokens', icon: IconTablerBolt },
]
</script>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: stretch;
  background: var(--mobile-nav-bg, #ffffff);
  border-top: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.mobile-bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: color-mix(in srgb, currentColor 45%, transparent);
  transition: color 0.2s;
  padding: 4px 0;
}

.mobile-bottom-nav-item.is-active {
  color: inherit;
}

.mobile-bottom-nav-icon {
  font-size: 20px;
  line-height: 1;
}

.mobile-bottom-nav-label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  line-height: 1;
}

:root.dark .mobile-bottom-nav {
  background: #1e1e2e;
  border-top-color: rgba(255,255,255,0.08);
}
</style>
