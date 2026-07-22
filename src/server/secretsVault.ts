import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'
import { readFileSync, writeFileSync, renameSync, existsSync, chmodSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { execSync } from 'node:child_process'

const VAULT_VERSION = 1
const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_LENGTH = 32 // AES-256 requires 32 bytes
const ENCRYPTED_SUFFIX = '.enc'
const BACKUP_SUFFIX = '.bak'

interface EncryptedPayload {
  version: number
  salt: string // hex
  iv: string // hex
  tag: string // hex
  data: string // hex
}

let cachedKey: Buffer | null = null

function getMachineId(): string {
  let hostname = 'localhost'
  let uid = '0'
  try { hostname = execSync('hostname', { encoding: 'utf-8', timeout: 2000 }).trim() } catch { hostname = 'localhost' }
  try { uid = execSync('id -u', { encoding: 'utf-8', timeout: 2000 }).trim() } catch { uid = '0' }
  const codexHome = process.env.CODEX_HOME?.trim() || join(homedir(), '.codex')
  return `modex:${hostname}:${uid}:${codexHome}`
}

function getSalt(): string {
  return `modex-vault-${VAULT_VERSION}`
}

function deriveKey(): Buffer {
  if (cachedKey) return cachedKey
  const machineId = getMachineId()
  const salt = getSalt()
  cachedKey = scryptSync(machineId, salt, KEY_LENGTH)
  return cachedKey
}

export function encryptString(plaintext: string): EncryptedPayload {
  const key = deriveKey()
  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    version: VAULT_VERSION,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted.toString('hex'),
  }
}

export function decryptString(payload: EncryptedPayload): string {
  const key = deriveKey()
  const iv = Buffer.from(payload.iv, 'hex')
  const tag = Buffer.from(payload.tag, 'hex')
  const data = Buffer.from(payload.data, 'hex')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString('utf-8')
}

export function encryptFile(filePath: string): void {
  if (!existsSync(filePath)) return
  const content = readFileSync(filePath, 'utf-8')
  const payload = encryptString(content)
  const encPath = filePath + ENCRYPTED_SUFFIX
  const tmpPath = encPath + '.tmp'
  writeFileSync(tmpPath, JSON.stringify(payload, null, 2), { encoding: 'utf-8', mode: 0o600 })
  renameSync(tmpPath, encPath)
}

export function decryptFile(filePath: string): string | null {
  const encPath = filePath + ENCRYPTED_SUFFIX
  if (existsSync(encPath)) {
    try {
      const raw = readFileSync(encPath, 'utf-8')
      const payload = JSON.parse(raw) as EncryptedPayload
      return decryptString(payload)
    } catch {
      return null
    }
  }
  // Fallback to plaintext
  if (existsSync(filePath)) {
    return readFileSync(filePath, 'utf-8')
  }
  return null
}

export function readSecretFile<T>(filePath: string, defaultValue: T): T {
  const content = decryptFile(filePath)
  if (!content) return defaultValue
  try {
    return JSON.parse(content) as T
  } catch {
    return defaultValue
  }
}

export function writeSecretFile(filePath: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2)
  const payload = encryptString(json)
  const encPath = filePath + ENCRYPTED_SUFFIX
  const tmpPath = encPath + '.tmp'
  writeFileSync(tmpPath, JSON.stringify(payload, null, 2), { encoding: 'utf-8', mode: 0o600 })
  renameSync(tmpPath, encPath)
}

export function migratePlaintextToEncrypted(filePath: string): boolean {
  const encPath = filePath + ENCRYPTED_SUFFIX
  const bakPath = filePath + BACKUP_SUFFIX

  // Already encrypted
  if (existsSync(encPath)) return false

  // No plaintext to migrate
  if (!existsSync(filePath)) return false

  try {
    // Encrypt
    encryptFile(filePath)

    // Backup original
    if (!existsSync(bakPath)) {
      renameSync(filePath, bakPath)
    } else {
      // .bak already exists, just remove plaintext
      const { unlinkSync } = require('node:fs') as typeof import('node:fs')
      unlinkSync(filePath)
    }

    return true
  } catch {
    return false
  }
}

export function readSecretFileWithMigration<T>(filePath: string, defaultValue: T): T {
  // Try encrypted first
  const encPath = filePath + ENCRYPTED_SUFFIX
  if (existsSync(encPath)) {
    const content = decryptFile(filePath)
    if (content) {
      try { return JSON.parse(content) as T } catch {}
    }
  }

  // Try migration from plaintext
  if (migratePlaintextToEncrypted(filePath)) {
    const content = decryptFile(filePath)
    if (content) {
      try { return JSON.parse(content) as T } catch {}
    }
  }

  // Fallback to plaintext (no migration needed or migration failed)
  return readSecretFile(filePath, defaultValue)
}

export function writeSecretFileWithMigration(filePath: string, data: unknown): void {
  // Write encrypted version
  writeSecretFile(filePath, data)

  // Remove plaintext if it still exists (migration already happened or this is first write)
  const bakPath = filePath + BACKUP_SUFFIX
  if (existsSync(filePath) && !existsSync(bakPath)) {
    try { renameSync(filePath, bakPath) } catch {}
  }
}

export const secretsVault = {
  encryptString,
  decryptString,
  encryptFile,
  decryptFile,
  readSecretFile,
  writeSecretFile,
  readSecretFileWithMigration,
  writeSecretFileWithMigration,
  migratePlaintextToEncrypted,
}
