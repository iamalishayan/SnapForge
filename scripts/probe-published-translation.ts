#!/usr/bin/env tsx
import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const text = fs.readFileSync('.env', 'utf8')
  const grab = (k: string) =>
    text.match(new RegExp(`^#?\\s*${k}=(.+)$`, 'm'))?.[1]?.trim()
  const c = createClient(grab('NEXT_PUBLIC_SUPABASE_URL')!, grab('SUPABASE_SERVICE_ROLE_KEY')!)
  const domain = 'snapforge-sites.vercel.app'
  const { data, error } = await c
    .from('translations')
    .select(
      'id,status, translated_title, site_configs!inner(domain), articles!inner(slug, article_css, templates!inner(slug))'
    )
    .eq('site_configs.domain', domain)
    .eq('articles.templates.slug', 'guides')
    .eq('articles.slug', 'hello-snapforge')
    .eq('status', 'published')
    .maybeSingle()
  console.log('error', error?.message || null)
  console.log(
    'data',
    data
      ? {
          id: data.id,
          status: data.status,
          title: data.translated_title,
          art: (data as any).articles,
        }
      : null
  )
}

main()
