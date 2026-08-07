#!/usr/bin/env tsx
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { DbService } from '../packages/db/src/services/dbService'
import { processImageTranslation } from '../packages/queue/src/image-translation-processor'

const BANNER_URL =
  'https://placehold.co/920x420/0F1E3D/FBFAF7/png?text=Tuition+Fee+Discount%5CnAwarded+Automatically'
const OLD_SRC = 'hero-thumbnail.png'

/**
 * End-to-end check of the image localization pipeline against the
 * Sheffield test article's TR translation (bypasses the BullMQ queue).
 */
async function run() {
  const client = (DbService as any).client

  // 1. Point the test article + its TR translation at an absolute image URL
  const { data: articles } = await client
    .from('articles')
    .select('id, title, content, translations(id, language_code)')
    .ilike('title', '%sheffield%')
  const article = (articles || []).find((a: any) =>
    (a.translations || []).some((t: any) => t.language_code === 'tr')
  )
  if (!article) throw new Error('Sheffield test article with TR translation not found')

  if (article.content.includes(OLD_SRC)) {
    await client
      .from('articles')
      .update({ content: article.content.split(`src="${OLD_SRC}"`).join(`src="${BANNER_URL}"`) })
      .eq('id', article.id)
    console.log('Article content: replaced relative src with absolute banner URL')
  }

  const { data: translations } = await client
    .from('translations')
    .select('id, language_code, translated_content')
    .eq('article_id', article.id)
    .eq('language_code', 'tr')
  const translation = translations?.[0]
  if (!translation) throw new Error('TR translation not found')

  if (translation.translated_content?.includes(OLD_SRC)) {
    await client
      .from('translations')
      .update({
        translated_content: translation.translated_content
          .split(`src="${OLD_SRC}"`)
          .join(`src="${BANNER_URL}"`),
      })
      .eq('id', translation.id)
    console.log('Translation content: replaced relative src with absolute banner URL')
  }

  // 2. Run the full pipeline (classify -> translate -> render -> upload -> rewrite)
  console.log(`\nProcessing translation ${translation.id} (tr)...`)
  const { entries, needsReview } = await processImageTranslation(translation.id, 'verify-script')

  console.log('\n--- Outcomes ---')
  for (const entry of entries) {
    console.log(JSON.stringify(entry, null, 2))
  }
  console.log('needsReview:', needsReview)

  // 3. Show final img tags in translated content
  const { data: after } = await client
    .from('translations')
    .select('translated_content, image_texts, image_translation_needed')
    .eq('id', translation.id)
    .single()

  const imgTags = (after?.translated_content?.match(/<img[^>]*>/g) || []) as string[]
  console.log('\n--- Final img tags ---')
  imgTags.forEach((tag: string) => console.log(tag.slice(0, 300)))
  console.log('\nimage_translation_needed:', after?.image_translation_needed)
}

run().catch((err) => {
  console.error('VERIFY FAILED:', err instanceof Error ? err.message : err)
  process.exit(1)
})
