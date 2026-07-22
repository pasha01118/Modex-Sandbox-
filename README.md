<div align="center">

<!-- HEADER SVG — see header.svg for source -->
<img src="header.svg" alt="MODEX - Autonomous Agentic Web UI" width="100%" style="max-width:800px;height:auto;">

<br/><br/>

<!-- STATUS BADGES WITH NEON TEAL + DARK VIOLET -->
<p>
  <span style="display:inline-block;padding:6px 16px;margin:3px;border-radius:20px;background:linear-gradient(135deg,#2d0a4e,#1a0030);border:1px solid #00f5ff66;color:#00f5ff;font-family:'Arial Black',sans-serif;font-size:12px;font-weight:900;text-shadow:0 0 12px #00f5ffaa;">● ACTIVE</span>
  <span style="display:inline-block;padding:6px 16px;margin:3px;border-radius:20px;background:linear-gradient(135deg,#2d0a4e,#1a0030);border:1px solid #7c3aed66;color:#7c3aed;font-family:'Arial Black',sans-serif;font-size:12px;font-weight:900;text-shadow:0 0 12px #7c3aedaa;">● AGENTIC</span>
  <span style="display:inline-block;padding:6px 16px;margin:3px;border-radius:20px;background:linear-gradient(135deg,#2d0a4e,#1a0030);border:1px solid #ff660066;color:#ff6600;font-family:'Arial Black',sans-serif;font-size:12px;font-weight:900;text-shadow:0 0 12px #ff6600aa;">⬡ CROSS-PLATFORM</span>
  <span style="display:inline-block;padding:6px 16px;margin:3px;border-radius:20px;background:linear-gradient(135deg,#2d0a4e,#1a0030);border:1px solid #22c55e66;color:#22c55e;font-family:'Arial Black',sans-serif;font-size:12px;font-weight:900;text-shadow:0 0 12px #22c55eaa;">&#9998; MIT</span>
</p>

</div>

---

<div style="background:linear-gradient(135deg,#1a0030,#2d0a4e,#4a0e6b);padding:30px 20px;border-radius:16px;border:1px solid #ff00ff44;box-shadow:0 0 40px #ff00ff22,inset 0 0 60px #00000044;margin:20px 0;">

<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:28px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#00f5ff,#ff00ff,#ff6600);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;margin:0 0 20px 0;">
  ⚡ ONE COMMAND — ZERO CONFIG ⚡
</h2>

<div align="center" style="background:#0a0a1e;border-radius:12px;padding:4px;border:1px solid #ff00ff33;box-shadow:0 0 20px #ff00ff11;">
<pre style="background:transparent;color:#00f5ff;font-family:Consolas,'Courier New',monospace;font-size:15px;padding:16px 24px;margin:0;overflow-x:auto;white-space:pre-wrap;text-shadow:0 0 12px #00f5ff44;">
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
  <details style="display:inline-block;max-width:650px;background:#1a0030;border-radius:10px;border:1px solid #00f5ff44;padding:0;color:#c0c0e0;font-family:Consolas,monospace;font-size:13px;text-align:left;">
    <summary style="padding:12px 20px;cursor:pointer;color:#00f5ff;font-weight:900;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;text-shadow:0 0 12px #00f5ffaa;letter-spacing:1px;">🧹 Clean Uninstall</summary>
    <pre style="background:#0a0a1e;color:#c0c0e0;font-family:Consolas,monospace;font-size:12px;padding:16px 20px;margin:0;overflow-x:auto;white-space:pre-wrap;border-radius:0 0 10px 10px;border-top:1px solid #ff336644;">
<span style="color:#ef4444;font-weight:700;"># Stop running servers first</span>
<span style="color:#22c55e;">pkill -f "codexapp"</span>         <span style="color:#6060a0;"># stop MODEX server</span>
<span style="color:#22c55e;">tmux kill-server</span> 2>/dev/null  <span style="color:#6060a0;"># kill tmux sessions</span>

<span style="color:#ef4444;font-weight:700;"># Remove app data (all state, sessions, agents, configs)</span>
<span style="color:#22c55e;">rm -rf ~/.codex</span>             <span style="color:#6060a0;"># all MODEX data (50+ files/dirs)</span>

<span style="color:#ef4444;font-weight:700;"># Remove app folder</span>
<span style="color:#22c55e;">rm -rf Modex-Sandbox-</span>       <span style="color:#6060a0;"># app source + build artifacts</span>

<span style="color:#ef4444;font-weight:700;"># Clean temp files (optional)</span>
<span style="color:#22c55e;">rm -rf /tmp/codex-*</span>         <span style="color:#6060a0;"># temp media, uploads, schemas</span>
<span style="color:#22c55e;">rm -rf /tmp/codexui-*</span>       <span style="color:#6060a0;"># review patches, account ops</span>

<span style="color:#ef4444;font-weight:700;"># Remove Composio (optional, ~120MB)</span>
<span style="color:#22c55e;">rm -rf ~/.composio</span>          <span style="color:#6060a0;"># Composio CLI + tools</span>

<span style="color:#ef4444;font-weight:700;"># Remove global npm installs (optional)</span>
<span style="color:#22c55e;">npm uninstall -g @openai/codex</span>
    </pre>
    <div style="padding:10px 20px;color:#6060a0;font-size:11px;border-top:1px solid #00f5ff44;">
      Removes all MODEX data including: auth tokens, sessions, agent configs, token usage,
      task queue, memory, learning data, encrypted vaults, SQLite databases, and skills.
      If you set a custom <span style="color:#ff6600;">$CODEX_HOME</span>, use that path instead of <span style="color:#22c55e;">~/.codex</span>.
      Does NOT remove <span style="color:#22c55e;">~/.shared-skills</span> (shared across projects).
    </div>
  </details>
</div>

<br/>

<!-- QUICK OPTIONS CARDS -->
<div align="center">

<div style="display:inline-block;margin:8px;padding:14px 22px;border-radius:12px;background:linear-gradient(135deg,#00f5ff11,#00f5ff05);border:1px solid #00f5ff44;max-width:300px;vertical-align:top;text-align:left;">
  <span style="color:#00f5ff;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;text-shadow:0 0 12px #00f5ffaa;">🧠 With Local AI</span>
  <pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:12px;margin:8px 0 0;padding:0;white-space:pre-wrap;"><span style="color:#22c55e;">./run.sh --ollama</span>
<span style="color:#6060a0;"># Auto-installs Ollama + starter model</span></pre>
</div>

<div style="display:inline-block;margin:8px;padding:14px 22px;border-radius:12px;background:linear-gradient(135deg,#ff00ff11,#ff00ff05);border:1px solid #ff00ff44;max-width:300px;vertical-align:top;text-align:left;">
  <span style="color:#ff00ff;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;text-shadow:0 0 12px #ff00ffaa;">📱 On Android/Termux</span>
  <pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:12px;margin:8px 0 0;padding:0;white-space:pre-wrap;"><span style="color:#22c55e;">./run.sh</span>  <span style="color:#6060a0;"># Tab 1: app server</span>
<span style="color:#22c55e;">bash scripts/install-ollama-termux.sh</span>  <span style="color:#6060a0;"># Tab 2: AI models</span></pre>
</div>

</div>
</div>

---

<!-- FEATURES GRID -->
<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:24px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#00f5ff,#ff00ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">🔥 THE STACK</h2>

<div align="center">

<table style="border-collapse:collapse;width:100%;max-width:900px;margin:20px 0;">
<tr>
<td style="padding:18px 20px;border:1px solid #00f5ff33;border-radius:12px 0 0 0;background:linear-gradient(135deg,#00f5ff08,#00f5ff02);">
  <div style="font-size:15px;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-weight:900;color:#00f5ff;text-shadow:0 0 15px #00f5ffaa;">💬 Chat</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Threads, forks, conversations with AI</div>
</td>
<td style="padding:18px 20px;border:1px solid #ff00ff33;background:linear-gradient(135deg,#ff00ff08,#ff00ff02);">
  <div style="font-size:15px;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-weight:900;color:#ff00ff;text-shadow:0 0 15px #ff00ff44;">🤖 Auto-Pilot</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Autonomous agents plan → execute → self-correct</div>
</td>
</tr>
<tr>
<td style="padding:18px 20px;border:1px solid #ff660033;background:linear-gradient(135deg,#ff660008,#ff660002);">
  <div style="font-size:15px;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-weight:900;color:#ff6600;text-shadow:0 0 15px #ff660044;">🧠 Ollama</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Local models: pull, test, delete, device-suggested</div>
</td>
<td style="padding:18px 20px;border:1px solid #22c55e33;background:linear-gradient(135deg,#22c55e08,#22c55e02);">
  <div style="font-size:15px;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-weight:900;color:#22c55e;text-shadow:0 0 15px #22c55e44;">⚡ Skills</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Marketplace, install, manage AI plugins</div>
</td>
</tr>
<tr>
<td style="padding:18px 20px;border:1px solid #00f5ff33;border-radius:0 0 0 12px;background:linear-gradient(135deg,#00f5ff08,#00f5ff02);">
  <div style="font-size:15px;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-weight:900;color:#00f5ff;text-shadow:0 0 15px #00f5ff44;">🛡️ Security</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Socket/SBOM supply-chain monitoring</div>
</td>
<td style="padding:18px 20px;border:1px solid #ff00ff33;background:linear-gradient(135deg,#ff00ff08,#ff00ff02);">
  <div style="font-size:15px;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-weight:900;color:#ff00ff;text-shadow:0 0 15px #ff00ff44;">🗄️ Supabase</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Database, auth, storage from the panel</div>
</td>
</tr>
<tr>
<td style="padding:18px 20px;border:1px solid #ff660033;background:linear-gradient(135deg,#ff660008,#ff660002);">
  <div style="font-size:15px;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-weight:900;color:#ff6600;text-shadow:0 0 15px #ff660044;">👁️ Sentinels</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Security agent health + live status cards</div>
</td>
<td style="padding:18px 20px;border:1px solid #22c55e33;border-radius:0 0 12px 0;background:linear-gradient(135deg,#22c55e08,#22c55e02);">
  <div style="font-size:15px;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-weight:900;color:#22c55e;text-shadow:0 0 15px #22c55e44;">🔧 Maintenance</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Auto-heal, health checks, git auto-update</div>
</td>
</tr>
<tr>
<td style="padding:18px 20px;border:1px solid #ff660033;background:linear-gradient(135deg,#ff660008,#ff660002);">
  <div style="font-size:15px;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-weight:900;color:#ff6600;text-shadow:0 0 15px #ff660044;">👑 MODEX HOD</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">Boss agent with persistent memory, roadmap enforcement, scope guard</div>
</td>
<td style="padding:18px 20px;border:1px solid #00f5ff33;background:linear-gradient(135deg,#00f5ff08,#00f5ff02);">
  <div style="font-size:15px;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-weight:900;color:#00f5ff;text-shadow:0 0 15px #00f5ff44;">📱 Mobile-First</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:4px;">9-tab responsive layout, Termux-ready</div>
</td>
</tr>
</table>

</div>

---

<!-- AGENT SYSTEM DEEP DIVE -->
<div style="background:linear-gradient(135deg,#1a0030,#2d0a4e,#4a0e6b);padding:30px 20px;border-radius:16px;border:1px solid #00f5ff44;box-shadow:0 0 40px #00f5ff22,inset 0 0 60px #00000044;margin:20px 0;">

<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:26px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#00f5ff,#ff00ff,#ff6600);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">
  🤖 AUTO-PILOT — AGENTIC SYSTEM
</h2>

<div align="center" style="color:#00f5ff;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;letter-spacing:1px;text-shadow:0 0 12px #00f5ff66;margin-bottom:20px;">
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
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#00f5ff;text-shadow:0 0 12px #00f5ff88;">🧠 Planner Agent</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Uses local Ollama to break goals into concrete, dependency-ordered steps
  </div>
</div>

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#ff00ff11,#ff00ff05);border:1px solid #ff00ff44;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#ff00ff;text-shadow:0 0 12px #ff00ff88;">⚡ Executor Agent</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Runs steps via 13+ tools: shell, file I/O, git, search, glob
  </div>
</div>

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#22c55e11,#22c55e05);border:1px solid #22c55e44;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#22c55e;text-shadow:0 0 12px #22c55e88;">🔧 Maintainer Agent</div>
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

<!-- MODEX HOD AGENT -->
<div style="background:linear-gradient(135deg,#1a0030,#2d0a4e,#4a0e6b);padding:30px 20px;border-radius:16px;border:1px solid #ff660044;box-shadow:0 0 40px #ff660022,inset 0 0 60px #00000044;margin:20px 0;">

<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:26px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#ff6600,#ff00ff,#00f5ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">
  👑 MODEX — HEAD OF DEPARTMENT
</h2>

<div align="center" style="color:#00f5ff;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;letter-spacing:1px;text-shadow:0 0 12px #00f5ff66;margin-bottom:20px;">
  <span style="color:#00f5ff;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;text-shadow:0 0 12px #00f5ff66;">Boss agent with persistent memory — never forgets, never leaves the roadmap</span>
</div>

<!-- WORKING STYLE PIPELINE -->
<div align="center" style="background:#0a0a1e;border-radius:12px;padding:20px;border:1px solid #ff660033;margin-bottom:20px;">
<pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:13px;margin:0;line-height:2;text-align:center;display:inline-block;">
<span style="color:#ff6600;font-weight:700;">PLAN</span>  →  <span style="color:#00f5ff;font-weight:700;">CHECK</span>  →  <span style="color:#ff00ff;font-weight:700;">DO</span>  →  <span style="color:#22c55e;font-weight:700;">VERIFY</span>  →  <span style="color:#f59e0b;font-weight:700;">LEARN</span>  →  <span style="color:#6366f1;font-weight:700;">NEXT</span>
  │          │          │           │            │           │
  ▼          ▼          ▼           ▼            ▼           ▼
 Define    Gate      Execute    Run        Record      Move to
 roadmap   checks   task       criteria   outcomes    next task
</pre>
</div>

<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#ff660011,#ff660005);border:1px solid #ff660044;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#ff6600;text-shadow:0 0 12px #ff660088;">📋 Roadmap Enforcement</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    6-phase roadmap with gate conditions. No phase skips — every task must pass verification before moving on.
  </div>
</div>

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#00f5ff11,#00f5ff05);border:1px solid #00f5ff44;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#00f5ff;text-shadow:0 0 12px #00f5ff88;">🧠 Persistent Memory</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Decisions, learnings, and context notes persist to disk. Survives crashes, never loses project state.
  </div>
</div>

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#22c55e11,#22c55e05);border:1px solid #22c55e44;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#22c55e;text-shadow:0 0 12px #22c55e88;">🛡️ Scope Guard</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Detects scope creep. Blocks tasks not in the roadmap. Protects projects from getting spoiled or damaged.
  </div>
</div>

</div>

<br/>

<!-- 6-PHASE ROADMAP -->
<div style="background:#0a0a1e;border-radius:12px;padding:20px;border:1px solid #ff660033;">
<pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:12px;margin:0;line-height:1.8;text-align:left;display:inline-block;">
<span style="color:#ff6600;font-weight:700;">Default 6-Phase Roadmap:</span>

  <span style="color:#00f5ff;">Phase 1: Discovery & Planning</span>    gate: plan-complete, scope-defined
  <span style="color:#00f5ff;">Phase 2: Architecture & Design</span>   gate: architecture-approved, data-model-defined
  <span style="color:#ff00ff;">Phase 3: Implementation</span>          gate: core-features-built, tests-written
  <span style="color:#ff00ff;">Phase 4: Testing & QA</span>            gate: all-tests-pass, no-critical-bugs
  <span style="color:#22c55e;">Phase 5: Deployment & Release</span>    gate: docs-complete, build-verified
  <span style="color:#22c55e;">Phase 6: Review & Retrospective</span>  gate: review-complete, learnings-recorded
</pre>
</div>

<br/>

<div align="center" style="color:#7878a0;font-family:Consolas,monospace;font-size:12px;line-height:1.8;">
  <span style="color:#ff6600;">Health Monitoring</span> — real-time scoring with healthy/warning/critical/stalled states<br/>
  <span style="color:#ff00ff;">Decision Log</span> — every action recorded with rationale and reversibility<br/>
  <span style="color:#00f5ff;">Learning System</span> — patterns and anti-patterns accumulate across tasks
</div>

</div>
---

<!-- TOKEN ACCOUNTANT -->
<div style="background:linear-gradient(135deg,#1a0030,#2d0a4e,#4a0e6b);padding:30px 20px;border-radius:16px;border:1px solid #22c55e44;box-shadow:0 0 40px #22c55e22,inset 0 0 60px #00000044;margin:20px 0;">

<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:26px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#22c55e,#00f5ff,#ff6600);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">
  $ TOKEN ACCOUNTANT
</h2>

<div align="center" style="color:#00f5ff;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;letter-spacing:1px;text-shadow:0 0 12px #00f5ff66;margin-bottom:20px;">
  Live API usage tracker with budget alarms — never overspend on tokens
</div>

<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#22c55e11,#22c55e05);border:1px solid #22c55e44;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#22c55e;text-shadow:0 0 12px #22c55e44;">$ Live Usage Tracking</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Real-time token counting across all providers — Ollama, OpenRouter, Codex, Zen. Every API call logged with cost estimates.
  </div>
</div>

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#f59e0b11,#f59e0b05);border:1px solid #f59e0b44;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#f59e0b;text-shadow:0 0 12px #f59e0b44;">! Budget Alarms</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Set monthly budget in USD. Configure alarm thresholds (75%, 90%, 95% or any custom %). Get warned before you overspend.
  </div>
</div>

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#00f5ff11,#00f5ff05);border:1px solid #00f5ff44;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#00f5ff;text-shadow:0 0 12px #00f5ff44;">^ Optimization Tips</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Agent advises when to switch to local Ollama, when context is bloated, and which providers cost more. Smart routing guidance.
  </div>
</div>

</div>

<br/>

<div align="center" style="background:#0a0a1e;border-radius:12px;padding:16px;border:1px solid #22c55e33;">
<pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:12px;margin:0;line-height:1.8;text-align:left;display:inline-block;">
<span style="color:#22c55e;font-weight:700;">Dashboard Features:</span>

  <span style="color:#f59e0b;">Used / Saved / Cost</span> — big number cards with period selector
  <span style="color:#00f5ff;">Provider Breakdown</span> — per-provider token usage and cost table
  <span style="color:#ff00ff;">Model Breakdown</span> — per-model usage and cost table
  <span style="color:#22c55e;">Daily Chart</span> — 7-day bar chart of token consumption
  <span style="color:#ff6600;">Budget Settings</span> — monthly USD cap + configurable alarm thresholds
  <span style="color:#6366f1;">Recent Activity</span> — last API calls with provider, model, tokens, cost
  <span style="color:#ef4444;">Alarm Banner</span> — flashing red alert when budget threshold is crossed
</pre>
</div>

</div>

---

<!-- ALIVE AGENTS -->
<div style="background:linear-gradient(135deg,#1a0030,#2d0a4e,#4a0e6b);padding:30px 20px;border-radius:16px;border:1px solid #8b5cf644;box-shadow:0 0 40px #8b5cf622,inset 0 0 60px #00000044;margin:20px 0;">

<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:26px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#8b5cf6,#00f5ff,#ff6600);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">
  🤖 ALIVE AGENTS — TEAM CHAT
</h2>

<div align="center" style="color:#00f5ff;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;letter-spacing:1px;text-shadow:0 0 12px #00f5ff66;margin-bottom:20px;">
  Live group chat where all agents talk to each other — your AI team in real-time
</div>

<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#8b5cf611,#8b5cf605);border:1px solid #8b5cf644;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#8b5cf6;text-shadow:0 0 12px #8b5cf644;">💬 Team Chat</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Real-time group chat with @mentions. Every agent narrates actions and milestones. User commands (stop, wait, resume) are obeyed instantly.
  </div>
</div>

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#00f5ff11,#00f5ff05);border:1px solid #00f5ff44;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#00f5ff;text-shadow:0 0 12px #00f5ff44;">🏪 Agent Market</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Create unlimited custom agents. Set name, role, personality, skills, qualifications. Assign to projects. Delete when done.
  </div>
</div>

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#22c55e11,#22c55e05);border:1px solid #22c55e44;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#22c55e;text-shadow:0 0 12px #22c55e44;">📈 Growth & Learning</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    XP and leveling system. Pattern analysis from experience. Leaderboard. Self-improvement suggestions based on success rates.
  </div>
</div>

</div>

<br/>

<div align="center" style="background:#0a0a1e;border-radius:12px;padding:16px;border:1px solid #8b5cf633;">
<pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:12px;margin:0;line-height:1.8;text-align:left;display:inline-block;">
<span style="color:#8b5cf6;font-weight:700;">Built-in Agents:</span>

  <span style="color:#ff6600;">👑 MODEX</span>       Head of Department — leads the team, enforces process
  <span style="color:#00f5ff;">🧠 Atlas</span>       Lead Architect — plans, designs, documents
  <span style="color:#ff00ff;">⚒️ Forge</span>       Senior Engineer — builds, executes, delivers
  <span style="color:#22c55e;">🛡️ Sentinel</span>    DevOps Lead — monitors, protects, heals
  <span style="color:#f59e0b;">💰 Ledger</span>      Token Accountant — tracks costs, warns on budget
  <span style="color:#6366f1;">🔍 Guard</span>       Auditor & Inspector — checks, approves, rejects

<span style="color:#8b5cf6;font-weight:700;">User Commands (highest priority):</span>

  <span style="color:#ef4444;">stop</span>     — halt all agents immediately
  <span style="color:#f59e0b;">wait</span>     — pause all agents
  <span style="color:#22c55e;">resume</span>   — resume paused agents
  <span style="color:#00f5ff;">status</span>   — get team status report

<span style="color:#8b5cf6;font-weight:700;">Chat Persistence:</span>

  <span style="color:#a0a0c0;">Daily log rotation at ~/.codex/agent-messages/YYYY-MM-DD.json</span>
  <span style="color:#a0a0c0;">Kept until user deletes — never auto-purged</span>
  <span style="color:#a0a0c0;">SSE real-time stream for live chat updates</span>
</pre>
</div>

</div>

---

<!-- ARCHITECTURE -->
<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:24px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#ff6600,#ff00ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">🏗️ ARCHITECTURE</h2>

<div align="center" style="background:#0a0a1e;border-radius:12px;padding:20px;border:1px solid #ff00ff33;margin:20px 0;overflow-x:auto;">
<pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:12px;margin:0;line-height:1.7;text-align:left;display:inline-block;">
<span style="color:#ff6600;">src/</span>
├── <span style="color:#00f5ff;">api/</span>              <span style="color:#6060a0;"># API clients (ollama, sentinel, supabase...)</span>
├── <span style="color:#00f5ff;">cli/</span>              <span style="color:#6060a0;"># CLI entry point</span>
├── <span style="color:#00f5ff;">components/</span>
│   ├── <span style="color:#00f5ff;">content/</span>        <span style="color:#6060a0;"># Panels: Chat, AutoPilot, Ollama, Skills, Security...</span>
│   ├── <span style="color:#00f5ff;">mobile/</span>          <span style="color:#6060a0;"># MobileBottomNav (10 tabs)</span>
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
│   │   ├── <span style="color:#ff6600;">defaultAgents.ts</span>  <span style="color:#6060a0;"># 3 built-in agents</span>
│   │   ├── <span style="color:#ff6600;">modexMemory.ts</span>    <span style="color:#ff6600;font-weight:700;"># ★ MODEX persistent memory</span>
│   │   ├── <span style="color:#ff6600;">modexBoss.ts</span>      <span style="color:#ff6600;font-weight:700;"># ★ MODEX HOD brain</span>
│   │   ├── <span style="color:#ff6600;">modexOrchestrator.ts</span> <span style="color:#ff6600;font-weight:700;"># ★ MODEX compliance gate</span>
│   │   ├── <span style="color:#ff6600;">modexApi.ts</span>      <span style="color:#ff6600;font-weight:700;"># ★ MODEX REST API</span>
│   │   ├── <span style="color:#22c55e;">tokenPricing.ts</span>    <span style="color:#22c55e;font-weight:700;"># ★ Per-model pricing table</span>
│   │   ├── <span style="color:#22c55e;">tokenAccountant.ts</span> <span style="color:#22c55e;font-weight:700;"># ★ Token tracker + budget alarms</span>
│   │   ├── <span style="color:#22c55e;">tokenAccountantApi.ts</span> <span style="color:#22c55e;font-weight:700;"># ★ Token REST API</span>
│   │   ├── <span style="color:#8b5cf6;">agentIdentities.ts</span> <span style="color:#8b5cf6;font-weight:700;"># ★ Agent identity registry + badges</span>
│   │   ├── <span style="color:#8b5cf6;">agentMessageBroker.ts</span> <span style="color:#8b5cf6;font-weight:700;"># ★ Message bus + SSE + commands</span>
│   │   ├── <span style="color:#8b5cf6;">agentLearning.ts</span>  <span style="color:#8b5cf6;font-weight:700;"># ★ XP, growth, pattern analysis</span>
│   │   ├── <span style="color:#8b5cf6;">auditorAgent.ts</span>   <span style="color:#8b5cf6;font-weight:700;"># ★ Guard audit checkpoints</span>
│   │   ├── <span style="color:#8b5cf6;">agentMarket.ts</span>    <span style="color:#8b5cf6;font-weight:700;"># ★ Agent CRUD + assignment</span>
│   │   └── <span style="color:#8b5cf6;">customAgentFactory.ts</span> <span style="color:#8b5cf6;font-weight:700;"># ★ Dynamic agent creation</span>
│   ├── <span style="color:#ef4444;">secretsVault.ts</span>  <span style="color:#ef4444;font-weight:700;"># ★ AES-256-GCM encryption at rest</span>
│   ├── <span style="color:#22c55e;">agentRouter.ts</span>    <span style="color:#6060a0;"># 17 agent API endpoints</span>
│   ├── <span style="color:#8b5cf6;">agentMessageApi.ts</span> <span style="color:#8b5cf6;font-weight:700;"># ★ Alive Agents REST + SSE API</span>
│   ├── <span style="color:#22c55e;">ollamaRouter.ts</span>   <span style="color:#6060a0;"># Ollama backend proxy</span>
│   ├── <span style="color:#22c55e;">sentinelRouter.ts</span> <span style="color:#6060a0;"># Security agents</span>
│   └── <span style="color:#22c55e;">codexAppServerBridge.ts</span> <span style="color:#6060a0;"># Central API bridge</span>
└── <span style="color:#ff6600;">scripts/</span>
    ├── <span style="color:#ef4444;">encrypt-community-keys.js</span> <span style="color:#ef4444;font-weight:700;"># ★ One-time key encryption setup</span>
    ├── <span style="color:#22c55e;">install-ollama-termux.sh</span> <span style="color:#6060a0;"># Termux Ollama installer</span>
    └── <span style="color:#22c55e;">fix-pty-native-build.cjs</span>  <span style="color:#6060a0;"># node-pty postinstall fix</span>
</pre>
</div>

---

<!-- OLLAMA SECTION -->
<div style="background:linear-gradient(135deg,#1a0030,#2d0a4e,#4a0e6b);padding:30px 20px;border-radius:16px;border:1px solid #ff660044;box-shadow:0 0 40px #ff660022,inset 0 0 60px #00000044;margin:20px 0;">

<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:24px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#ff6600,#ff00ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">
  🧠 LOCAL AI — OLLAMA
</h2>

<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">

<div style="flex:1;min-width:200px;padding:14px;border-radius:10px;background:linear-gradient(135deg,#ff660011,#ff660005);border:1px solid #ff660044;">
  <div style="font-size:14px;color:#ff6600;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-weight:900;text-shadow:0 0 12px #ff660088;">🔌 Connection Status</div>
  <div style="font-size:12px;color:#7878a0;margin-top:4px;">Auto-detects Ollama on port 11434</div>
</div>

<div style="flex:1;min-width:200px;padding:14px;border-radius:10px;background:linear-gradient(135deg,#00f5ff11,#00f5ff05);border:1px solid #00f5ff44;">
  <div style="font-size:14px;color:#00f5ff;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-weight:900;text-shadow:0 0 12px #00f5ff88;">💾 Device-Aware Suggestions</div>
  <div style="font-size:12px;color:#7878a0;margin-top:4px;">Scans RAM, recommends models that fit</div>
</div>

<div style="flex:1;min-width:200px;padding:14px;border-radius:10px;background:linear-gradient(135deg,#ff00ff11,#ff00ff05);border:1px solid #ff00ff44;">
  <div style="font-size:14px;color:#ff00ff;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-weight:900;text-shadow:0 0 12px #ff00ff88;">📥 Streaming Pull</div>
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
<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:24px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#22c55e,#00f5ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">🔧 SELF-MAINTENANCE</h2>

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

<!-- SECURITY -->
<div style="background:linear-gradient(135deg,#1a0030,#2d0a4e,#4a0e6b);padding:30px 20px;border-radius:16px;border:1px solid #ef444444;box-shadow:0 0 40px #ef444422,inset 0 0 60px #00000044;margin:20px 0;">

<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:26px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#ef4444,#ff6600,#22c55e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">
  🔒 ENTERPRISE SECURITY
</h2>

<div align="center" style="color:#00f5ff;font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;letter-spacing:1px;text-shadow:0 0 12px #00f5ff66;margin-bottom:20px;">
  AES-256-GCM encryption at rest · Rate limiting · Security headers · Zero-trust child processes
</div>

<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#ef444411,#ef444405);border:1px solid #ef444444;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#ef4444;text-shadow:0 0 12px #ef444444;">🔐 SecretsVault (AES-256-GCM)</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    All API keys, OAuth tokens, and session data encrypted at rest with machine-bound keys. Transparent migration from plaintext — zero user friction.
  </div>
</div>

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#ff660011,#ff660005);border:1px solid #ff660044;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#ff6600;text-shadow:0 0 12px #ff660044;">🛡️ Security Headers</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    X-Frame-Options: DENY, CSP, X-Content-Type-Options: nosniff, HSTS, Referrer-Policy, Permissions-Policy on all responses.
  </div>
</div>

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#22c55e11,#22c55e05);border:1px solid #22c55e44;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#22c55e;text-shadow:0 0 12px #22c55e44;">🚫 Rate Limiting</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Login: 5 attempts / 15 min window, 30 min lockout. WebSocket Origin validation. Body size limits on all endpoints.
  </div>
</div>

<div style="flex:1;min-width:250px;padding:16px;border-radius:10px;background:linear-gradient(135deg,#8b5cf611,#8b5cf605);border:1px solid #8b5cf644;">
  <div style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:14px;font-weight:900;color:#8b5cf6;text-shadow:0 0 12px #8b5cf644;">🤖 Agent Tool Security</div>
  <div style="font-size:12px;color:#7878a0;font-family:Consolas,monospace;margin-top:6px;line-height:1.5;">
    Path traversal prevention, command injection protection, env var regex blocklist, sensitive file access denial.
  </div>
</div>

</div>

<br/>

<div align="center" style="background:#0a0a1e;border-radius:12px;padding:16px;border:1px solid #ef444433;">
<pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:12px;margin:0;line-height:1.8;text-align:left;display:inline-block;">
<span style="color:#ef4444;font-weight:700;">What's Protected:</span>

  <span style="color:#22c55e;">auth.json</span>              OAuth tokens encrypted at rest (AES-256-GCM)
  <span style="color:#22c55e;">webui-auth-sessions.json</span> Session tokens encrypted at rest
  <span style="color:#22c55e;">community-keys.enc</span>     OpenRouter community keys (removed from source)
  <span style="color:#22c55e;">webui-custom-providers.json</span>  Custom provider API keys encrypted

<span style="color:#ef4444;font-weight:700;">Child Process Isolation:</span>

  <span style="color:#ff6600;">getSafeEnv()</span>   Whitelist-only env vars passed to child processes
  <span style="color:#ff6600;">No API keys</span>    Secrets never leak to spawned commands or tools

<span style="color:#ef4444;font-weight:700;">Web Security:</span>

  <span style="color:#00f5ff;">robots.txt</span>           Blocks all crawlers including AI bots (GPTBot, ClaudeBot)
  <span style="color:#00f5ff;">Meta robots</span>         noindex, nofollow, noarchive, nosnippet
  <span style="color:#00f5ff;">CSP</span>                 default-src 'self'; frame-ancestors 'none'
  <span style="color:#00f5ff;">Secure cookies</span>      HttpOnly + SameSite=Lax + Secure (HTTPS)
</pre>
</div>

</div>

---

<!-- TECH STACK -->
<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:24px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#ff00ff,#ff6600);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">⚙️ TECH STACK</h2>

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
<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:24px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#00f5ff,#22c55e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">💻 DEVELOPMENT</h2>

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
<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:24px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#ef4444,#ff00ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">🧹 CLEAN UNINSTALL</h2>

<div align="center" style="background:#0a0a1e;border-radius:12px;padding:4px;border:1px solid #ef444433;margin:20px 0;display:inline-block;">
<pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:12px;padding:16px 24px;margin:0;text-align:left;">
<span style="color:#ef4444;font-weight:700;"># Step 1: Stop all running processes</span>
<span style="color:#22c55e;">pkill -f "codexapp"</span>           <span style="color:#6060a0;"># stop MODEX server</span>
<span style="color:#22c55e;">tmux kill-server</span> 2>/dev/null    <span style="color:#6060a0;"># kill tmux sessions</span>

<span style="color:#ef4444;font-weight:700;"># Step 2: Remove all MODEX data</span>
<span style="color:#22c55e;">rm -rf ~/.codex</span>               <span style="color:#6060a0;"># auth, sessions, DBs, agents, configs, vaults</span>

<span style="color:#ef4444;font-weight:700;"># Step 3: Remove app source</span>
<span style="color:#22c55e;">rm -rf Modex-Sandbox-</span>         <span style="color:#6060a0;"># git repo + build artifacts</span>

<span style="color:#ef4444;font-weight:700;"># Step 4: Clean temp files</span>
<span style="color:#22c55e;">rm -rf /tmp/codex-*</span>           <span style="color:#6060a0;"># temp media, uploads, schemas</span>
<span style="color:#22c55e;">rm -rf /tmp/codexui-*</span>         <span style="color:#6060a0;"># review patches, account ops</span>

<span style="color:#ef4444;font-weight:700;"># Step 5: Remove Composio (optional)</span>
<span style="color:#22c55e;">rm -rf ~/.composio</span>            <span style="color:#6060a0;"># Composio CLI (~120MB)</span>

<span style="color:#ef4444;font-weight:700;"># Step 6: Uninstall global CLI (optional)</span>
<span style="color:#22c55e;">npm uninstall -g @openai/codex</span>
</pre>
</div>

---

<!-- CHANGELOG -->
<div style="background:linear-gradient(135deg,#1a0030,#2d0a4e,#4a0e6b);padding:30px 20px;border-radius:16px;border:1px solid #00f5ff44;box-shadow:0 0 40px #00f5ff22,inset 0 0 60px #00000044;margin:20px 0;">

<h2 align="center" style="font-family:'Arial Black','Impact','Helvetica Neue',sans-serif;font-size:26px;font-weight:900;text-shadow:0 0 15px #00f5ff66,0 0 30px #00f5ff33;background:linear-gradient(90deg,#00f5ff,#ff00ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:2px;">
  📋 CHANGELOG
</h2>

<div style="background:#0a0a1e;border-radius:12px;padding:16px;border:1px solid #00f5ff33;">
<pre style="background:transparent;color:#c0c0e0;font-family:Consolas,monospace;font-size:12px;margin:0;line-height:1.8;text-align:left;display:inline-block;">
<span style="color:#00f5ff;font-weight:700;">2026-07-22 — Termux Installation Fix</span>

  <span style="color:#ff6600;">fix:</span> pnpm v11.15+ deprecation of <span style="color:#ff00ff;">pnpm.onlyBuiltDependencies</span> in package.json
  <span style="color:#ff6600;">fix:</span> Moved build approval config to <span style="color:#ff00ff;">pnpm-workspace.yaml</span> (new pnpm standard)
  <span style="color:#ff6600;">fix:</span> Removed invalid <span style="color:#ff00ff;">allowBuilds</span> block from <span style="color:#ff00ff;">pnpm-workspace.yaml</span>
  <span style="color:#ff6600;">fix:</span> <span style="color:#ff00ff;">run.sh</span> now runs targeted <span style="color:#22c55e;">pnpm rebuild</span> for each build-required package
  <span style="color:#22c55e;">result:</span> <span style="color:#c0c0e0;">Zero-config install on Termux with latest pnpm. No more</span>
          <span style="color:#c0c0e0;">ERR_PNPM_IGNORED_BUILDS or manual approve-builds step.</span>
</pre>
</div>

</div>

<!-- FOOTER -->
<div align="center" style="background:linear-gradient(135deg,#1a0030,#2d0a4e,#4a0e6b);padding:20px;border-radius:16px;border:1px solid #ff00ff22;box-shadow:0 0 30px #ff00ff11;margin:20px 0;">

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
