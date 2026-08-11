#!/usr/bin/env tsx
/**
 * Verify cloud schema readiness (no secret printing).
 */
import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'

function grab(text: string, key: string): string | undefined {
  return text.match(new RegExp(`^#?\\s*${key}=(.+)$`, 'm'))?.[1]?.trim()
}

async function main() {
  const text = fs.readFileSync('.env', 'utf8')
  const url = grab(text, 'NEXT_PUBLIC_SUPABASE_URL')
  const service = grab(text, 'SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !service) {
    console.error('Cloud keys not found in .env comments')
    process.exit(1)
  }

  const c = createClient(url, service)
  const tables = [
    'site_configs',
    'articles',
    'translations',
    'image_translation_cache',
    'templates',
  ]

  for (const t of tables) {
    const { error, count } = await c.from(t).select('*', { count: 'exact', head: true })
    console.log(t, error ? `MISSING/ERR: ${error.message}` : `ok count=${count}`)
  }

  const { data: sites, error: sitesErr } = await c
    .from('site_configs')
    .select('id, domain, active, theme_name, language_code')
    .limit(50)

  if (sitesErr) {
    console.error('site_configs query failed:', sitesErr.message)
    process.exit(1)
  }

  console.log('sites:', JSON.stringify(sites, null, 2))
}

main()
