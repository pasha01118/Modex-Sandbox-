<div align="center">
  <br/>
  <pre style="font-size: 1.5rem; font-weight: bold;">
  ╔═══════════════════════════════╗
  ║         ███╗   ███╗          ║
  ║         ╚██╗ ██╔╝           ║
  ║          ╚████╔╝            ║
  ║           ╚██╔╝             ║
  ║            ╚═╝              ║
  ║     MODEX — AI Web UI       ║
  ╚═══════════════════════════════╝
  </pre>

  <p><strong>Mobile-first · Desktop-ready · One-command deploy</strong></p>

  <p>
    <img src="https://img.shields.io/badge/status-active-success?style=flat-square" alt="Status"/>
    <img src="https://img.shields.io/badge/platform-Web%20%7C%20Mobile-6366f1?style=flat-square" alt="Platform"/>
    <img src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square" alt="License"/>
    <img src="https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=nodedotjs" alt="Node"/>
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

Opens at **`http://127.0.0.1:4173`** — no configuration needed.

---

## Why MODEX?

MODEX wraps the Codex AI coding agent in a **modern, responsive UI** that works on both your phone and desktop. The interface automatically adapts — bottom tab bar on mobile, sidebar layout on desktop — with no configuration required.

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

---

## Features at a Glance

### 📱 Adaptive UI
  - **Phone**: 6-tab bottom navigation (Chat / Skills / Auto / Security / Supabase / Sentinels)
  - **Desktop**: Collapsible sidebar, thread tree, speed selector, review pane
  - Auto-detects viewport — no manual switching

### 👁️ Sentinel Agent Monitor
  - Live dashboard for 6+ AI agents
  - Compact LED-indicator cards with health status
  - Master mode toggle (auto/manual) + per-agent restart

### 🔌 Plugin Marketplace
  - Discover, install, and manage plugins
  - Detail modals, GitHub sync for community skills

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

---

## Project Structure

```
src/
├── api/               # Server API clients
├── cli/               # CLI entry point
├── components/
│   ├── content/       # Panel components (chat, skills, automations...)
│   ├── icons/         # SVG icon library
│   ├── layout/        # DesktopLayout / MobileLayout shells
│   ├── mobile/        # Mobile-only components (bottom nav)
│   └── sidebar/       # Sidebar tree and controls
├── composables/       # Shared Vue composables
├── router/            # Hash-based routing config
├── server/            # Backend HTTP routes
├── types/             # TypeScript definitions
└── utils/             # Helpers and utilities
```

---

## Tech Stack

```
Frontend    Vue 3 · TypeScript · Vite
Backend     Node.js · Express-style server
Routing     Vue Router (hash history)
State       Composition API (refs / computed)
Styling     CSS custom properties · scoped styles
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
