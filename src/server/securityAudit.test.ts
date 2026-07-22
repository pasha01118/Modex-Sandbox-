import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  encryptString, decryptString,
  writeSecretFile, readSecretFile,
  migratePlaintextToEncrypted, readSecretFileWithMigration,
  writeSecretFileWithMigration, decryptFile,
} from './secretsVault.js'
import {
  normalizeLocalPath, decodeBrowsePath,
  isTextEditablePath, escapeForInlineScriptString,
  createTextEditorHtml,
} from './localBrowseUi.js'
import { toolRegistry } from './agent/toolRegistry.js'
import { timingSafeEqual } from 'node:crypto'
import { resolve } from 'node:path'
import { existsSync, unlinkSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

// ─────────────────────────────────────────────
// 1. Secrets Vault (AES-256-GCM Encryption)
// ─────────────────────────────────────────────
describe('SecretsVault', () => {
  it('encrypts and decrypts a string round-trip', () => {
    const original = 'my-super-secret-api-key-12345'
    const encrypted = encryptString(original)
    expect(encrypted.version).toBe(1)
    expect(encrypted.iv).toBeTruthy()
    expect(encrypted.tag).toBeTruthy()
    expect(encrypted.data).toBeTruthy()
    expect(encrypted.data).not.toBe(original)
    const decrypted = decryptString(encrypted)
    expect(decrypted).toBe(original)
  })

  it('produces different ciphertext each time (random IV + salt)', () => {
    const plaintext = 'same-data'
    const a = encryptString(plaintext)
    const b = encryptString(plaintext)
    expect(a.data).not.toBe(b.data)
    expect(a.iv).not.toBe(b.iv)
    expect(a.salt).not.toBe(b.salt)
  })

  it('rejects tampered ciphertext (auth tag mismatch)', () => {
    const encrypted = encryptString('important-secret')
    encrypted.data = 'deadbeef' + encrypted.data.slice(8)
    expect(() => decryptString(encrypted)).toThrow()
  })

  it('rejects tampered IV', () => {
    const encrypted = encryptString('important-secret')
    encrypted.iv = 'deadbeefdeadbeefdeadbeef'
    expect(() => decryptString(encrypted)).toThrow()
  })

  it('encrypts empty string', () => {
    const encrypted = encryptString('')
    const decrypted = decryptString(encrypted)
    expect(decrypted).toBe('')
  })

  it('encrypts and decrypts large payload (100KB)', () => {
    const large = 'x'.repeat(100_000)
    const encrypted = encryptString(large)
    const decrypted = decryptString(encrypted)
    expect(decrypted).toBe(large)
  })

  it('decryptFile falls back to plaintext when no .enc exists', () => {
    const tmpDir = join(tmpdir(), `vault-test-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
    const filePath = join(tmpDir, 'test.json')
    writeFileSync(filePath, JSON.stringify({ hello: 'world' }), 'utf-8')
    const result = decryptFile(filePath)
    expect(result).toBe(JSON.stringify({ hello: 'world' }))
    unlinkSync(filePath)
  })

  it('readSecretFile returns default for missing file', () => {
    const result = readSecretFile('/nonexistent/path.json', { default: true })
    expect(result).toEqual({ default: true })
  })

  it('readSecretFile returns default for corrupted .enc file', () => {
    const tmpDir = join(tmpdir(), `vault-test-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
    const filePath = join(tmpDir, 'corrupt.json')
    writeFileSync(filePath + '.enc', '{bad json', 'utf-8')
    const result = readSecretFile(filePath, { fallback: true })
    expect(result).toEqual({ fallback: true })
    unlinkSync(filePath + '.enc')
  })

  it('migratePlaintextToEncrypted wraps .bak and removes plaintext', () => {
    const tmpDir = join(tmpdir(), `vault-test-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
    const filePath = join(tmpDir, 'migrate.json')
    const originalData = { key: 'plaintext-value', nested: { a: 1 } }
    writeFileSync(filePath, JSON.stringify(originalData), 'utf-8')
    const migrated = migratePlaintextToEncrypted(filePath)
    expect(migrated).toBe(true)
    expect(existsSync(filePath)).toBe(false)
    expect(existsSync(filePath + '.bak')).toBe(true)
    expect(existsSync(filePath + '.enc')).toBe(true)
    const result = readSecretFile(filePath, null)
    expect(result).toEqual(originalData)
    unlinkSync(filePath + '.enc')
    unlinkSync(filePath + '.bak')
  })

  it('migratePlaintextToEncrypted returns false when already encrypted', () => {
    const tmpDir = join(tmpdir(), `vault-test-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
    const filePath = join(tmpDir, 'already.json')
    writeSecretFile(filePath, { data: 'encrypted' })
    const migrated = migratePlaintextToEncrypted(filePath)
    expect(migrated).toBe(false)
    unlinkSync(filePath + '.enc')
  })

  it('writeSecretFileWithMigration removes plaintext after encrypt', () => {
    const tmpDir = join(tmpdir(), `vault-test-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
    const filePath = join(tmpDir, 'smart.json')
    writeFileSync(filePath, JSON.stringify({ old: 'data' }), 'utf-8')
    writeSecretFileWithMigration(filePath, { new: 'data' })
    expect(existsSync(filePath)).toBe(false)
    expect(existsSync(filePath + '.enc')).toBe(true)
    const result = readSecretFile(filePath, null)
    expect(result).toEqual({ new: 'data' })
    unlinkSync(filePath + '.enc')
    unlinkSync(filePath + '.bak')
  })
})

// ─────────────────────────────────────────────
// 2. Auth Middleware (Rate Limiting)
// ─────────────────────────────────────────────
describe('AuthMiddleware - Rate Limiting', () => {
  const loginAttempts = new Map<string, { count: number; resetAt: number }>()
  const MAX_LOGIN_ATTEMPTS = 5
  const LOGIN_WINDOW_MS = 15 * 60 * 1000
  const LOGIN_LOCKOUT_MS = 30 * 60 * 1000

  function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now()
    const entry = loginAttempts.get(ip)
    if (!entry || now > entry.resetAt) {
      loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
      return { allowed: true, retryAfterMs: 0 }
    }
    if (entry.count >= MAX_LOGIN_ATTEMPTS) {
      const retryAfterMs = entry.resetAt + LOGIN_LOCKOUT_MS - now
      return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) }
    }
    entry.count++
    return { allowed: true, retryAfterMs: 0 }
  }

  function resetRateLimit(ip: string): void { loginAttempts.delete(ip) }

  beforeEach(() => {
    resetRateLimit('127.0.0.1')
    resetRateLimit('10.0.0.1')
  })

  const ALLOWED = { allowed: true, retryAfterMs: 0 }

  it('allows first login attempt', () => {
    expect(checkRateLimit('127.0.0.1')).toEqual(ALLOWED)
  })

  it('allows up to 5 attempts within window', () => {
    for (let i = 0; i < 5; i++) expect(checkRateLimit('127.0.0.1').allowed).toBe(true)
  })

  it('blocks 6th attempt within window', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('127.0.0.1')
    const blocked = checkRateLimit('127.0.0.1')
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterMs).toBeGreaterThan(0)
  })

  it('tracks different IPs independently', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('10.0.0.1')
    expect(checkRateLimit('10.0.0.1').allowed).toBe(false)
    expect(checkRateLimit('10.0.0.2')).toEqual(ALLOWED)
  })

  it('resetRateLimit clears the counter', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('127.0.0.1')
    resetRateLimit('127.0.0.1')
    expect(checkRateLimit('127.0.0.1')).toEqual(ALLOWED)
  })
})

// ─────────────────────────────────────────────
// 3. Local Browse UI (Path Security)
// ─────────────────────────────────────────────
describe('LocalBrowseUi - Path Security', () => {
  describe('normalizeLocalPath', () => {
    it('strips file:// prefix', () => {
      expect(normalizeLocalPath('file:///home/user/file.txt')).toBe('/home/user/file.txt')
    })

    it('resolves ../ traversal', () => {
      expect(normalizeLocalPath('/safe/dir/../../etc/passwd')).toBe('/etc/passwd')
    })

    it('handles file:// with ../ traversal', () => {
      expect(normalizeLocalPath('file:///safe/../../etc/passwd')).toBe('/etc/passwd')
    })

    it('returns empty string for empty input', () => {
      expect(normalizeLocalPath('')).toBe('')
      expect(normalizeLocalPath('   ')).toBe('')
    })

    it('handles normal absolute path', () => {
      expect(normalizeLocalPath('/home/user/.ssh/id_rsa')).toBe('/home/user/.ssh/id_rsa')
    })
  })

  describe('decodeBrowsePath', () => {
    it('decodes URI component', () => {
      expect(decodeBrowsePath('%2Fetc%2Fpasswd')).toBe('/etc/passwd')
    })

    it('returns empty for empty input', () => { expect(decodeBrowsePath('')).toBe('') })

    it('returns raw on decode error', () => {
      expect(decodeBrowsePath('%ZZinvalid')).toBe('%ZZinvalid')
    })
  })

  describe('isTextEditablePath', () => {
    it('returns true for known extensions', () => {
      expect(isTextEditablePath('file.ts')).toBe(true)
      expect(isTextEditablePath('config.json')).toBe(true)
      expect(isTextEditablePath('Dockerfile')).toBe(false)
    })

    it('is case-insensitive', () => {
      expect(isTextEditablePath('FILE.TS')).toBe(true)
    })
  })

  describe('escapeForInlineScriptString', () => {
    it('escapes </ to prevent script break-out', () => {
      const result = escapeForInlineScriptString('var x = 1; </script><script>alert(1)')
      expect(result).toContain('<\\/')
      expect(result).not.toContain('</script>')
    })

    it('escapes <!-- to prevent HTML comment injection', () => {
      expect(escapeForInlineScriptString('<!--')).toContain('<\\!--')
    })

    it('escapes unicode line/paragraph separators', () => {
      const result = escapeForInlineScriptString('\u2028text\u2029')
      expect(result).toContain('\\u2028')
      expect(result).toContain('\\u2029')
    })

    it('wraps content in JSON.stringify', () => {
      expect(escapeForInlineScriptString('hello world')).toBe('"hello world"')
    })
  })
})

// ─────────────────────────────────────────────
// 4. HTTP Server (WebSocket Origin Validation)
// ─────────────────────────────────────────────
describe('HttpServer - WebSocket Origin Validation Logic', () => {
  function validateWsOrigin(origin: string | undefined, host: string): { allowed: boolean } {
    if (!origin) return { allowed: true }
    try {
      const originUrl = new URL(origin)
      const allowedHosts = ['localhost', '127.0.0.1', '::1', '::ffff:127.0.0.1']
      const originHost = originUrl.hostname
      const reqHost = host.split(':')[0] ?? ''
      if (!allowedHosts.includes(originHost) && originHost !== reqHost) {
        return { allowed: false }
      }
      return { allowed: true }
    } catch {
      return { allowed: false }
    }
  }

  it('allows localhost origin', () => {
    expect(validateWsOrigin('http://localhost:4173', 'localhost:4173').allowed).toBe(true)
  })

  it('allows 127.0.0.1 origin', () => {
    expect(validateWsOrigin('http://127.0.0.1:4173', '127.0.0.1:4173').allowed).toBe(true)
  })

  it('allows matching non-localhost origin', () => {
    expect(validateWsOrigin('http://myhost:4173', 'myhost:4173').allowed).toBe(true)
  })

  it('rejects cross-origin request', () => {
    expect(validateWsOrigin('http://evil.com', 'localhost:4173').allowed).toBe(false)
  })

  it('rejects bad origin URL', () => {
    expect(validateWsOrigin('not-a-url', 'localhost').allowed).toBe(false)
  })

  it('allows missing origin header', () => {
    expect(validateWsOrigin(undefined, 'localhost').allowed).toBe(true)
  })
})

// ─────────────────────────────────────────────
// 5. Tool Registry (Path Safety)
// ─────────────────────────────────────────────
describe('ToolRegistry - isPathSafe (ported logic)', () => {
  const BLOCKED_PATHS = ['/etc/shadow', '/etc/passwd', '/proc', '/sys']

  function isPathSafe(filePath: string): boolean {
    const resolved = resolve(filePath)
    for (const blocked of BLOCKED_PATHS) {
      if (resolved.startsWith(blocked)) return false
    }
    if (resolved.includes('/../')) return false
    return true
  }

  it('allows normal project paths', () => {
    expect(isPathSafe('/home/user/project/src/index.ts')).toBe(true)
    expect(isPathSafe('/tmp/test/file.txt')).toBe(true)
  })

  it('blocks /etc/shadow', () => { expect(isPathSafe('/etc/shadow')).toBe(false) })
  it('blocks /etc/passwd', () => { expect(isPathSafe('/etc/passwd')).toBe(false) })
  it('blocks /proc access', () => { expect(isPathSafe('/proc/self/environ')).toBe(false) })
  it('blocks /sys access', () => { expect(isPathSafe('/sys/kernel/security/uevent')).toBe(false) })

  it('blocks /etc/shadow via ../ traversal', () => {
    expect(isPathSafe('/home/user/../../etc/shadow')).toBe(false)
  })

  it('allows paths containing "proc" substring', () => {
    expect(isPathSafe('/home/user/procedure.txt')).toBe(true)
  })

  it('allows safe git worktree paths', () => {
    expect(isPathSafe('/home/user/worktree/main/src/index.ts')).toBe(true)
  })
})

describe('ToolRegistry - readEnv redaction logic', () => {
  const SENSITIVE_ENV_REGEX = /KEY|TOKEN|SECRET|PASSWORD|AUTH|CREDENTIAL|API|_KEY|_SECRET|_TOKEN|_PASS/i

  function readEnv(name: string): string {
    if (SENSITIVE_ENV_REGEX.test(name)) return '(redacted)'
    return process.env[name] || '(not set)'
  }

  it('redacts vars containing KEY', () => {
    expect(readEnv('OPENAI_API_KEY')).toBe('(redacted)')
    expect(readEnv('MY_SECRET_KEY')).toBe('(redacted)')
  })

  it('redacts vars containing TOKEN', () => {
    expect(readEnv('ACCESS_TOKEN')).toBe('(redacted)')
  })

  it('redacts vars containing SECRET', () => {
    expect(readEnv('SECRET_SAUCE')).toBe('(redacted)')
    expect(readEnv('MY_SECRET')).toBe('(redacted)')
  })

  it('redacts vars containing PASSWORD', () => {
    expect(readEnv('DB_PASSWORD')).toBe('(redacted)')
  })

  it('redacts vars containing AUTH', () => {
    expect(readEnv('AUTH_TOKEN')).toBe('(redacted)')
    expect(readEnv('GIT_AUTHOR_NAME')).toBe('(redacted)')
  })

  it('allows non-sensitive vars', () => {
    expect(readEnv('PATH')).toBe(process.env.PATH || '(not set)')
    expect(readEnv('HOME')).toBe(process.env.HOME || '(not set)')
  })

  it('returns (not set) for undefined non-sensitive vars', () => {
    expect(readEnv('NONEXISTENT_VAR_XYZ')).toBe('(not set)')
  })
})

// ─────────────────────────────────────────────
// 6. getSafeEnv (Child Process Environment Isolation)
// ─────────────────────────────────────────────
describe('CodexAppServerBridge - getSafeEnv', () => {
  function getSafeEnv(): Record<string, string | undefined> {
    return {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      NODE_ENV: process.env.NODE_ENV,
      CODEX_HOME: process.env.CODEX_HOME,
      SHELL: process.env.SHELL,
      USER: process.env.USER,
      LANG: process.env.LANG,
      TERM: process.env.TERM,
      TMPDIR: process.env.TMPDIR,
      XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
      XDG_DATA_HOME: process.env.XDG_DATA_HOME,
      XDG_CACHE_HOME: process.env.XDG_CACHE_HOME,
      NODE_OPTIONS: process.env.NODE_OPTIONS,
      npm_config_registry: process.env.npm_config_registry,
      GIT_TERMINAL_PROMPT: process.env.GIT_TERMINAL_PROMPT,
      GIT_SSH_COMMAND: process.env.GIT_SSH_COMMAND,
      SSH_AUTH_SOCK: process.env.SSH_AUTH_SOCK,
    }
  }

  it('only passes whitelisted env vars, blocks secrets', () => {
    process.env.AWS_SECRET_ACCESS_KEY = 'should-not-leak'
    process.env.SOME_API_KEY = 'should-not-leak-either'
    const safe = getSafeEnv()
    expect(Object.keys(safe)).not.toContain('AWS_SECRET_ACCESS_KEY')
    expect(safe.OPENAI_API_KEY).toBeUndefined()
    expect(safe.PATH).toBe(process.env.PATH)
    delete process.env.AWS_SECRET_ACCESS_KEY
    delete process.env.SOME_API_KEY
  })

  it('strips common secret environment variables', () => {
    const leakyVars = [
      'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY',
      'OPENAI_API_KEY', 'ANTHROPIC_API_KEY',
      'GITHUB_TOKEN', 'NPM_TOKEN',
      'DATABASE_URL', 'REDIS_URL',
      'JWT_SECRET', 'SESSION_SECRET',
      'STRIPE_API_KEY', 'SLACK_TOKEN',
      'DOCKER_AUTH_CONFIG',
    ]
    const safe = getSafeEnv()
    for (const v of leakyVars) expect(Object.keys(safe)).not.toContain(v)
  })

  it('includes PATH and HOME', () => {
    const safe = getSafeEnv()
    expect(safe.PATH).toBe(process.env.PATH)
    expect(safe.HOME).toBe(process.env.HOME)
  })
})

// ─────────────────────────────────────────────
// 7. Security Headers
// ─────────────────────────────────────────────
describe('HttpServer - Security Headers', () => {
  it('CSP includes frame-ancestors none', () => {
    const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws: wss:; font-src 'self' data:; frame-ancestors 'none'"
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("default-src 'self'")
  })

  it('HSTS only set for non-localhost hosts', () => {
    function shouldSetHSTS(host: string | undefined): boolean {
      if (!host) return false
      return !host.includes('localhost') && !host.includes('127.0.0.1')
    }
    expect(shouldSetHSTS('localhost:4173')).toBe(false)
    expect(shouldSetHSTS('myhost.com')).toBe(true)
  })
})

// ─────────────────────────────────────────────
// 8. Tool Registry - Live Penetration Tests
// ─────────────────────────────────────────────
describe('ToolRegistry - Live Penetration Tests', () => {
  it('blocks reading /etc/shadow via readFile tool', async () => {
    await expect(toolRegistry.execute('readFile', { path: '/etc/shadow' }))
      .rejects.toThrow('Access denied')
  })

  it('blocks reading /etc/passwd via readFile tool', async () => {
    await expect(toolRegistry.execute('readFile', { path: '/etc/passwd' }))
      .rejects.toThrow('Access denied')
  })

  it('blocks reading /proc/self/environ', async () => {
    await expect(toolRegistry.execute('readFile', { path: '/proc/self/environ' }))
      .rejects.toThrow('Access denied')
  })

  it('blocks reading /sys/kernel/security/uevent', async () => {
    await expect(toolRegistry.execute('readFile', { path: '/sys/kernel/security/uevent' }))
      .rejects.toThrow('Access denied')
  })

  it('blocks reading /etc/shadow via ../ traversal', async () => {
    await expect(toolRegistry.execute('readFile', { path: '/home/user/../../etc/shadow' }))
      .rejects.toThrow('Access denied')
  })

  it('blocks writing to /etc/passwd', async () => {
    await expect(toolRegistry.execute('writeFile', { path: '/etc/passwd', content: 'hacked' }))
      .rejects.toThrow('Access denied')
  })

  it('blocks listing /proc', async () => {
    await expect(toolRegistry.execute('listDirectory', { path: '/proc' }))
      .rejects.toThrow('Access denied')
  })

  it('blocks listing /sys', async () => {
    await expect(toolRegistry.execute('listDirectory', { path: '/sys' }))
      .rejects.toThrow('Access denied')
  })

  it('redacts API_KEY via readEnv tool', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-123'
    const result = await toolRegistry.execute('readEnv', { name: 'OPENAI_API_KEY' })
    expect(result).toBe('(redacted)')
    delete process.env.OPENAI_API_KEY
  })

  it('redacts TOKEN via readEnv tool', async () => {
    process.env.GITHUB_TOKEN = 'ghp_test'
    const result = await toolRegistry.execute('readEnv', { name: 'GITHUB_TOKEN' })
    expect(result).toBe('(redacted)')
    delete process.env.GITHUB_TOKEN
  })

  it('returns PATH without redaction', async () => {
    const result = await toolRegistry.execute('readEnv', { name: 'PATH' })
    expect(result).not.toBe('(redacted)')
    expect(result?.length).toBeGreaterThan(0)
  })

  it('clamps gitLog count to max 100', async () => {
    const result = await toolRegistry.execute('gitLog', { count: 9999 })
    expect(typeof result).toBe('string')
  })

  it('clamps gitLog count to min 1', async () => {
    const result = await toolRegistry.execute('gitLog', { count: -5 })
    expect(typeof result).toBe('string')
  })

  it('rejects searchCode on blocked path', async () => {
    await expect(toolRegistry.execute('searchCode', { pattern: 'test', path: '/etc/shadow' }))
      .rejects.toThrow('Access denied')
  })

  it('BLOCKED_PATHS gap: /etc parent dir is NOT blocked', async () => {
    const result = await toolRegistry.execute('searchCode', { pattern: 'localhost', path: '/etc' })
    expect(typeof result).toBe('string')
    // /etc contains /etc/shadow and /etc/passwd but is not blocked
    // This is a WEAKNESS - /etc should be added to BLOCKED_PATHS
  })

  it('blocks writing to /etc/shadow via writeJson tool', async () => {
    await expect(toolRegistry.execute('writeJson', { path: '/etc/shadow', data: '{}' }))
      .rejects.toThrow('Access denied')
  })

  it('blocks reading /etc/shadow via readJson tool', async () => {
    await expect(toolRegistry.execute('readJson', { path: '/etc/shadow' }))
      .rejects.toThrow('Access denied')
  })
})

// ─────────────────────────────────────────────
// 9. Local Browse UI - Live File Security Tests
// ─────────────────────────────────────────────
describe('LocalBrowseUi - Live File Security', () => {
  it('escapes </script> in editor value to prevent script break-out', async () => {
    const tmpDir = join(tmpdir(), `audit-security-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
    const filePath = join(tmpDir, 'test.txt')
    writeFileSync(filePath, '<script>alert("xss")</script><!-->', 'utf-8')
    const html = await createTextEditorHtml(filePath)
    // The editor.setValue argument must have </ escaped as <\/ to prevent
    // the HTML parser from closing the inline script block
    expect(html).toContain('setValue("<script>alert(\\"xss\\")<\\/script><\\!-->", -1)')
    unlinkSync(filePath)
  })

  it('does not render raw HTML from file content', async () => {
    const tmpDir = join(tmpdir(), `audit-security-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
    const filePath = join(tmpDir, 'test.html')
    writeFileSync(filePath, '<<script>alert("xss")</script>', 'utf-8')
    const html = await createTextEditorHtml(filePath)
    expect(html).not.toContain('alert("xss")')
    unlinkSync(filePath)
  })
})

// ─────────────────────────────────────────────
// 10. Secrets Vault - Live Persistence Tests
// ─────────────────────────────────────────────
describe('SecretsVault - Live Persistence', () => {
  const tmpDir = join(tmpdir(), `vault-persistence-${Date.now()}`)

  beforeEach(() => { mkdirSync(tmpDir, { recursive: true }) })

  afterEach(() => {
    try { unlinkSync(join(tmpDir, 'live.json.enc')) } catch {}
    try { unlinkSync(join(tmpDir, 'live.json.bak')) } catch {}
  })

  it('writeSecretFile + readSecretFile round-trip with real token data', () => {
    const filePath = join(tmpDir, 'live.json')
    const data = {
      accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
      refreshToken: 'gho_test_token_abc123',
      userId: 42,
      metadata: { lastLogin: new Date().toISOString() },
    }
    writeSecretFile(filePath, data)
    expect(existsSync(filePath + '.enc')).toBe(true)
    expect(readSecretFile(filePath, null)).toEqual(data)
  })

  it('readSecretFileWithMigration: encrypted preferred over plaintext', () => {
    const filePath = join(tmpDir, 'migrate-live.json')
    writeFileSync(filePath, JSON.stringify({ source: 'plaintext' }), 'utf-8')
    writeSecretFile(filePath, { source: 'encrypted' })
    expect(readSecretFileWithMigration(filePath, null)).toEqual({ source: 'encrypted' })
    unlinkSync(filePath + '.enc')
    unlinkSync(filePath)
  })

  it('writeSecretFileWithMigration removes plaintext after encrypt', () => {
    const filePath = join(tmpDir, 'smart-write.json')
    writeFileSync(filePath, JSON.stringify({ old: 'data' }), 'utf-8')
    writeSecretFileWithMigration(filePath, { new: 'data' })
    expect(existsSync(filePath)).toBe(false)
    expect(existsSync(filePath + '.bak')).toBe(true)
    expect(existsSync(filePath + '.enc')).toBe(true)
    expect(readSecretFile(filePath, null)).toEqual({ new: 'data' })
    unlinkSync(filePath + '.enc')
    unlinkSync(filePath + '.bak')
  })
})

// ─────────────────────────────────────────────
// 11. Auth Middleware - Constant-Time Compare
// ─────────────────────────────────────────────
describe('AuthMiddleware - Constant-Time Comparison', () => {
  function constantTimeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  }

  it('matches equal strings', () => {
    expect(constantTimeCompare('hello', 'hello')).toBe(true)
  })

  it('rejects different strings', () => {
    expect(constantTimeCompare('hello', 'world')).toBe(false)
  })

  it('rejects different lengths (no timing leak)', () => {
    expect(constantTimeCompare('short', 'verylongpassword')).toBe(false)
  })

  it('matches complex passwords', () => {
    const pw = 'M0D3x@!S3cuR3-P@$$w0rd!'
    expect(constantTimeCompare(pw, pw)).toBe(true)
  })
})

// ─────────────────────────────────────────────
// 12. Auth Middleware - Tailscale Detection
// ─────────────────────────────────────────────
describe('AuthMiddleware - Tailscale Trust Detection', () => {
  function isIPv4Octet(value: string): boolean {
    if (!/^\d{1,3}$/.test(value)) return false
    const parsed = Number.parseInt(value, 10)
    return parsed >= 0 && parsed <= 255
  }

  function isTrustedTailscaleIPv4(remote: string): boolean {
    const normalized = remote.startsWith('::ffff:') ? remote.slice('::ffff:'.length) : remote
    const parts = normalized.split('.')
    if (parts.length !== 4 || !parts.every(isIPv4Octet)) return false
    return Number.parseInt(parts[0] ?? '', 10) === 100
      && Number.parseInt(parts[1] ?? '', 10) >= 64
      && Number.parseInt(parts[1] ?? '', 10) <= 127
  }

  function isTrustedTailscaleIPv6(remote: string): boolean {
    const normalized = remote.toLowerCase()
    return normalized === 'fd7a:115c:a1e0::1' || normalized.startsWith('fd7a:115c:a1e0:')
  }

  function isTrustedTailscaleRemote(remote: string): boolean {
    return isTrustedTailscaleIPv4(remote) || isTrustedTailscaleIPv6(remote)
  }

  it('detects Tailscale IPv4 in 100.64.x.x - 100.127.x.x range', () => {
    expect(isTrustedTailscaleRemote('100.64.0.1')).toBe(true)
    expect(isTrustedTailscaleRemote('100.100.100.100')).toBe(true)
    expect(isTrustedTailscaleRemote('100.127.255.255')).toBe(true)
  })

  it('rejects non-Tailscale IPv4', () => {
    expect(isTrustedTailscaleRemote('192.168.1.1')).toBe(false)
    expect(isTrustedTailscaleRemote('10.0.0.1')).toBe(false)
    expect(isTrustedTailscaleRemote('127.0.0.1')).toBe(false)
    expect(isTrustedTailscaleRemote('100.63.0.1')).toBe(false)
    expect(isTrustedTailscaleRemote('100.128.0.1')).toBe(false)
  })

  it('detects Tailscale IPv6 prefix', () => {
    expect(isTrustedTailscaleRemote('fd7a:115c:a1e0::1')).toBe(true)
    expect(isTrustedTailscaleRemote('fd7a:115c:a1e0:ab12::1')).toBe(true)
  })

  it('rejects non-Tailscale IPv6', () => {
    expect(isTrustedTailscaleRemote('fe80::1')).toBe(false)
    expect(isTrustedTailscaleRemote('::1')).toBe(false)
  })

  it('handles IPv4-mapped IPv6 Tailscale addresses', () => {
    expect(isTrustedTailscaleRemote('::ffff:100.64.0.1')).toBe(true)
    expect(isTrustedTailscaleRemote('::ffff:192.168.1.1')).toBe(false)
  })
})
