#!/usr/bin/env tsx
/**
 * Wipe image_translation_cache so Retry regenerates PNGs with fixed fonts.
 * Usage: pnpm exec tsx scripts/clear-image-translation-cache.ts [locale]
 *   locale optional — e.g. de — clears only that language; omit to clear all.
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
  if (!url?.includes('supabase.co') || !service) {
    console.error('Need cloud Supabase URL + service role in .env')
    process.exit(1)
  }

  const locale = (process.argv[2] || '').trim().toLowerCase()
  const client = createClient(url, service)

  let q = client.from('image_translation_cache').delete()
  if (locale) {
    q = q.eq('target_locale', locale)
  } else {
    q = q.neq('image_hash', '')
  }

  const { error, count } = await q.select('*', { count: 'exact', head: false })
  if (error) {
    console.error(error.message)
    process.exit(1)
  }
  console.log(
    locale
      ? `Cleared image_translation_cache for locale=${locale}`
      : 'Cleared all image_translation_cache rows',
    count != null ? `(${count} rows)` : ''
  )
}

main()
