<div align="center">
  <br/>
  <pre style="font-size: 1.5rem; font-weight: bold;">
  ╔═══════════════════════════════╗
  ║         ███╗   ███╗          ║
  ║         ╚██╗ ██╔╝           ║
  ║          ╚████╔╝            ║
  ║           ╚██╔╝             ║
  ║            ╚═╝              ║
  ║   MODEX — Autonomous AI     ║
  ╚═══════════════════════════════╝
  </pre>

  <p><strong>Mobile-first · Desktop-ready · One-command deploy · Agentic</strong></p>

  <p>
    <img src="https://img.shields.io/badge/status-active-success?style=flat-square" alt="Status"/>
    <img src="https://img.shields.io/badge/platform-Web%20%7C%20Mobile-6366f1?style=flat-square" alt="Platform"/>
    <img src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square" alt="License"/>
    <img src="https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=nodedotjs" alt="Node"/>
    <img src="https://img.shields.io/badge/autonomous-agent_built_in-7c3aed?style=flat-square" alt="Agentic"/>
  </p>

  <br/>
</div>

---

## Quick Start

```bash
git clone https://github.com/pasha01118/Modex-Sandbox-.git
cd Modex-Sandbox-
./run.sh
```

Opens at **`http://127.0.0.1:4173`** — no configuration needed. Accessible on LAN via `http://<your-ip>:4173`.

#### 🧹 Clean uninstall

```bash
cd ..
rm -rf Modex-Sandbox-
rm -rf ~/.codex          # app config, sessions, cached data, agent memory
```

---

## Why MODEX?

MODEX transforms the Codex AI coding agent into a **full agentic autonomous platform** that works on your phone and desktop. The interface auto-adapts — bottom tab bar on mobile, sidebar layout on desktop — while running a built-in multi-agent system that plans, executes, and self-maintains.

---

## What You Can Do

| Area | What It Does |
|---|---|
| **💬 Chat** | Start new threads, continue conversations, fork discussions |
| **⚡ Skills** | Browse, install, and manage AI skills from the marketplace |
| **🤖 Automations** | Create and run automated workflows visually |
| **🛡️ Security** | Monitor socket connections in real time |
| **🗄️ Supabase** | Manage your Supabase database from the panel |
| **👁️ Sentinels** | Watch AI agent health with live status cards |
| **🧠 Ollama** | Manage local AI models: pull, list, test, delete, auto-suggested by device RAM |
| **🤖 Auto-Pilot** | Submit high-level goals → autonomous agents plan, execute, self-correct |

---

## Features at a Glance

### 🤖 Auto-Pilot — Agentic Autonomous System

Set a goal in plain English — the built-in agent framework handles the rest:

- **Planner Agent** uses your local Ollama model to break goals into concrete, dependency-ordered steps
- **Executor Agent** runs each step using 13+ tools (shell, file I/O, git, search, glob)
- **Self-Correction** — when a step fails, the planner automatically revises the remaining plan
- **Durable Task Queue** — persists to disk (`~/.codex/agent-tasks.json`), survives restarts, supports retry chains and concurrency limits
- **Agent Memory** — persistent key-value store so agents remember across sessions
- **Maintainer Agent** — periodic health checks (CPU/mem/disk/git/Ollama) + auto-update (git pull → rebuild)

```
Goal: "Check git status, fix lint errors, then commit"
  ├── PlannerAgent breaks into 3 steps
  ├── ExecutorAgent runs step 1 (git status)
  ├── ExecutorAgent runs step 2 (fix lint errors)
  ├── ExecutorAgent runs step 3 (git add + commit)
  └── Self-Correction: if a step fails, Planner revises
```

### 🧠 Local AI with Ollama

Full integration with locally-running Ollama models:

- **Connection status** — detects running Ollama instance on `127.0.0.1:11434`
- **Device-aware suggestions** — analyzes your device RAM and recommends models that fit (a model is suggested if RAM ≥ 2× model requirements)
- **Pull with streaming progress** — real-time download progress bar
- **Local model management** — list, test, and delete installed models
- **Quick test chat** — send a prompt and see the response inline

### 📱 Adaptive UI

- **Phone**: 8-tab bottom navigation (Chat / Skills / Auto / Security / Supabase / Sentinels / Ollama / Agents)
- **Desktop**: Collapsible sidebar with threaded nav, thread tree, speed selector, review pane
- Auto-detects viewport — no manual switching

### 👁️ Sentinel Agent Monitor

- Live dashboard for 6+ AI agents
- Compact LED-indicator cards with health status
- Master mode toggle (auto/manual) + per-agent restart

### 🔌 Plugin Marketplace

- Discover, install, and manage plugins
- Detail modals, GitHub sync for community skills

### 🔧 Self-Maintenance System

- **Health dashboard** — real-time memory, CPU, disk, git, and Ollama status
- **Auto-update** — checks origin/main for new commits, pulls, rebuilds
- **Periodic checks** — automatic every 5 minutes (health) and 1 hour (updates)
- **Alerts** — warns when memory or disk usage is critically high

### 📦 Project Management

- Import/export projects as ZIP
- Git worktree isolation per thread
- File picker and directory browser

### ⚡ Developer Experience

- One-command startup via `run.sh`
- Inline terminal composer for shell commands
- Rate-limit monitoring dashboard

---

## Mobile Navigation Reference

| Tab | Route | Purpose |
|---|---|---|
| 💬 Chat | `/` or `/thread/:id` | Home / conversation view |
| ⚡ Skills | `/skills` | Skill management |
| 🤖 Auto | `/automations` | Workflow editor |
| 🛡️ Security | `/socket-security` | Connection monitor |
| 🗄️ Supabase | `/supabase` | Database panel |
| 👁️ Sentinels | `/sentinels` | Agent dashboard |
| 🧠 Ollama | `/ollama` | Local AI model management |
| 🤖 Agents | `/auto-pilot` | Auto-Pilot goal submission & task dashboard |

---

## Project Structure

```
src/
├── api/                  # Server API clients (codex, ollama, sentinel, supabase...)
├── cli/                  # CLI entry point
├── components/
│   ├── content/          # Panel components (chat, skills, automations,
│   │                        ollama, auto-pilot, sentinels, supabase...)
│   ├── icons/            # SVG icon library
│   ├── layout/           # DesktopLayout / MobileLayout shells
│   ├── mobile/           # Mobile-only components (bottom nav)
│   └── sidebar/          # Sidebar tree and controls
├── composables/          # Shared Vue composables
├── router/               # Hash-based routing config
├── server/
│   ├── agent/            # 🤖 Autonomous Agent Framework
│   │   ├── eventBus.ts       # Pub/sub event system
│   │   ├── baseAgent.ts      # Abstract agent class
│   │   ├── toolRegistry.ts   # 13+ tools (shell, file, git, search)
│   │   ├── taskQueue.ts      # Durable persistent task queue
│   │   ├── agentMemory.ts    # Namespaced KV store
│   │   ├── taskPlanner.ts    # LLM-powered goal planner (Ollama)
│   │   ├── agentOrchestrator.ts # Central orchestrator
│   │   ├── selfHeal.ts       # Health checks + auto-update
│   │   └── defaultAgents.ts  # 3 built-in agents
│   ├── agentRouter.ts    # Agent API routes (17 endpoints)
│   ├── ollamaRouter.ts   # Ollama backend proxy
│   ├── sentinelRouter.ts # Sentinel agent monitoring
│   ├── supabaseRouter.ts # Supabase management
│   ├── socketSecurityRouter.ts # Supply-chain security
│   └── codexAppServerBridge.ts # Central API bridge (~9700 lines)
├── types/                # TypeScript definitions
└── utils/                # Helpers and utilities
```

---

## Tech Stack

```
Frontend    Vue 3 · TypeScript · Vite
Backend     Node.js · Express-style server
Routing     Vue Router (hash history)
State       Composition API (refs / computed)
Styling     CSS custom properties · scoped styles
Agent       Built-in multi-agent framework with Ollama LLM planning
Build       pnpm · esbuild · Vue-TSC
```

---

## Development

```bash
pnpm install
pnpm run dev --host 127.0.0.1 --port 4173
```

Build only:
```bash
pnpm run build
```

---

## License

MIT — Forked from [friuns2/codexUI](https://github.com/friuns2/codexUI).

---

<div align="center">
  <sub>Built for the AI developer community · 2026</sub>
  <br/>
  <sub>
    <a href="https://github.com/pasha01118/Modex-Sandbox-/issues">Report Bug</a> ·
    <a href="https://github.com/pasha01118/Modex-Sandbox-/discussions">Discussion</a>
  </sub>
</div>

<br/>
