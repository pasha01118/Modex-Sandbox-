<div align="center">

<!-- ANIMATED SVG HEADER -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" style="max-width:800px;height:auto;">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0c29;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#302b63;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#24243e;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="txtGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00f5ff;stop-opacity:1">
        <animate attributeName="stop-color" values="#00f5ff;#ff00ff;#ff6600;#00f5ff" dur="6s" repeatCount="indefinite"/>
      </stop>
      <stop offset="50%" style="stop-color:#ff00ff;stop-opacity:1">
        <animate attributeName="stop-color" values="#ff00ff;#ff6600;#00f5ff;#ff00ff" dur="6s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" style="stop-color:#ff6600;stop-opacity:1">
        <animate attributeName="stop-color" values="#ff6600;#00f5ff;#ff00ff;#ff6600" dur="6s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00f5ff;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:#ff00ff;stop-opacity:0.1"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="glowStrong">
      <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#ff00ff" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="260" rx="16" fill="url(#bgGrad)"/>

  <!-- Animated floating particles -->
  <circle cx="100" cy="60" r="2" fill="#00f5ff" opacity="0.6">
    <animate attributeName="cy" values="60;40;60" dur="4s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="4s" repeatCount="indefinite"/>
  </circle>
  <circle cx="250" cy="180" r="1.5" fill="#ff00ff" opacity="0.5">
    <animate attributeName="cy" values="180;160;180" dur="3.5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="550" cy="50" r="2.5" fill="#ff6600" opacity="0.4">
    <animate attributeName="cy" values="50;30;50" dur="5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="700" cy="190" r="1.8" fill="#00f5ff" opacity="0.5">
    <animate attributeName="cy" values="190;170;190" dur="4.2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="400" cy="30" r="1.2" fill="#ff00ff" opacity="0.3">
    <animate attributeName="cy" values="30;50;30" dur="3.8s" repeatCount="indefinite"/>
  </circle>

  <!-- Diagonal accent lines -->
  <line x1="0" y1="0" x2="200" y2="260" stroke="url(#glowGrad)" stroke-width="1" opacity="0.4"/>
  <line x1="600" y1="0" x2="800" y2="260" stroke="url(#glowGrad)" stroke-width="1" opacity="0.3"/>

  <!-- MODEX AI Logo text -->
  <text x="400" y="100" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="72" font-weight="900" fill="url(#txtGrad)" filter="url(#glowStrong)" style="letter-spacing:6px;">
    MODEX
    <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite"/>
  </text>

  <!-- AI badge -->
  <rect x="470" y="60" width="60" height="32" rx="16" fill="none" stroke="#ff00ff" stroke-width="1.5" filter="url(#glow)">
    <animate attributeName="stroke" values="#ff00ff;#00f5ff;#ff6600;#ff00ff" dur="4s" repeatCount="indefinite"/>
  </rect>
  <text x="500" y="81" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="14" font-weight="800" fill="#ff00ff" filter="url(#glow)">
    AI
    <animate attributeName="fill" values="#ff00ff;#00f5ff;#ff6600;#ff00ff" dur="4s" repeatCount="indefinite"/>
  </text>

  <!-- Subtitle -->
  <text x="400" y="150" text-anchor="middle" font-family="Consolas,'Courier New',monospace" font-size="15" fill="#a0a0c0" style="letter-spacing:4px;">
    AUTONOMOUS AGENTIC WEB UI
  </text>

  <!-- Tagline -->
  <text x="400" y="185" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="14" fill="#7878a0" style="letter-spacing:2px;">
    <animate attributeName="opacity" values="0.4;0.8;0.4" dur="5s" repeatCount="indefinite"/>
    ⚡ Mobile-first · Desktop-ready · One-command deploy ⚡
  </text>

  <!-- Bottom accent bar -->
  <rect x="150" y="215" width="500" height="2" rx="1" fill="#ff00ff" opacity="0.5">
    <animate attributeName="opacity" values="0.5;0.2;0.5" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="width" values="500;400;500" dur="4s" repeatCount="indefinite"/>
  </rect>

  <!-- Badges -->
  <a href="https://github.com/pasha01118/Modex-Sandbox-">
    <rect x="180" y="228" width="440" height="24" rx="12" fill="#1a1a3e" stroke="#302b63" stroke-width="0.5"/>
    <text x="400" y="244" text-anchor="middle" font-family="Consolas,monospace" font-size="11" fill="#6060a0" style="letter-spacing:1px;">
      pasha01118/Modex-Sandbox- · main · v0.1.87
    </text>
  </a>
</svg>

<br/><br/>

<!-- STATUS BADGES WITH NEON STYLE -->
<p>
  <span style="display:inline-block;padding:6px 16px;margin:3px;border-radius:20px;background:linear-gradient(135deg,#00f5ff22,#00f5ff11);border:1px solid #00f5ff55;color:#00f5ff;font-family:Consolas,monospace;font-size:12px;font-weight:600;text-shadow:0 0 8px #00f5ff88;">● ACTIVE</span>
  <span style="display:inline-block;padding:6px 16px;margin:3px;border-radius:20px;background:linear-gradient(135deg,#ff00ff22,#ff00ff11);border:1px solid #ff00ff55;color:#ff00ff;font-family:Consolas,monospace;font-size:12px;font-weight:600;text-shadow:0 0 8px #ff00ff88;">● AGENTIC</span>
  <span style="display:inline-block;padding:6px 16px;margin:3px;border-radius:20px;background:linear-gradient(135deg,#ff660022,#ff660011);border:1px solid #ff660055;color:#ff6600;font-family:Consolas,monospace;font-size:12px;font-weight:600;text-shadow:0 0 8px #ff660088;">⬡ CROSS-PLATFORM</span>
  <span style="display:inline-block;padding:6px 16px;margin:3px;border-radius:20px;background:linear-gradient(135deg,#22c55e22,#22c55e11);border:1px solid #22c55e55;color:#22c55e;font-family:Consolas,monospace;font-size:12px;font-weight:600;text-shadow:0 0 8px #22c55e88;">&#9998; MIT</span>
</p>

</div>

---

<div style="background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);padding:30px 20px;border-radius:16px;border:1px solid #ff00ff44;box-shadow:0 0 40px #ff00ff22,inset 0 0 60px #00000044;margin:20px 0;">

<h2 align="center" style="font-family:'Segoe UI',Arial,sans-serif;font-size:28px;font-weight:800;background:linear-gradient(90deg,#00f5ff,#ff00ff,#ff6600);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;text-shadow:none;margin:0 0 20px 0;">
  ⚡ ONE COMMAND — ZERO CONFIG ⚡
</h2>

<div align="center" style="background:#0a0a1e;border-radius:12px;padding:4px;border:1px solid #ff00ff33;box-shadow:0 0 20px #ff00ff11;">
<pre style="background:transparent;color:#00f5ff;font-family:Consolas,'Courier New',monospace;font-size:15px;padding:16px 24px;margin:0;overflow-x:auto;white-space:pre-wrap;text-shadow:0 0 6px #00f5ff44;">
<span style="color:#ff6600;">git clone</span> https://github.com/pasha01118/Modex-Sandbox-.git
<span style="color:#ff6600;">cd</span> Modex-Sandbox-
<span style="color:#22c55e;">./run.sh</span>
</pre>
</div>

<br/>

<div align="center" style="color:#7878a0;font-family:Consolas,monospace;font-size:13px;letter-spacing:1px;">
  Opens at <span style="color:#00f5ff;text-shadow:0 0 8px #00f5ff66;">http://127.0.0.1:4173</span> — LAN accessible at <span style="color:#00f5ff;text-shadow:0 0 8px #00f5ff66;">http://192.168.x.x:4173</span>
</div>

<br/>

<!-- CLEAN UNINSTALL -->
<div align="center" style="margin:20px 0;">
  <details style="display:inline-block;max-width:600px;background:#1a1a2e;border-radius:10px;border:1px solid #ff336644;padding:0;color:#c0c0e0;font-family:Consolas,monospace;font-size:13px;text-align:left;">
    <summary style="padding:12px 20px;cursor:pointer;color:#ff3366;font-weight:700;text-shadow:0 0 6px #ff336644;letter-spacing:1px;">🧹 Clean Uninstall</summary>
    <pre style="background:#0a0a1e;color:#c0c0e0;font-family:Consolas,monospace;font-size:13px;padding:16px 20px;margin:0;overflow-x:auto;white-space:pre-wrap;border-radius:0 0 10px 10px;border-top:1px solid #ff336644;">
<span style="color:#22c55e;">rm -rf ~/.codex</span>          <span style="color:#6060a0;"># config, sessions, cached data</span>
<span style="color:#22c55e;">rm -rf ~/.codexui</span>         <span style="color:#6060a0;"># UI state and logs</span>
<span style="color:#22c55e;">rm -rf Modex-Sandbox-</span>     <span style="color:#6060a0;"># app folder (run from parent dir)</span>
    </pre>
    <div style="padding:10px 20px;color:#6060a0;font-size:11px;border-top:1px solid #ff336622;">
      Removes app folder, all Codex config, saved sessions, cached data, and UI state.
      If you set a custom <span style="color:#ff6600;">$CODEX_HOME</span>, use that path instead of <span style="color:#22c55e;">~/.codex</span>.
    </div>
  </details>
</div>

<br/>

<!-- QUICK OPTIONS CARDS -->
<div align="center">

<div style="display:inline-block;margin:8px;padding:14px 22px;border-radius:12px;background:linear-gradient(135deg,#00f5ff11,#00f5ff05);border:1px solid #00f5ff44;max-width:300px;vertical-align:top;text-align:left;">
  <span style="color:#00f5ff;font-family:Consolas,monospace;font-size:13px;font-weight:700;text-shadow:0 0 6px #00f5ff66;">🧠 With Local AI</span>
  <pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:12px;margin:8px 0 0;padding:0;white-space:pre-wrap;"><span style="color:#22c55e;">./run.sh --ollama</span>
<span style="color:#6060a0;"># Auto-installs Ollama + starter model</span></pre>
</div>

<div style="display:inline-block;margin:8px;padding:14px 22px;border-radius:12px;background:linear-gradient(135deg,#ff00ff11,#ff00ff05);border:1px solid #ff00ff44;max-width:300px;vertical-align:top;text-align:left;">
  <span style="color:#ff00ff;font-family:Consolas,monospace;font-size:13px;font-weight:700;text-shadow:0 0 6px #ff00ff66;">📱 On Android/Termux</span>
  <pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:12px;margin:8px 0 0;padding:0;white-space:pre-wrap;"><span style="color:#22c55e;">./run.sh</span>  <span style="color:#6060a0;"># Tab 1: app server</span>
<span style="color:#22c55e;">bash scripts/install-ollama-termux.sh</span>  <span style="color:#6060a0;"># Tab 2: AI models</span></pre>
</div>

</div>
</div>

---

<!-- FEATURES GRID -->
<h2 align="center" style="font-family:'Segoe UI',Arial,sans-serif;font-size:24px;font-weight:800;background:linear-gradient(90deg,#00f5ff,#ff00ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">🔥 THE STACK</h2>

<div align="center">

<table style="border-collapse:collapse;width:100%;max-width:900px;margin:20px 0;">
<tr>
<td style="padding:18px 20px;border:1px solid #00f5ff33;border-radius:12px 0 0 0;background:linear-gradient(135deg,#00f5ff08,#00f5ff02);">
  <div style="font-size:15px;font-family:'Segoe UI',Arial,sans-serif;font-weight:800;color:#00f5ff;text-shadow:0 0 10px #00f5ff44;">💬 Chat</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Threads, forks, conversations with AI</div>
</td>
<td style="padding:18px 20px;border:1px solid #ff00ff33;background:linear-gradient(135deg,#ff00ff08,#ff00ff02);">
  <div style="font-size:15px;font-family:'Segoe UI',Arial,sans-serif;font-weight:800;color:#ff00ff;text-shadow:0 0 10px #ff00ff44;">🤖 Auto-Pilot</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Autonomous agents plan → execute → self-correct</div>
</td>
</tr>
<tr>
<td style="padding:18px 20px;border:1px solid #ff660033;background:linear-gradient(135deg,#ff660008,#ff660002);">
  <div style="font-size:15px;font-family:'Segoe UI',Arial,sans-serif;font-weight:800;color:#ff6600;text-shadow:0 0 10px #ff660044;">🧠 Ollama</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Local models: pull, test, delete, device-suggested</div>
</td>
<td style="padding:18px 20px;border:1px solid #22c55e33;background:linear-gradient(135deg,#22c55e08,#22c55e02);">
  <div style="font-size:15px;font-family:'Segoe UI',Arial,sans-serif;font-weight:800;color:#22c55e;text-shadow:0 0 10px #22c55e44;">⚡ Skills</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Marketplace, install, manage AI plugins</div>
</td>
</tr>
<tr>
<td style="padding:18px 20px;border:1px solid #00f5ff33;border-radius:0 0 0 12px;background:linear-gradient(135deg,#00f5ff08,#00f5ff02);">
  <div style="font-size:15px;font-family:'Segoe UI',Arial,sans-serif;font-weight:800;color:#00f5ff;text-shadow:0 0 10px #00f5ff44;">🛡️ Security</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Socket/SBOM supply-chain monitoring</div>
</td>
<td style="padding:18px 20px;border:1px solid #ff00ff33;background:linear-gradient(135deg,#ff00ff08,#ff00ff02);">
  <div style="font-size:15px;font-family:'Segoe UI',Arial,sans-serif;font-weight:800;color:#ff00ff;text-shadow:0 0 10px #ff00ff44;">🗄️ Supabase</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Database, auth, storage from the panel</div>
</td>
</tr>
<tr>
<td style="padding:18px 20px;border:1px solid #ff660033;background:linear-gradient(135deg,#ff660008,#ff660002);">
  <div style="font-size:15px;font-family:'Segoe UI',Arial,sans-serif;font-weight:800;color:#ff6600;text-shadow:0 0 10px #ff660044;">👁️ Sentinels</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Security agent health + live status cards</div>
</td>
<td style="padding:18px 20px;border:1px solid #22c55e33;border-radius:0 0 12px 0;background:linear-gradient(135deg,#22c55e08,#22c55e02);">
  <div style="font-size:15px;font-family:'Segoe UI',Arial,sans-serif;font-weight:800;color:#22c55e;text-shadow:0 0 10px #22c55e44;">🔧 Maintenance</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Auto-heal, health checks, git auto-update</div>
</td>
</tr>
</table>

</div>

---

<!-- AGENT SYSTEM DEEP DIVE -->
<div style="background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);padding:30px 20px;border-radius:16px;border:1px solid #00f5ff44;box-shadow:0 0 40px #00f5ff22,inset 0 0 60px #00000044;margin:20px 0;">

<h2 align="center" style="font-family:'Segoe UI',Arial,sans-serif;font-size:26px;font-weight:800;background:linear-gradient(90deg,#00f5ff,#ff00ff,#ff6600);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">
  🤖 AUTO-PILOT — AGENTIC SYSTEM
</h2>

<div align="center" style="color:#a0a0c0;font-family:Consolas,monospace;font-size:13px;letter-spacing:1px;margin-bottom:20px;">
  Set a goal in plain English — the agents do the rest
</div>

<!-- FLOW DIAGRAM -->
<div align="center" style="background:#0a0a1e;border-radius:12px;padding:20px;border:1px solid #00f5ff33;margin-bottom:20px;">
<pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:13px;margin:0;line-height:1.8;text-align:left;display:inline-block;">
<span style="color:#ff6600;font-weight:700;">Goal:</span> <span style="color:#ffffff;">"Check git status, fix lint errors, then commit"</span>
  ├── <span style="color:#00f5ff;">PlannerAgent</span> <span style="color:#6060a0;">(Ollama)</span> → breaks goal into 3 steps
  ├── <span style="color:#ff00ff;">ExecutorAgent</span> → runs step 1 <span style="color:#6060a0;">(git status)</span>
  ├── <span style="color:#ff00ff;">ExecutorAgent</span> → runs step 2 <span style="color:#6060a0;">(fix lint errors)</span>
  ├── <span style="color:#ff00ff;">ExecutorAgent</span> → runs step 3 <span style="color:#6060a0;">(git add + commit)</span>
  └── <span style="color:#ff6600;">Self-Correction</span> → if step fails, Planner revises plan
</pre>
</div>

<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#00f5ff11,#00f5ff05);border:1px solid #00f5ff44;">
  <div style="font-family:Consolas,monospace;font-size:13px;font-weight:700;color:#00f5ff;text-shadow:0 0 6px #00f5ff44;">🧠 Planner Agent</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Uses local Ollama to break goals into concrete, dependency-ordered steps
  </div>
</div>

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#ff00ff11,#ff00ff05);border:1px solid #ff00ff44;">
  <div style="font-family:Consolas,monospace;font-size:13px;font-weight:700;color:#ff00ff;text-shadow:0 0 6px #ff00ff44;">⚡ Executor Agent</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Runs steps via 13+ tools: shell, file I/O, git, search, glob
  </div>
</div>

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#22c55e11,#22c55e05);border:1px solid #22c55e44;">
  <div style="font-family:Consolas,monospace;font-size:13px;font-weight:700;color:#22c55e;text-shadow:0 0 6px #22c55e44;">🔧 Maintainer Agent</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Periodic health checks + auto-update (git pull → rebuild)
  </div>
</div>

</div>

<br/>

<div align="center" style="color:#7878a0;font-family:Consolas,monospace;font-size:12px;line-height:1.8;">
  <span style="color:#ff00ff;">Durable Task Queue</span> — persists to disk, survives restarts, retry chains<br/>
  <span style="color:#00f5ff;">Agent Memory</span> — persistent KV store so agents remember across sessions<br/>
  <span style="color:#ff6600;">Self-Correction</span> — planner automatically revises when steps fail
</div>

</div>

---

<!-- ARCHITECTURE -->
<h2 align="center" style="font-family:'Segoe UI',Arial,sans-serif;font-size:24px;font-weight:800;background:linear-gradient(90deg,#ff6600,#ff00ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">🏗️ ARCHITECTURE</h2>

<div align="center" style="background:#0a0a1e;border-radius:12px;padding:20px;border:1px solid #ff00ff33;margin:20px 0;overflow-x:auto;">
<pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:12px;margin:0;line-height:1.7;text-align:left;display:inline-block;">
<span style="color:#ff6600;">src/</span>
├── <span style="color:#00f5ff;">api/</span>              <span style="color:#6060a0;"># API clients (ollama, sentinel, supabase...)</span>
├── <span style="color:#00f5ff;">cli/</span>              <span style="color:#6060a0;"># CLI entry point</span>
├── <span style="color:#00f5ff;">components/</span>
│   ├── <span style="color:#00f5ff;">content/</span>        <span style="color:#6060a0;"># Panels: Chat, AutoPilot, Ollama, Skills, Security...</span>
│   ├── <span style="color:#00f5ff;">mobile/</span>          <span style="color:#6060a0;"># MobileBottomNav (8 tabs)</span>
│   └── <span style="color:#00f5ff;">sidebar/</span>         <span style="color:#6060a0;"># Sidebar thread tree</span>
├── <span style="color:#ff00ff;">server/</span>
│   ├── <span style="color:#22c55e;">agent/</span>           <span style="color:#ff6600;font-weight:700;">★ Agentic Framework</span>
│   │   ├── <span style="color:#ff6600;">eventBus.ts</span>       <span style="color:#6060a0;"># Pub/sub event system</span>
│   │   ├── <span style="color:#ff6600;">baseAgent.ts</span>      <span style="color:#6060a0;"># Abstract agent class</span>
│   │   ├── <span style="color:#ff6600;">toolRegistry.ts</span>   <span style="color:#6060a0;"># 13+ agent tools</span>
│   │   ├── <span style="color:#ff6600;">taskQueue.ts</span>      <span style="color:#6060a0;"># Durable persistent queue</span>
│   │   ├── <span style="color:#ff6600;">agentMemory.ts</span>    <span style="color:#6060a0;"># Namespaced KV store</span>
│   │   ├── <span style="color:#ff6600;">taskPlanner.ts</span>    <span style="color:#6060a0;"># LLM goal planner (Ollama)</span>
│   │   ├── <span style="color:#ff6600;">agentOrchestrator.ts</span> <span style="color:#6060a0;"># Central orchestrator</span>
│   │   ├── <span style="color:#ff6600;">selfHeal.ts</span>       <span style="color:#6060a0;"># Health + auto-update</span>
│   │   └── <span style="color:#ff6600;">defaultAgents.ts</span>  <span style="color:#6060a0;"># 3 built-in agents</span>
│   ├── <span style="color:#22c55e;">agentRouter.ts</span>    <span style="color:#6060a0;"># 17 agent API endpoints</span>
│   ├── <span style="color:#22c55e;">ollamaRouter.ts</span>   <span style="color:#6060a0;"># Ollama backend proxy</span>
│   ├── <span style="color:#22c55e;">sentinelRouter.ts</span> <span style="color:#6060a0;"># Security agents</span>
│   └── <span style="color:#22c55e;">codexAppServerBridge.ts</span> <span style="color:#6060a0;"># Central API bridge</span>
└── <span style="color:#ff6600;">scripts/</span>
    ├── <span style="color:#22c55e;">install-ollama-termux.sh</span> <span style="color:#6060a0;"># Termux Ollama installer</span>
    └── <span style="color:#22c55e;">fix-pty-native-build.cjs</span>  <span style="color:#6060a0;"># node-pty postinstall fix</span>
</pre>
</div>

---

<!-- OLLAMA SECTION -->
<div style="background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);padding:30px 20px;border-radius:16px;border:1px solid #ff660044;box-shadow:0 0 40px #ff660022,inset 0 0 60px #00000044;margin:20px 0;">

<h2 align="center" style="font-family:'Segoe UI',Arial,sans-serif;font-size:24px;font-weight:800;background:linear-gradient(90deg,#ff6600,#ff00ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">
  🧠 LOCAL AI — OLLAMA
</h2>

<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">

<div style="flex:1;min-width:200px;padding:14px;border-radius:10px;background:linear-gradient(135deg,#ff660011,#ff660005);border:1px solid #ff660044;">
  <div style="font-size:13px;color:#ff6600;font-family:Consolas,monospace;font-weight:700;text-shadow:0 0 6px #ff660044;">🔌 Connection Status</div>
  <div style="font-size:12px;color:#7878a0;margin-top:4px;">Auto-detects Ollama on port 11434</div>
</div>

<div style="flex:1;min-width:200px;padding:14px;border-radius:10px;background:linear-gradient(135deg,#00f5ff11,#00f5ff05);border:1px solid #00f5ff44;">
  <div style="font-size:13px;color:#00f5ff;font-family:Consolas,monospace;font-weight:700;text-shadow:0 0 6px #00f5ff44;">💾 Device-Aware Suggestions</div>
  <div style="font-size:12px;color:#7878a0;margin-top:4px;">Scans RAM, recommends models that fit</div>
</div>

<div style="flex:1;min-width:200px;padding:14px;border-radius:10px;background:linear-gradient(135deg,#ff00ff11,#ff00ff05);border:1px solid #ff00ff44;">
  <div style="font-size:13px;color:#ff00ff;font-family:Consolas,monospace;font-weight:700;text-shadow:0 0 6px #ff00ff44;">📥 Streaming Pull</div>
  <div style="font-size:12px;color:#7878a0;margin-top:4px;">Real-time progress bar when downloading</div>
</div>

</div>

<br/>

<div align="center" style="background:#0a0a1e;border-radius:12px;padding:16px;border:1px solid #ff660033;display:inline-block;">
<table style="border-collapse:collapse;font-family:Consolas,monospace;font-size:13px;">
<tr><th style="padding:8px 16px;border-bottom:1px solid #ff660044;color:#ff6600;">Platform</th><th style="padding:8px 16px;border-bottom:1px solid #ff660044;color:#ff6600;">Command</th></tr>
<tr><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#7878a0;">Linux</td><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#c0c0e0;"><span style="color:#22c55e;">curl -fsSL https://ollama.com/install.sh | sh</span></td></tr>
<tr><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#7878a0;">Android/Termux</td><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#c0c0e0;"><span style="color:#22c55e;">bash scripts/install-ollama-termux.sh</span></td></tr>
<tr><td style="padding:8px 16px;color:#7878a0;">One-command</td><td style="padding:8px 16px;color:#c0c0e0;"><span style="color:#22c55e;">./run.sh --ollama</span></td></tr>
</table>
</div>

</div>

---

<!-- SELF-HEAL -->
<h2 align="center" style="font-family:'Segoe UI',Arial,sans-serif;font-size:24px;font-weight:800;background:linear-gradient(90deg,#22c55e,#00f5ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">🔧 SELF-MAINTENANCE</h2>

<div align="center" style="background:#0a0a1e;border-radius:12px;padding:20px;border:1px solid #22c55e33;margin:20px 0;overflow-x:auto;">
<table style="border-collapse:collapse;font-family:Consolas,monospace;font-size:12px;width:100%;max-width:700px;">
<tr>
  <th style="padding:10px 16px;border-bottom:1px solid #22c55e44;color:#22c55e;">Check</th>
  <th style="padding:10px 16px;border-bottom:1px solid #22c55e44;color:#22c55e;">Interval</th>
  <th style="padding:10px 16px;border-bottom:1px solid #22c55e44;color:#22c55e;">What it monitors</th>
</tr>
<tr><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#00f5ff;">Memory</td><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#7878a0;">5 min</td><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#c0c0e0;">RAM usage % — alerts above 90%</td></tr>
<tr><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#ff00ff;">CPU</td><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#7878a0;">5 min</td><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#c0c0e0;">Load average, core count</td></tr>
<tr><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#ff6600;">Disk</td><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#7878a0;">5 min</td><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#c0c0e0;">Available space — alerts above 95%</td></tr>
<tr><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#22c55e;">Git</td><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#7878a0;">5 min</td><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#c0c0e0;">Branch, commits behind/ahead</td></tr>
<tr><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#00f5ff;">Ollama</td><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#7878a0;">5 min</td><td style="padding:8px 16px;border-bottom:1px solid #302b63;color:#c0c0e0;">Server reachable on port 11434</td></tr>
<tr><td style="padding:8px 16px;color:#ff00ff;">Auto-update</td><td style="padding:8px 16px;color:#7878a0;">1 hour</td><td style="padding:8px 16px;color:#c0c0e0;">git fetch → pull → rebuild</td></tr>
</table>
</div>

---

<!-- TECH STACK -->
<h2 align="center" style="font-family:'Segoe UI',Arial,sans-serif;font-size:24px;font-weight:800;background:linear-gradient(90deg,#ff00ff,#ff6600);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">⚙️ TECH STACK</h2>

<div align="center" style="background:#0a0a1e;border-radius:12px;padding:20px;border:1px solid #ff00ff33;margin:20px 0;">
<pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:13px;margin:0;line-height:2;text-align:left;display:inline-block;">
<span style="color:#ff6600;">Frontend</span>    Vue 3 · TypeScript · Vite · Tailwind CSS
<span style="color:#ff00ff;">Backend</span>     Node.js · Express-style server
<span style="color:#00f5ff;">Agent</span>       Built-in multi-agent framework + Ollama LLM planning
<span style="color:#22c55e;">Build</span>       pnpm · tsup (CLI) · Vite (frontend)
<span style="color:#ff6600;">APIs</span>        OpenAI Responses RPC · Ollama REST · Supabase · Socket.dev
</pre>
</div>

---

<!-- DEVELOPMENT -->
<h2 align="center" style="font-family:'Segoe UI',Arial,sans-serif;font-size:24px;font-weight:800;background:linear-gradient(90deg,#00f5ff,#22c55e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">💻 DEVELOPMENT</h2>

<div align="center" style="background:#0a0a1e;border-radius:12px;padding:4px;border:1px solid #00f5ff33;margin:20px 0;display:inline-block;">
<pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:13px;padding:16px 24px;margin:0;text-align:left;">
<span style="color:#22c55e;">pnpm install</span>
<span style="color:#22c55e;">pnpm run dev</span> --host 127.0.0.1 --port 4173

<span style="color:#6060a0;"># Build for production</span>
<span style="color:#22c55e;">pnpm run build</span>

<span style="color:#6060a0;"># Run tests</span>
<span style="color:#22c55e;">pnpm run test:unit</span>
</pre>
</div>

---

<!-- CLEAN UNINSTALL -->
<h2 align="center" style="font-family:'Segoe UI',Arial,sans-serif;font-size:24px;font-weight:800;background:linear-gradient(90deg,#ef4444,#ff00ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">🧹 CLEAN UNINSTALL</h2>

<div align="center" style="background:#0a0a1e;border-radius:12px;padding:4px;border:1px solid #ef444433;margin:20px 0;display:inline-block;">
<pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:13px;padding:16px 24px;margin:0;text-align:left;">
<span style="color:#ef4444;">cd ..</span>
<span style="color:#ef4444;">rm -rf Modex-Sandbox-</span>
<span style="color:#ef4444;">rm -rf ~/.codex</span>          <span style="color:#6060a0;"># config, sessions, agent tasks, memory</span>
</pre>
</div>

---

<!-- FOOTER -->
<div align="center" style="background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);padding:20px;border-radius:16px;border:1px solid #ff00ff22;box-shadow:0 0 30px #ff00ff11;margin:20px 0;">

<pre style="background:transparent;color:#6060a0;font-family:Consolas,monospace;font-size:12px;margin:0;line-height:1.6;">
<span style="color:#ff00ff;">MIT License</span> — Built for the AI developer community · 2026

<span style="color:#6060a0;">Forked from</span> <span style="color:#00f5ff;">friuns2/codexUI</span>
</pre>

<br/>

<p>
  <a href="https://github.com/pasha01118/Modex-Sandbox-/issues" style="color:#7878a0;text-decoration:none;font-family:Consolas,monospace;font-size:12px;border:1px solid #7878a044;padding:6px 16px;border-radius:8px;margin:0 4px;">Report Bug</a>
  <a href="https://github.com/pasha01118/Modex-Sandbox-/discussions" style="color:#7878a0;text-decoration:none;font-family:Consolas,monospace;font-size:12px;border:1px solid #7878a044;padding:6px 16px;border-radius:8px;margin:0 4px;">Discussion</a>
</p>

</div>

<br/>
