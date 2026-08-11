#!/usr/bin/env tsx
/**
 * Upsert an active site_configs row for production Host matching.
 *
 * Usage:
 *   DEPLOY_SITE_DOMAIN=your-sites.vercel.app \
 *   DEPLOY_SITE_LANG=en \
 *   pnpm exec tsx scripts/upsert-production-site-domain.ts
 */
import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'

function grab(text: string, key: string): string | undefined {
  return text.match(new RegExp(`^#?\\s*${key}=(.+)$`, 'm'))?.[1]?.trim()
}

async function main() {
  const domain = (process.env.DEPLOY_SITE_DOMAIN || '').trim().toLowerCase()
  if (!domain || domain.includes('://') || domain.includes('/')) {
    console.error('Set DEPLOY_SITE_DOMAIN to a bare hostname (e.g. snapforge-sites.vercel.app)')
    process.exit(1)
  }

  const text = fs.readFileSync('.env', 'utf8')
  const url =
    process.env.CLOUD_SUPABASE_URL ||
    grab(text, 'NEXT_PUBLIC_SUPABASE_URL')
  const service =
    process.env.CLOUD_SUPABASE_SERVICE_ROLE_KEY ||
    grab(text, 'SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !service) {
    console.error('Missing cloud Supabase credentials')
    process.exit(1)
  }

  const client = createClient(url, service)
  const language_code = process.env.DEPLOY_SITE_LANG || 'en'
  const country_code = process.env.DEPLOY_SITE_COUNTRY || 'US'
  const theme_name = process.env.DEPLOY_SITE_THEME || 'dark'

  const { data: existing, error: findErr } = await client
    .from('site_configs')
    .select('id, domain')
    .eq('domain', domain)
    .maybeSingle()

  if (findErr) {
    console.error(findErr.message)
    process.exit(1)
  }

  if (existing) {
    const { error } = await client
      .from('site_configs')
      .update({ active: true, theme_name, language_code, country_code })
      .eq('id', existing.id)
    if (error) {
      console.error(error.message)
      process.exit(1)
    }
    console.log(`Updated site_configs id=${existing.id} domain=${domain}`)
    return
  }

  const { data, error } = await client
    .from('site_configs')
    .insert({
      domain,
      language_code,
      country_code,
      theme_name,
      active: true,
    })
    .select('id, domain')
    .single()

  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  console.log(`Created site_configs id=${data.id} domain=${data.domain}`)
}

main()
