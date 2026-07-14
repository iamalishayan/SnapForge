#!/usr/bin/env tsx
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { DbService } from '../packages/db/src/services/dbService'





async function runTest() {
  console.log('🔄 Connecting to Supabase and running verification tests...')

  try {
    // 1. Create a dummy test template
    console.log('➕ Creating a test template...')
    const newTemplate = await DbService.createTemplate({
      name: 'Test Image Resizer',
      slug: 'test-image-resizer-' + Date.now(),
      category: 'testing',
      gemini_prompt: 'You are a test prompt builder...',
      meta_title: 'Test Resizer Title',
      meta_description: 'Test Resizer Description',
      active: true
    })

    console.log('✅ Template created successfully with ID:', newTemplate.id)

    // 2. Fetch all active templates to verify the read connection
    console.log('🔍 Fetching all templates to verify read connection...')
    const templates = await DbService.getTemplates()
    console.log(`✅ Successfully fetched ${templates.length} templates.`)

    const found = templates.find((t) => t.id === newTemplate.id)
    if (found) {
      console.log('🎉 Verification Success: Created template was retrieved from the database!')
    } else {
      throw new Error('Verification Failure: Created template was not found in the list!')
    }

  } catch (error: any) {
    console.error('❌ Database verification test failed!')
    console.error(error.message)
    process.exit(1)
  }
}

runTest()
