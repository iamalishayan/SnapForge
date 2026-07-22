#!/usr/bin/env tsx
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { suggestKeywords } from '../packages/ai/src/keyword-suggester'

async function runTest() {
  console.log('🔄 Calling suggestKeywords helper using Gemini 2.5 Flash...')
  try {
    const keywords = await suggestKeywords('Image Resizer', 'A tool that resizes images', 'de', 'DE')
    console.log('✅ Localized German Keywords retrieved successfully:')
    console.log(JSON.stringify(keywords, null, 2))
    
    if (keywords.length > 0 && typeof keywords[0] === 'string') {
      console.log('🎉 Verification Success!')
    } else {
      throw new Error('Verification Failure: Result is not an array of strings.')
    }
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

runTest()
