#!/usr/bin/env tsx
/**
 * Push critical env vars from local .env / .env.local into a Vercel project.
 * Requires: vercel login (or VERCEL_TOKEN) and project linked in apps/<name>.
 *
 * Usage:
 *   pnpm exec tsx scripts/sync-vercel-env.ts admin
 *   pnpm exec tsx scripts/sync-vercel-env.ts sites
 */
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

type AppName = 'admin' | 'sites'

const ADMIN_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_API_KEY',
  'UPSTASH_REDIS_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'GROQ_API_KEY',
  'GROK_API_KEY',
  'RESEND_API_KEY',
  'ALERT_EMAIL',
  'REVALIDATION_SECRET',
  'SUPABASE_WEBHOOK_SECRET',
  'CRON_SECRET',
] as const

const SITES_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'REVALIDATION_SECRET',
] as const

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {}
  const out: Record<string, string> = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const i = trimmed.indexOf('=')
    if (i <= 0) continue
    const key = trimmed.slice(0, i).trim()
    let val = trimmed.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

function grabCommented(filePath: string, key: string): string | undefined {
  if (!fs.existsSync(filePath)) return undefined
  const text = fs.readFileSync(filePath, 'utf8')
  return text.match(new RegExp(`^#?\\s*${key}=(.+)$`, 'm'))?.[1]?.trim()
}

function resolveEnv(): Record<string, string> {
  const root = process.cwd()
  const fromEnv = parseEnvFile(path.join(root, '.env'))
  const fromLocal = parseEnvFile(path.join(root, '.env.local'))
  const merged = { ...fromEnv, ...fromLocal }

  // Prefer cloud Supabase URL/keys from commented .env when local points at 127.0.0.1
  const cloudUrl = grabCommented(path.join(root, '.env'), 'NEXT_PUBLIC_SUPABASE_URL')
  const cloudAnon = grabCommented(path.join(root, '.env'), 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const cloudService = grabCommented(
    path.join(root, '.env'),
    'SUPABASE_SERVICE_ROLE_KEY'
  )
  if (cloudUrl?.includes('supabase.co')) {
    merged.NEXT_PUBLIC_SUPABASE_URL = cloudUrl
    if (cloudAnon) merged.NEXT_PUBLIC_SUPABASE_ANON_KEY = cloudAnon
    if (cloudService) merged.SUPABASE_SERVICE_ROLE_KEY = cloudService
  }

  return merged
}

function main() {
  const app = process.argv[2] as AppName
  if (app !== 'admin' && app !== 'sites') {
    console.error('Usage: tsx scripts/sync-vercel-env.ts <admin|sites>')
    process.exit(1)
  }

  const keys = app === 'admin' ? ADMIN_KEYS : SITES_KEYS
  const env = resolveEnv()
  const cwd = path.join(process.cwd(), 'apps', app)

  for (const key of keys) {
    const value = env[key]
    if (!value || value.includes('your_') || value.includes('...')) {
      console.log(`skip ${key} (missing/placeholder)`)
      continue
    }
    // Remove existing then add for production/preview/development
    try {
      execSync(`vercel env rm ${key} production --yes`, {
        cwd,
        stdio: 'ignore',
      })
    } catch {
      /* absent */
    }
    const child = execSync(`vercel env add ${key} production`, {
      cwd,
      input: `${value}\n`,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf8',
    })
    console.log(`set ${key}`)
    void child
  }

  console.log(`Synced ${app} env vars to Vercel (production). Redeploy to apply.`)
}

main()
