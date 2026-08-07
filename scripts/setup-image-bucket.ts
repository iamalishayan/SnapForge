#!/usr/bin/env tsx
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

/**
 * One-time setup: creates the public "images" bucket used for
 * rendered translated images (image localization pipeline).
 */
async function run() {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: buckets, error: listErr } = await client.storage.listBuckets()
  if (listErr) {
    console.error('Failed to list buckets:', listErr.message)
    process.exit(1)
  }

  if (buckets.some((b) => b.name === 'images')) {
    console.log('Bucket "images" already exists.')
    return
  }

  const { error } = await client.storage.createBucket('images', { public: true })
  if (error) {
    console.error('Failed to create bucket:', error.message)
    process.exit(1)
  }
  console.log('Created public bucket "images".')
}

run()
