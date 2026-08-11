#!/usr/bin/env tsx
/**
 * Set Railway service variables from local .env / cloud commented keys.
 * Requires: railway login + linked project (railway link).
 */
import { execSync } from 'child_process'
import * as fs from 'fs'

const KEYS = [
  'NODE_ENV',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'UPSTASH_REDIS_URL',
  'ADMIN_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'GROQ_API_KEY',
  'GROK_API_KEY',
  'RESEND_API_KEY',
  'ALERT_EMAIL',
  'REVALIDATION_SECRET',
  'BULL_BOARD_PORT',
] as const

function grab(text: string, key: string): string | undefined {
  const live = text.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim()
  if (live) return live
  return text.match(new RegExp(`^#\\s*${key}=(.+)$`, 'm'))?.[1]?.trim()
}

function main() {
  const text = fs.readFileSync('.env', 'utf8')
  const vars: string[] = []
  for (const key of KEYS) {
    let value = grab(text, key)
    if (key === 'NODE_ENV') value = 'production'
    if (key === 'BULL_BOARD_PORT') value = value || '3005'
    if (!value || value.includes('your_') || value.includes('...')) {
      console.log(`skip ${key}`)
      continue
    }
    vars.push(`${key}=${value}`)
    console.log(`queue ${key}`)
  }

  // railway variables set KEY=VAL KEY2=VAL2
  const cmd = `railway variables ${vars.map((v) => `--set ${JSON.stringify(v)}`).join(' ')}`
  execSync(cmd, { stdio: 'inherit', env: process.env })
  console.log('Railway variables updated.')
}

main()
