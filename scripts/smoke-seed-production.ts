#!/usr/bin/env tsx
/**
 * Minimal production smoke seed: template + article + published translation
 * for snapforge-sites.vercel.app so the public homepage is non-empty.
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
    console.error('Missing cloud credentials')
    process.exit(1)
  }

  const domain = process.env.DEPLOY_SITE_DOMAIN || 'snapforge-sites.vercel.app'
  const client = createClient(url, service)

  const { data: site, error: siteErr } = await client
    .from('site_configs')
    .select('id, domain, language_code, country_code')
    .eq('domain', domain)
    .single()

  if (siteErr || !site) {
    console.error('site_configs missing for', domain, siteErr?.message)
    process.exit(1)
  }

  let templateId: string
  const { data: existingTpl } = await client
    .from('templates')
    .select('id, slug')
    .eq('slug', 'guides')
    .maybeSingle()

  if (existingTpl) {
    templateId = existingTpl.id
  } else {
    const { data: tpl, error: tplErr } = await client
      .from('templates')
      .insert({
        name: 'Guides',
        slug: 'guides',
        category: 'general',
      })
      .select('id')
      .single()
    if (tplErr || !tpl) {
      console.error('template insert failed', tplErr?.message)
      process.exit(1)
    }
    templateId = tpl.id
  }

  let articleId: string
  const { data: existingArt } = await client
    .from('articles')
    .select('id, slug')
    .eq('slug', 'hello-snapforge')
    .maybeSingle()

  if (existingArt) {
    articleId = existingArt.id
  } else {
    const { data: art, error: artErr } = await client
      .from('articles')
      .insert({
        template_id: templateId,
        slug: 'hello-snapforge',
        title: 'Hello SnapForge',
        content: '<h1>Hello SnapForge</h1><p>Production smoke test article.</p>',
        meta_title: 'Hello SnapForge',
        meta_description: 'Smoke test article for free-tier deploy.',
        status: 'ready',
        published_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (artErr || !art) {
      console.error('article insert failed', artErr?.message)
      process.exit(1)
    }
    articleId = art.id
  }

  const { data: existingTr } = await client
    .from('translations')
    .select('id, status')
    .eq('article_id', articleId)
    .eq('site_config_id', site.id)
    .maybeSingle()

  const payload = {
    status: 'published',
    language_code: site.language_code,
    country_code: site.country_code,
    translated_title: 'Hello SnapForge',
    translated_content:
      '<h1>Hello SnapForge</h1><p>Production smoke test article.</p>',
    translated_meta_title: 'Hello SnapForge',
    translated_meta_description: 'Smoke test article for free-tier deploy.',
  }

  if (existingTr) {
    const { error } = await client
      .from('translations')
      .update(payload)
      .eq('id', existingTr.id)
    if (error) {
      console.error(error.message)
      process.exit(1)
    }
    console.log('Updated translation', existingTr.id)
  } else {
    const { data: tr, error } = await client
      .from('translations')
      .insert({
        article_id: articleId,
        site_config_id: site.id,
        ...payload,
      })
      .select('id')
      .single()
    if (error || !tr) {
      console.error('translation insert failed', error?.message)
      process.exit(1)
    }
    console.log('Created translation', tr.id)
  }

  console.log(`Seed OK → https://${domain}/guides/hello-snapforge`)
}

main()
