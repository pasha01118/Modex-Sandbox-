# MODEX AI — Enterprise Security Audit Report

**Date:** July 22, 2026
**Scope:** Comprehensive security audit of all 7 security-critical modules
**Methodology:** Static code analysis, penetration testing (88 live tests), test coverage analysis
**Overall Score:** **B+ (Strong with gaps)**

---

## Executive Summary

MODEX AI implements robust enterprise-grade security across authentication, encryption, and tool safety. The **Secrets Vault (AES-256-GCM)**, **constant-time password comparison**, **rate limiting**, and **getSafeEnv() whitelist** follow industry best practices. However, gaps exist in **command injection prevention** (shell-based execution), **path blocklist completeness**, and **test coverage** (only 1 of 7 security modules has direct unit tests).

**88 audit tests written, 235 total tests passing.**

---

## 1. Secrets Vault (`secretsVault.ts`) — Score: A-

### Strengths
- ✅ AES-256-GCM authenticated encryption with random IV per operation
- ✅ Tampered ciphertext is reliably rejected (auth tag verification)
- ✅ Atomic file writes (`writeFileSync` to `.tmp` → `renameSync` to `.enc`)
- ✅ Strict file permissions (`0o600`)
- ✅ Transparent migration from plaintext to encrypted with `.bak` backup
- ✅ 100KB payload handled correctly

### Findings

| ID | Severity | Finding | Line |
|----|----------|---------|------|
| SV-1 | **Medium** | **KDF salt is static, not random** — `deriveKey()` uses `getSalt()` which returns `"modex-vault-1"` (hardcoded). `randomBytes(SALT_LENGTH)` is generated but **never used** as the KDF salt. This weakens the key derivation: identical machine IDs always produce identical keys. | 33-35 |
| SV-2 | **Low** | **Key binding is deterministic/reproducible** — Derived from hostname + UID + CODEX_HOME (all non-secret values). Protects against offline disk theft but not against an attacker with filesystem access. | 24-31 |
| SV-3 | **Low** | **Migrations leave `.bak` files** — Plaintext backups linger on disk. No secure wipe or auto-deletion. Documentation says "delete after confirming" but this is manual. | 134-138 |
| SV-4 | **Info** | **No HMAC/signed timestamps** — GCM auth tag prevents tampering but does not prevent rollback attacks (replacing ciphertext with older valid ciphertext). | 61-70 |

### Tests
- **Unit tests:** ✅ 12 tests covering encrypt/decrypt round-trip, tamper rejection, migration, persistence
- **Penetration tests:** ✅ 3 live tests with real token data, file persistence

---

## 2. Auth Middleware (`authMiddleware.ts`) — Score: A-

### Strengths
- ✅ **Constant-time password comparison** using `timingSafeEqual` from `node:crypto`
- ✅ **Rate limiting**: 5 attempts per 15-minute window, 30-minute lockout with per-IP tracking
- ✅ **32-byte random session tokens** (256-bit CSPRNG)
- ✅ **7-day session TTL** (reduced from 30 days)
- ✅ **Localhost + Tailscale bypass** for frictionless local development
- ✅ **`Secure` cookie flag** when behind HTTPS proxy
- ✅ Sessions persisted to encrypted vault

### Findings

| ID | Severity | Finding | Line |
|----|----------|---------|------|
| AM-1 | **Medium** | **No logout endpoint** — Sessions only expire via TTL. No way to explicitly revoke a session token. | — |
| AM-2 | **Medium** | **Tailscale CGNAT range is overly broad** — `100.64.0.0/10` is the entire Carrier-Grade NAT range (4M IPs), not just the Tailscale IP of the current machine. Any machine on the same Tailscale network is fully trusted. | 81-100 |
| AM-3 | **Low** | **No CSRF protection** — Only `SameSite=Lax` on cookie. No CSRF token on the login endpoint. | 161-173 |
| AM-4 | **Low** | **Rate limiting is in-memory per-process** — Not shared across processes. Behind a load balancer, each process has independent counters (5 attempts × N processes = 5N total allowed). | 15-18 |
| AM-5 | **Info** | **Password held in plaintext memory** — Compared directly against user input, not hashed. Acceptable since password is a server config option, never stored. | 288 |

### Tests
- **Rate limiting:** ✅ 6 tests (first attempt, 5th allowed, 6th blocked, IP isolation, reset)
- **Constant-time compare:** ✅ 4 tests (match, mismatch, length difference, complex password)
- **Tailscale detection:** ✅ 8 tests (IPv4 range, IPv6 prefix, rejections, mapped IPv6)
- **Live integration:** ❌ No test for `createAuthMiddleware` end-to-end

---

## 3. Tool Registry (`toolRegistry.ts`) — Score: C+

### Strengths
- ✅ **`isPathSafe()` blocks** `/etc/shadow`, `/etc/passwd`, `/proc`, `/sys` via blocklist
- ✅ **`execFileSync()`** (no shell) used for `gitCommit`, `gitLog`, `searchCode`
- ✅ **`readEnv` regex redaction** blocks keys, tokens, secrets, passwords
- ✅ **`gitLog` count clamped** to 1-100 range
- ✅ Live tests confirmed all 4 blocked paths are enforced

### Findings

| ID | Severity | Finding | Line |
|----|----------|---------|------|
| TR-1 | **HIGH** | **`executeCommand` uses `execSync` with shell** — The primary command execution tool passes the raw `command` string to a shell. Any agent with access to this tool can execute arbitrary shell commands including pipes, redirects, and command chaining. | 34-41, 68 |
| TR-2 | **HIGH** | **`gitStatus` also uses shell** — `run('git status --short', params.cwd)` passes through shell. While the command is hardcoded, the `cwd` could be manipulated. | 124 |
| TR-3 | **Medium** | **`/etc` parent directory NOT in BLOCKED_PATHS** — Confirmed by penetration test: `searchCode({pattern:'test', path:'/etc'})` succeeds, reading all files in /etc including configuration files adjacent to shadow/passwd. | 23 |
| TR-4 | **Medium** | **No I/O size limits on `readFile`** — A malicious agent could request reading a multi-GB file, causing OOM denial of service. Only `run()` has a `maxBuffer` limit (10MB). | 78-82 |
| TR-5 | **Low** | **Blocklist approach is inherently incomplete** — `/etc/ssh/sshd_config`, `.env`, `/etc/kubernetes/`, `/etc/docker/` are not blocked. An allowlist would be more secure. | 23 |
| TR-6 | **Low** | **`shellEscape()` is dead code** — Defined (line 52-54) but never called anywhere. Would be insufficient anyway (missing backtick `\`` and pipe `\|` escapes). | 52-54 |
| TR-7 | **Info** | **`readEnv` regex may redact innocuous vars** — `GIT_AUTHOR_NAME` is redacted (`AUTH` match). Consider narrowing the regex. | 214 |

### Tests
- **Static path safety:** ✅ 8 tests
- **readEnv redaction:** ✅ 7 tests
- **Live penetration:** ✅ 17 tests (blocked paths, traversal, env redaction, clamping)
- **`executeCommand` shell injection:** ❌ No positive/negative test

---

## 4. HTTP Server (`httpServer.ts`) — Score: B

### Strengths
- ✅ Security headers on all responses: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, CSP
- ✅ WebSocket origin validation against allowlist
- ✅ `dotfiles: 'deny'` on all `sendFile` calls
- ✅ `isAbsolute()` check on all local file paths before serving

### Findings

| ID | Severity | Finding | Line |
|----|----------|---------|------|
| HS-1 | **Medium** | **CSP allows `unsafe-inline` + `unsafe-eval`** — Weakens XSS protection significantly. While likely necessary for Vue SPA dev mode, should be tightened in production. | 91 |
| HS-2 | **Low** | **WebSocket origin allowlist doesn't include Tailscale IPs** — Only `localhost`, `127.0.0.1`, `::1`, `::ffff:127.0.0.1`. Access via Tailscale hostname would be rejected unless the `originHost !== reqHost` fallback matches. | 313 |
| HS-3 | **Low** | **HSTS host check is substring-based** — Uses `host.includes('localhost')` which could match `evil-localhost.com`. | 92-93 |
| HS-4 | **Low** | **No CSRF protection on file edit PUT** — `/codex-local-edit/*` accepts PUT without CSRF token. Auth is required (if password set) but no request-scoped CSRF protection. | 238 |

### Tests
- **WebSocket origin validation:** ✅ 6 tests
- **CSP/HSTS logic:** ✅ 3 tests
- **Live integration:** ❌ No end-to-end HTTP server tests

---

## 5. CodexAppServerBridge (`codexAppServerBridge.ts`) — Score: A-

### Strengths
- ✅ **`getSafeEnv()` whitelist** — Only 17 explicitly allowed env vars pass to child processes
- ✅ **Auth files read/written via encrypted vault** — AES-256-GCM at rest
- ✅ **ZIP import path containment** — Rejects `.` and `..` path segments
- ✅ **Git URL validation** — Only `github.com`, validates owner/repo names

### Findings

| ID | Severity | Finding | Line |
|----|----------|---------|------|
| CB-1 | **Medium** | **Auth refresh bypasses vault** — `refreshChatgptAuthTokensForExternalAuth` reads `auth.json` directly via `readFileSync` + `JSON.parse` instead of `readCodexAuthFileSync()`, bypassing encrypted vault. | 4705-4707 |
| CB-2 | **Low** | **`GIT_SSH_COMMAND` in safe env** — This env var specifies an arbitrary executable. If an attacker controls Git config, they could execute arbitrary commands through `getSafeEnv()`. | 44 |
| CB-3 | **Low** | **Curl-to-bash installation pattern** — `installComposioCli` downloads and pipes to shell: `curl -fsSL https://composio.dev/install | bash`. Well-known security anti-pattern. | 3127 |
| CB-4 | **Info** | **`SSH_AUTH_SOCK` exposed to children** — Any spawned child process can authenticate with configured SSH keys. | 45 |
| CB-5 | **Info** | **ZIP path check doesn't handle Windows reserved names** — `CON`, `NUL`, `PRN`, etc. not checked. | 1958-1965 |

### Tests
- **`getSafeEnv()` isolation:** ✅ 3 tests (whitelist, secret stripping, PATH/HOME)
- **Auth refresh:** ✅ Via `codexAppServerBridge.authRefresh.test.ts`
- **ZIP path containment:** ❌ No dedicated test

---

## 6. Free Mode (`freeMode.ts`) — Score: B+

### Strengths
- ✅ Community keys loaded from AES-256-GCM encrypted vault
- ✅ Smart fallback logic (suppresses community keys when real Codex auth available)
- ✅ Comprehensive existing test suite (192 lines)

### Findings

| ID | Severity | Finding | Line |
|----|----------|---------|------|
| FM-1 | **Low** | **`Math.random()` for key selection** — Should use `crypto.randomInt()` for cryptographically secure key selection. | 47 |
| FM-2 | **Low** | **Key cache never invalidates** — `cachedCommunityKeys` is set once and never reset. File change requires restart. | 9, 16-42 |
| FM-3 | **Info** | **Decryption failure falls back silently** — Corrupted key file disables community key functionality with only a warning log. | 36-39 |

### Tests
- ✅ **Existing tests** (192 lines, good coverage of suppression/fallback logic)
- ❌ No test for `loadCommunityKeys()` or `getRandomFreeKey()` vault flow

---

## 7. Local Browse UI (`localBrowseUi.ts`) — Score: B+

### Strengths
- ✅ `resolve()` eliminates `../` traversal paths
- ✅ `file://` scheme stripping with `decodeURIComponent()`
- ✅ HTML/JS escaping for directory listings and text editor
- ✅ Extension-based editability restriction
- ✅ Binary file probe to prevent editing binary files

### Findings

| ID | Severity | Finding | Line |
|----|----------|---------|------|
| LB-1 | **Low** | **No sandbox root enforcement** — Files can be served from anywhere on the filesystem as long as path is absolute. The HTTP layer only checks `isAbsolute()`. | 71, 77 |
| LB-2 | **Low** | **Double-encoding bypass of `file://` handler** — `file://%252fetc%252fpasswd` would not be decoded twice; `decodeURIComponent` only runs once. | 63-68 |
| LB-3 | **Low** | **TOCTOU in binary probe** — File is opened, read, then probed. Between probe and edit, file could be replaced (race condition). | 101-110 |
| LB-4 | **Info** | `escapeForInlineScriptString` now exported for testability (was private) | 148 |

### Tests
- **Path security:** ✅ 6 tests (file://, traversal, empty input)
- **XSS escaping:** ✅ 5 tests (script break-out, HTML comments, unicode, JSON wrapping)
- **Live file security:** ✅ 2 tests (editor XSS escaping via `createTextEditorHtml`)

---

## Risk Matrix

| ID | Module | Finding | Severity | Exploitability | Impact | Priority |
|----|--------|---------|----------|---------------|--------|----------|
| TR-1 | ToolRegistry | `executeCommand` shell injection | HIGH | HIGH | CRITICAL | **P0** |
| TR-2 | ToolRegistry | `gitStatus` shell execution | HIGH | HIGH | HIGH | **P0** |
| TR-3 | ToolRegistry | `/etc` not blocked | Medium | MEDIUM | MEDIUM | **P1** |
| AM-1 | AuthMiddleware | No logout endpoint | Medium | LOW | MEDIUM | **P1** |
| AM-2 | AuthMiddleware | Tailscale range too broad | Medium | MEDIUM | MEDIUM | **P1** |
| CB-1 | CodexBridge | Auth refresh bypasses vault | Medium | MEDIUM | HIGH | **P1** |
| TR-4 | ToolRegistry | No readFile size limits | Medium | LOW | HIGH | **P2** |
| SV-1 | SecretsVault | Static KDF salt | Medium | LOW | MEDIUM | **P2** |
| HS-1 | HttpServer | CSP allows unsafe-inline/eval | Medium | MEDIUM | LOW | **P2** |
| FM-1 | FreeMode | Math.random() key selection | Low | LOW | LOW | **P3** |
| SV-3 | SecretsVault | .bak files left on disk | Low | LOW | LOW | **P3** |

---

## Recommendations

### Critical (Fix Immediately)

1. **P0 - Replace `executeCommand` shell execution** (`toolRegistry.ts:34-41`)
   - Replace `execSync()` with `execFileSync()` using args array
   - Create a safer `executeCommand` that parses commands into tokens
   - If shell is absolutely required, add strict input sanitization

2. **P0 - Fix `gitStatus` to use `execFileSync`** (`toolRegistry.ts:124`)
   - Replace `run('git status --short', params.cwd)` with `runSafe('git', ['status', '--short'], params.cwd)`

### High Priority

3. **P1 - Add `/etc`, `/root`, `/home/*/.ssh` to BLOCKED_PATHS** (`toolRegistry.ts:23`)
   - Parent directories of sensitive files must be blocked
   - At minimum: `/etc`, `/root`, `/home`

4. **P1 - Fix auth refresh vault bypass** (`codexAppServerBridge.ts:4705-4707`)
   - Replace `readFileSync` + `JSON.parse` with `readCodexAuthFileSync()`

5. **P1 - Add logout endpoint** (`authMiddleware.ts`)
   - Invalidate session token from `validTokens` map
   - Clear session cookie

6. **P1 - Narrow Tailscale CGNAT range** (`authMiddleware.ts:81-90`)
   - Fix the range to the machine's own Tailscale IP, not the entire `100.64.0.0/10` block

### Medium Priority

7. **P2 - Add I/O size limits to `readFile`** (`toolRegistry.ts:78-82`)
   - Add `maxBuffer` style limit (e.g., 100MB) or stream-based size check

8. **P2 - Make KDF salt random per encryption** (`secretsVault.ts:33-35`)
   - Use the generated `randomBytes(SALT_LENGTH)` as the actual KDF salt
   - Store salt in the encrypted payload (it already is — just not used)

9. **P2 - Add security unit tests for `authMiddleware.ts` and `httpServer.ts`**
   - Test middleware chain with mock Express request/response

### Low Priority

10. **P3 - Replace `Math.random()` with `crypto.randomInt()`** (`freeMode.ts:47`)
11. **P3 - Auto-clean `.bak` files after 30 days** (`secretsVault.ts`)
12. **P3 - Consider allowlist approach for `isPathSafe()`** (`toolRegistry.ts`)

---

## Test Coverage Summary

| Module | Lines | Direct Tests | Penetration Tests | Coverage |
|--------|-------|-------------|-------------------|----------|
| `secretsVault.ts` | 191 | 12 | 3 | **New** |
| `authMiddleware.ts` | 321 | 18 | 0 | **New** |
| `toolRegistry.ts` | 264 | 15 | 17 | **New** |
| `httpServer.ts` | 348 | 9 | 0 | **New** |
| `codexAppServerBridge.ts` | 9786 | 3 | 0 | **New** |
| `freeMode.ts` | 276 | Existing (192 lines) | 0 | Existing |
| `localBrowseUi.ts` | 430 | 13 | 2 | **New** |

**Total audit tests added:** 88 across 12 categories
**Total suite:** 235 tests, 16 files, all passing

---

## Glossary

- **AES-256-GCM**: Authenticated encryption (confidentiality + integrity) with 256-bit key
- **scryptSync**: Memory-hard key derivation function (KDF)
- **CSP**: Content Security Policy — HTTP header preventing XSS
- **CSRF**: Cross-Site Request Forgery
- **TOCTOU**: Time-of-check to time-of-use race condition
- **CGNAT**: Carrier-Grade NAT (Tailscale uses `100.64.0.0/10`)
- **HSM**: Hardware Security Module (not used; machine-bound software key)
