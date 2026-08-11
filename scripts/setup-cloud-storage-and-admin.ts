#!/usr/bin/env tsx
/**
 * Production bootstrap: create public "images" bucket on cloud Supabase.
 * Reads cloud URL/keys from CLOUD_* env vars, or uncommented NEXT_PUBLIC_* /
 * SUPABASE_SERVICE_ROLE_KEY. Does not print secret values.
 */
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

function loadCloudFromCommentedEnv(): { url?: string; service?: string; anon?: string } {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return {}
  const text = fs.readFileSync(envPath, 'utf8')
  const grab = (key: string) => {
    const re = new RegExp(`^#?\\s*${key}=(.+)$`, 'm')
    const m = text.match(re)
    return m?.[1]?.trim()
  }
  return {
    url: grab('NEXT_PUBLIC_SUPABASE_URL'),
    anon: grab('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    service: grab('SUPABASE_SERVICE_ROLE_KEY'),
  }
}

async function main() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') })
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

  const commented = loadCloudFromCommentedEnv()
  const url =
    process.env.CLOUD_SUPABASE_URL ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co')
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : commented.url)
  const service =
    process.env.CLOUD_SUPABASE_SERVICE_ROLE_KEY ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co')
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : commented.service)

  if (!url || !service || !url.includes('supabase.co')) {
    console.error('Missing cloud Supabase URL / service role key.')
    process.exit(1)
  }

  const host = url.replace(/^https?:\/\//, '').split('/')[0]
  console.log(`Target: ${host}`)

  const client = createClient(url, service)
  const { data: buckets, error: listErr } = await client.storage.listBuckets()
  if (listErr) {
    console.error('listBuckets failed:', listErr.message)
    process.exit(1)
  }

  if (buckets.some((b) => b.name === 'images')) {
    console.log('Bucket "images" already exists.')
  } else {
    const { error } = await client.storage.createBucket('images', { public: true })
    if (error) {
      console.error('createBucket failed:', error.message)
      process.exit(1)
    }
    console.log('Created public bucket "images".')
  }

  const email = process.env.DEPLOY_ADMIN_EMAIL
  const password = process.env.DEPLOY_ADMIN_PASSWORD
  if (email && password) {
    const { data: listed, error: listUsersErr } = await client.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    })
    if (listUsersErr) {
      console.error('listUsers failed:', listUsersErr.message)
      process.exit(1)
    }
    const exists = listed.users.some((u) => u.email === email)
    if (exists) {
      console.log(`Admin user already exists: ${email}`)
    } else {
      const { error: createErr } = await client.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (createErr) {
        console.error('createUser failed:', createErr.message)
        process.exit(1)
      }
      console.log(`Created admin user: ${email}`)
    }
  } else {
    console.log(
      'Skip admin user create (set DEPLOY_ADMIN_EMAIL + DEPLOY_ADMIN_PASSWORD to create).'
    )
  }
}

main()
