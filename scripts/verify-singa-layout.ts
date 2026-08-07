#!/usr/bin/env tsx
/**
 * Verify SINGA layout ingest + optional TR re-translate.
 * Usage: pnpm tsx scripts/verify-singa-layout.ts [--translate]
 */
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { parseHtmlArticle } from '../apps/admin/app/api/v1/articles/utils'
import { DbService } from '../packages/db/src/services/dbService'
import { getStructureFingerprint } from '../packages/ai/src/structure-fingerprint'

const HTML_PATH = path.resolve(
  process.cwd(),
  'testarticles/snapforge-singapore-article.html'
)
const DO_TRANSLATE = process.argv.includes('--translate')

async function main() {
  const raw = fs.readFileSync(HTML_PATH, 'utf8')
  const parsed = parseHtmlArticle(raw)

  console.log('--- Ingest checks ---')
  console.log('title:', parsed.title.slice(0, 80))
  console.log('content length:', parsed.content.length)
  console.log('has nav:', parsed.content.includes('<nav'))
  console.log('has footer:', parsed.content.includes('<footer'))
  console.log('has button:', parsed.content.includes('<button'))
  console.log('section count:', (parsed.content.match(/<section/g) || []).length)
  console.log('css length:', parsed.article_css?.length ?? 0)
  console.log(
    'css has reveal override:',
    Boolean(parsed.article_css?.includes('SnapForge: scripts stripped'))
  )
  console.log(
    'css has font import:',
    Boolean(parsed.article_css?.includes('@import url('))
  )

  const fp = getStructureFingerprint(parsed.content)
  console.log('fingerprint:', {
    section: fp.section,
    nav: fp.nav,
    header: fp.header,
    footer: fp.footer,
    h2: fp.h2,
    h3: fp.h3,
  })

  if (!parsed.content.includes('<nav') || !parsed.article_css?.includes('SnapForge: scripts stripped')) {
    throw new Error('Ingest checks failed')
  }

  const client = (DbService as any).client
  const { data: articles } = await client
    .from('articles')
    .select('id, title, slug, template_id')
    .ilike('title', '%SINGA%')

  const article = articles?.[0]
  if (!article) {
    console.log('No SINGA article in DB — ingest-only verification passed.')
    return
  }

  console.log('\nUpdating DB article', article.id)
  await DbService.updateArticle(article.id, {
    content: parsed.content,
    article_css: parsed.article_css,
    title: parsed.title,
    meta_title: parsed.meta_title,
    meta_description: parsed.meta_description,
    og_image_url: parsed.og_image_url,
    inner_links: parsed.inner_links as any,
    outer_links: parsed.outer_links as any,
  })

  const { data: after } = await client
    .from('articles')
    .select('article_css, content')
    .eq('id', article.id)
    .single()

  console.log(
    'DB css has reveal override:',
    Boolean(after?.article_css?.includes('SnapForge: scripts stripped'))
  )
  console.log('DB content has nav:', Boolean(after?.content?.includes('<nav')))

  if (!DO_TRANSLATE) {
    console.log('\nIngest OK. Re-run with --translate to queue a fresh TR translation.')
    return
  }

  const { data: sites } = await client
    .from('site_configs')
    .select('id, language_code, country_code, domain')
    .eq('language_code', 'tr')
    .limit(1)

  const site = sites?.[0]
  if (!site) throw new Error('No TR site_config found')

  const { translateArticle, runAutoQAChecks } = await import('../packages/ai/src')
  console.log('\nTranslating to TR (chunked if long)...')
  const translation = await translateArticle(
    { ...parsed, id: article.id, content: parsed.content } as any,
    'Turkish',
    site.country_code || 'TR'
  )

  const qa = await runAutoQAChecks(translation, { content: parsed.content } as any, 'Turkish')
  console.log('QA passed:', qa.passed)
  if (qa.errors?.length) console.log('QA errors:', qa.errors)

  const trFp = getStructureFingerprint(translation.translated_content)
  console.log('TR fingerprint:', {
    section: trFp.section,
    nav: trFp.nav,
    header: trFp.header,
    footer: trFp.footer,
    h2: trFp.h2,
    h3: trFp.h3,
  })

  const result = await DbService.upsertTranslation({
    article_id: article.id,
    site_config_id: site.id,
    language_code: 'tr',
    country_code: site.country_code || 'TR',
    translated_title: translation.translated_title,
    translated_content: translation.translated_content,
    translated_meta_title: translation.translated_meta_title,
    translated_meta_description: translation.translated_meta_description,
    translated_faq: translation.translated_faq as any,
    status: qa.passed ? 'qa_queue' : 'staging',
    qa_auto_passed: qa.passed,
    qa_auto_errors: qa.errors,
    qa_auto_warnings: qa.warnings as any,
    model_used: translation.model_used,
    token_count: translation.output_tokens,
  })

  console.log('Upserted translation', result.id)
  console.log(
    'TR has eligibility section id:',
    translation.translated_content.includes('id="eligibility"')
  )
  console.log(
    'TR has timeline:',
    translation.translated_content.includes('id="timeline"')
  )
  console.log(
    'TR has coverage:',
    translation.translated_content.includes('id="coverage"')
  )
  console.log(
    'TR nav Overview→ translated links present:',
    (translation.translated_content.match(/href="#eligibility"/g) || []).length > 0
  )
}

main().catch((err) => {
  console.error('VERIFY FAILED:', err instanceof Error ? err.message : err)
  process.exit(1)
})
