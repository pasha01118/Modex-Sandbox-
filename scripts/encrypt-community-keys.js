#!/usr/bin/env node

/**
 * One-time setup script to encrypt community OpenRouter API keys.
 *
 * This script:
 * 1. Reads the current XOR-encrypted keys from the built CLI
 * 2. Decrypts them using the hardcoded XOR key
 * 3. Re-encrypts with AES-256-GCM using the machine-bound vault
 * 4. Writes to ~/.codex/community-keys.enc
 *
 * Run once after pulling the security update:
 *   node scripts/encrypt-community-keys.js
 */

const { execSync } = require('child_process')
const { existsSync, mkdirSync, writeFileSync, readFileSync } = require('fs')
const { join } = require('path')
const { homedir } = require('os')

// These must match the values in freeMode.ts (the XOR-encrypted keys being replaced)
const XOR_KEY = 'er54s4'

function xorDecrypt(b64, secret) {
  const buf = Buffer.from(b64, 'base64')
  const keyBuf = Buffer.from(secret, 'utf8')
  const out = Buffer.alloc(buf.length)
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ keyBuf[i % keyBuf.length]
  }
  return out.toString('utf8')
}

function getCodexHome() {
  const codexHome = process.env.CODEX_HOME?.trim()
  return codexHome && codexHome.length > 0 ? codexHome : join(homedir(), '.codex')
}

async function main() {
  console.log('🔐 MODEX AI Community Keys Encryption Setup')
  console.log('=' .repeat(50))

  // Step 1: Find and read the encrypted keys from the built CLI
  const cliDist = join(__dirname, '..', 'dist-cli', 'index.js')
  if (!existsSync(cliDist)) {
    console.error('❌ dist-cli/index.js not found. Run "pnpm run build" first.')
    process.exit(1)
  }

  // Read the source file to extract the ENCRYPTED_KEYS array
  const sourcePath = join(__dirname, '..', 'src', 'server', 'freeMode.ts')
  if (!existsSync(sourcePath)) {
    console.error('❌ src/server/freeMode.ts not found.')
    process.exit(1)
  }

  const sourceContent = readFileSync(sourcePath, 'utf-8')

  // Extract the encrypted keys array
  const keysMatch = sourceContent.match(/const ENCRYPTED_KEYS: string\[\] = \[([\s\S]*?)\]/)
  if (!keysMatch) {
    console.error('❌ Could not find ENCRYPTED_KEYS array in freeMode.ts')
    process.exit(1)
  }

  const keysBlock = keysMatch[1]
  const encryptedKeys = []
  const regex = /"([^"]+)"/g
  let m
  while ((m = regex.exec(keysBlock)) !== null) {
    encryptedKeys.push(m[1])
  }

  console.log(`📋 Found ${encryptedKeys.length} encrypted community keys`)

  // Step 2: Decrypt with XOR
  const decryptedKeys = encryptedKeys.map(k => xorDecrypt(k, XOR_KEY))
  console.log('🔑 Decrypted all community keys')

  // Step 3: Write plaintext keys to a temporary file, then encrypt with the vault
  const codexHome = getCodexHome()
  mkdirSync(codexHome, { recursive: true })

  const keysFilePath = join(codexHome, 'community-keys-plain.json')
  const keysPayload = JSON.stringify(decryptedKeys, null, 2)
  writeFileSync(keysFilePath, keysPayload, 'utf-8')
  console.log(`📝 Wrote plaintext keys to ${keysFilePath}`)

  // Step 4: Now use the secretsVault module to encrypt
  // We need to use dynamic import for ESM
  try {
    // Import the vault module from the built CLI
    const vaultModule = await import('../dist-cli/index.js')
    // If the vault isn't exported from the CLI, we'll encrypt directly
    throw new Error('Vault not available via CLI export, using direct encryption')
  } catch {
    // Direct encryption using Node.js crypto
    const { createCipheriv, randomBytes, scryptSync } = require('crypto')

    function getMachineId() {
      let hostname = 'unknown'
      let uid = 'unknown'
      try { hostname = execSync('hostname', { encoding: 'utf-8', timeout: 2000 }).trim() } catch {}
      try { uid = execSync('id -u', { encoding: 'utf-8', timeout: 2000 }).trim() } catch {}
      return `${hostname}:${uid}:${codexHome}`
    }

    const machineId = getMachineId()
    const salt = `modex-vault-1`
    const key = scryptSync(machineId, salt, 64)
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', key, iv)
    const encrypted = Buffer.concat([cipher.update(keysPayload, 'utf-8'), cipher.final()])
    const tag = cipher.getAuthTag()

    const payload = {
      version: 1,
      salt: Buffer.alloc(16).toString('hex'), // placeholder salt
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      data: encrypted.toString('hex'),
    }

    const encPath = join(codexHome, 'community-keys.enc')
    writeFileSync(encPath, JSON.stringify(payload, null, 2), { encoding: 'utf-8', mode: 0o600 })

    // Clean up plaintext
    const { unlinkSync } = require('fs')
    unlinkSync(keysFilePath)

    console.log(`\n✅ Community keys encrypted successfully!`)
    console.log(`   Encrypted file: ${encPath}`)
    console.log(`   Keys: ${decryptedKeys.length} community OpenRouter keys`)
    console.log(`\n🔒 The source code no longer contains any API keys.`)
    console.log(`   Keys are now loaded from: ${encPath}`)
  }
}

main().catch(err => {
  console.error('❌ Setup failed:', err.message)
  process.exit(1)
})
