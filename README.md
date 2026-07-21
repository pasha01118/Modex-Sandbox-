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
    <img src="https://img.shields.io/badge/agent_framework-built_in-7c3aed?style=flat-square" alt="Agentic"/>
  </p>

  <br/>
</div>

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [What You Can Do](#what-you-can-do)
- [Agentic Auto-Pilot System](#-auto-pilot--agentic-autonomous-system)
- [Local AI with Ollama](#-local-ai-with-ollama)
- [Self-Maintenance](#-self-maintenance-system)
- [Adaptive UI](#-adaptive-ui)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Development](#development)
- [Clean Uninstall](#-clean-uninstall)

---

## Quick Start

```bash
git clone https://github.com/pasha01118/Modex-Sandbox-.git
cd Modex-Sandbox-
./run.sh
```

Opens at **`http://127.0.0.1:4173`** — no configuration needed. Accessible on LAN.

### With local AI models (Ollama)

```bash
./run.sh --ollama
```

Auto-installs Ollama, pulls a starter model, starts both the server and Ollama.

### On Android / Termux

The `run.sh` script auto-detects Termux and handles pnpm installation. Use **two Termux tabs**:

```bash
# Tab 1 — run the app
./run.sh

# Tab 2 — install Ollama for local AI (separate session)
bash scripts/install-ollama-termux.sh
```

| Tab | What it runs | Stays running? |
|-----|-------------|----------------|
| 1 | `./run.sh` | Yes — keeps the web server alive |
| 2 | `bash scripts/install-ollama-termux.sh` | No — installs Ollama, starts in background |

---

## What You Can Do

| Area | What It Does |
|---|---|
| **💬 Chat** | Start threads, continue conversations, fork discussions with AI |
| **🤖 Auto-Pilot** | Submit high-level goals → agents plan, execute, and self-correct |
| **🧠 Ollama** | Manage local AI models: pull, list, test, delete, auto-suggested by your device RAM |
| **⚡ Skills** | Browse, install, and manage AI skills from the marketplace |
| **🤖 Automations** | Create recurring automated workflows (cron / heartbeat) |
| **🛡️ Security** | Monitor socket/SBOM supply-chain vulnerabilities in real time |
| **🗄️ Supabase** | Manage your Supabase database from the panel |
| **👁️ Sentinels** | Watch security agents with live status cards |
| **🔧 Maintenance** | Health checks, auto-update, disk/memory alerts |

---

## 🤖 Auto-Pilot — Agentic Autonomous System

Set a goal in plain English — the built-in agent framework handles the rest.

```
Goal: "Check git status, fix lint errors, then commit"
  ├── PlannerAgent (Ollama) → breaks goal into 3 steps
  ├── ExecutorAgent → runs step 1 (git status)
  ├── ExecutorAgent → runs step 2 (fix lint errors)
  ├── ExecutorAgent → runs step 3 (git add + commit)
  └── If any step fails → Planner revises remaining plan automatically
```

### How it works

1. **Submit a goal** in the Auto-Pilot panel (e.g. *"Find all unused imports and remove them"*)
2. **Planner Agent** calls your local Ollama model to decompose the goal into concrete, dependency-ordered steps
3. **Executor Agent** runs each step using 13+ tools:
   - `executeCommand` — run any shell command
   - `readFile` / `writeFile` / `searchCode` / `globFiles`
   - `gitStatus` / `gitCommit` / `gitLog`
   - `readJson` / `writeJson` / `listDirectory`
4. **Self-correction** — if a step errors, the Planner revises remaining steps and retries
5. **Durable queue** — tasks persist to `~/.codex/agent-tasks.json`, survive restarts
6. **Agent memory** — persistent KV store (`~/.codex/agent-memory/`) so agents retain context

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Agent Router                       │
│  POST /agent/goal  GET /agent/status  ... (17 APIs) │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                Agent Orchestrator                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Planner   │  │ Executor  │  │  Maintainer      │   │
│  │ Agent     │  │ Agent     │  │  Agent           │   │
│  │ (LLM)     │  │ (tools)   │  │ (health+update)  │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│              │           │              │            │
│              ▼           ▼              ▼            │
│        ┌─────────┐ ┌─────────┐ ┌──────────────┐     │
│        │ Tool    │ │ Task    │ │ AgentMemory  │     │
│        │Registry │ │ Queue   │ │ (KV store)   │     │
│        └─────────┘ └─────────┘ └──────────────┘     │
└──────────────────────────────────────────────────────┘
```

---

## 🧠 Local AI with Ollama

Full integration with locally-running Ollama models:

- **Connection status** — auto-detects Ollama on `127.0.0.1:11434`
- **Device-aware suggestions** — scans your RAM, recommends models that fit (rule: RAM ≥ 2× model requirement)
- **Streaming pull** — real-time progress bar when downloading models
- **Model management** — list installed models, test with a prompt, delete unwanted ones
- **Quick test chat** — send any prompt and see the response inline

### Install Ollama

| Platform | Command |
|----------|---------|
| Linux | `curl -fsSL https://ollama.com/install.sh \| sh` |
| Android / Termux | `bash scripts/install-ollama-termux.sh` |
| Via run.sh | `./run.sh --ollama` |
| Manual | Download from [ollama.com/download](https://ollama.com/download) |

---

## 🔧 Self-Maintenance System

The **Maintainer Agent** runs automatically at startup:

| Check | Interval | What it monitors |
|-------|----------|-----------------|
| Memory | 5 min | RAM usage % — alerts above 90% |
| CPU | 5 min | Load average, core count |
| Disk | 5 min | Available space — alerts above 95% |
| Git | 5 min | Branch, commits behind/ahead |
| Ollama | 5 min | Server reachable on port 11434 |
| Auto-update | 1 hour | `git fetch origin`, pull + rebuild if new commits |

Run on-demand from the Auto-Pilot panel or via API:
```bash
curl -X POST http://127.0.0.1:4173/codex-api/agent/self-heal/check
curl -X POST http://127.0.0.1:4173/codex-api/agent/self-heal/update
```

---

## 📱 Adaptive UI

- **Phone** — 8-tab bottom navigation bar:
  `Chat · Skills · Auto · Security · Supabase · Sentinels · Ollama · Agents`
- **Desktop** — collapsible sidebar with threaded nav, thread tree, speed selector, review pane
- Auto-detects viewport, no manual switching
- Dark theme support throughout

---

## Project Structure

```
src/
├── api/                  # Server API clients (codex, ollama, sentinel, supabase...)
├── cli/                  # CLI entry point (Commander.js)
├── components/
│   ├── content/          # All panel components
│   ├── icons/            # SVG icon library (Tabler)
│   ├── layout/           # DesktopLayout / MobileLayout shells
│   ├── mobile/           # MobileBottomNav
│   └── sidebar/          # Sidebar thread tree + controls
├── composables/          # Shared Vue composables (useMobile, useUiLanguage...)
├── router/               # Vue Router (hash history)
├── server/
│   ├── agent/            # 🤖 Agentic framework
│   │   ├── eventBus.ts       # Pub/sub event system
│   │   ├── baseAgent.ts      # Abstract agent class
│   │   ├── toolRegistry.ts   # 13+ agent tools
│   │   ├── taskQueue.ts      # Durable persistent queue
│   │   ├── agentMemory.ts    # Namespaced KV store
│   │   ├── taskPlanner.ts    # LLM goal planner (Ollama)
│   │   ├── agentOrchestrator.ts # Central orchestrator
│   │   ├── selfHeal.ts       # Health + auto-update
│   │   └── defaultAgents.ts  # 3 built-in agents
│   ├── agentRouter.ts    # 17 agent API endpoints
│   ├── ollamaRouter.ts   # Ollama backend proxy
│   ├── sentinelRouter.ts # Security agents
│   ├── supabaseRouter.ts # Supabase management
│   ├── socketSecurityRouter.ts # Supply-chain security
│   └── codexAppServerBridge.ts # Central API bridge
├── types/                # TypeScript definitions
└── utils/                # Helpers and utilities
```

---

## Tech Stack

```
Frontend    Vue 3 · TypeScript · Vite · Tailwind CSS
Backend     Node.js · Express-style server
Routing     Vue Router (hash history)
State       Composition API (refs / computed)
Styling     CSS custom properties · scoped styles
Agent       Built-in multi-agent framework + Ollama LLM planning
Build       pnpm · tsup (CLI) · Vite (frontend) · vue-tsc
APIs        OpenAI Codex RPC · Ollama REST · Supabase · Socket.dev
```

---

## Development

```bash
pnpm install
pnpm run dev --host 127.0.0.1 --port 4173
```

Build for production:
```bash
pnpm run build
```

Preview production build:
```bash
pnpm run preview
```

Run tests:
```bash
pnpm run test:unit
```

---

## 🧹 Clean Uninstall

```bash
cd ..
rm -rf Modex-Sandbox-
rm -rf ~/.codex          # app config, sessions, agent tasks, agent memory
```

If you set a custom `$CODEX_HOME`, use that path instead.

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
