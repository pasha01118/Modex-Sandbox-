<div align="center">
  <img src="https://img.shields.io/badge/status-active-success" alt="Status" />
  <img src="https://img.shields.io/badge/platform-Web%20%7C%20Mobile-blue" alt="Platform" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  <br />
  <h1>🚀 MODEX</h1>
  <p><strong>Mobile + Desktop AI Web UI</strong></p>
  <p>A feature-rich, mobile-optimized interface for Codex — the AI coding agent platform.</p>
</div>

---

## ✨ Features

### 📱 Mobile-First Bottom Navigation
- **6-tab bottom bar**: Chat, Skills, Auto, Security, Supabase, Sentinels
- Safe-area-aware padding for notch and gesture bar
- Full-height scrolling content panels
- Touch-optimized 44×44pt tap targets

### 🖥️ Desktop Sidebar Layout
- Collapsible sidebar with thread tree
- Speed mode selector and review pane
- Git branch management dropdown

### 🤖 Agent Monitoring (Sentinels)
- Real-time status dashboard for 6+ AI agents
- Compact horizontal card layout with LED indicators
- Master mode auto/manual toggle
- Hover-to-restart per agent

### 🔌 Plugin Ecosystem
- Discover and install plugins from the marketplace
- Plugin cards with detail modals
- GitHub sync for community skills

### ⚡ One-Click Deploy
```bash
# Production server
./run.sh

# Or with Vite dev mode
./start.sh
```
Auto-installs dependencies, builds, and serves on `http://127.0.0.1:4173`.

### 🔐 Built-In Tools
| Feature | Description |
|---|---|
| **Automations** | Visual automation workflows |
| **Socket Security** | Real-time connection monitoring |
| **Supabase Integration** | Database management panel |
| **Project Import/Export** | ZIP-based project transfer |
| **Git Worktrees** | Isolated branch environments |
| **Terminal Composer** | Inline shell commands |
| **Rate Limit Monitor** | API usage tracking |

---

## 🚦 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **pnpm** (auto-installed by `run.sh` if missing)

### Quick Start (Production)
```bash
git clone <your-repo-url>
cd modex
./run.sh
```
Opens at `http://127.0.0.1:4173`.

### Development Mode
```bash
pnpm install
pnpm run dev --host 127.0.0.1 --port 4173
```

### Build Only
```bash
pnpm run build
```

---

## 📱 Mobile Usage

The UI automatically detects mobile viewports (< 768px) and switches to bottom tab navigation.

| Tab | Route | Description |
|---|---|---|
| 💬 Chat | `/` or `/thread/:id` | New thread / conversation view |
| ⚡ Skills | `/skills` | Installed skills management |
| 🤖 Auto | `/automations` | Automation workflows |
| 🛡️ Security | `/socket-security` | Connection security panel |
| 🗄️ Supabase | `/supabase` | Database management |
| 👁️ Sentinels | `/sentinels` | Agent monitoring |

---

## 🏗️ Architecture

```
src/
├── api/              # API clients and DTOs
├── cli/              # CLI entry point
├── components/
│   ├── content/      # Main content panels
│   ├── icons/        # SVG icon library
│   ├── layout/       # DesktopLayout, MobileLayout
│   ├── mobile/       # Mobile-specific components
│   └── sidebar/      # Sidebar components
├── composables/      # Vue composables
├── router/           # Vue Router config
├── server/           # Backend server routes
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vue 3 + TypeScript + Vite |
| **Router** | Vue Router (hash history) |
| **State** | Vue Composition API (refs/computed) |
| **Backend** | Node.js (Express-like server) |
| **Styling** | CSS custom properties + scoped styles |
| **Build** | pnpm + esbuild |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

This project is a fork of [friuns2/codexUI](https://github.com/friuns2/codexUI) and is available under the MIT License.

---

<div align="center">
  <sub>Built with ❤️ for the AI developer community</sub>
</div>
