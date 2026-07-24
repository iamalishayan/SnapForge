#!/usr/bin/env tsx
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as crypto from 'crypto'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function generateApiKey(name: string, scope: string, owner: string) {
  const validScopes = ['read', 'write', 'admin', 'cron', 'webhook']
  if (!validScopes.includes(scope)) {
    console.error(`Invalid scope. Must be one of: ${validScopes.join(', ')}`)
    process.exit(1)
  }

  // Generate a cryptographically secure 32-byte hex string
  const rawKey = crypto.randomBytes(32).toString('hex')
  
  // Hash the key using SHA-256 for secure storage
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

  const { data, error } = await supabase
    .from('api_keys')
    .insert([{
      key_hash: keyHash,
      name,
      scope,
      owner,
      active: true
    }])
    .select()
    .single()

  if (error) {
    console.error('Failed to insert API key into database:', error.message)
    process.exit(1)
  }

  console.log('\nAPI Key Generated Successfully!\n')
  console.log('--------------------------------------------------')
  console.log('Key Name:  ', name)
  console.log('Scope:     ', scope)
  console.log('Owner:     ', owner)
  console.log('--------------------------------------------------')
  console.log('RAW KEY (SAVE THIS NOW - IT WILL NEVER BE SHOWN AGAIN):')
  console.log(rawKey)
  console.log('--------------------------------------------------')
}

const args = process.argv.slice(2)
if (args.length < 3) {
  console.log('Usage: pnpm tsx scripts/generate-api-key.ts <name> <scope> <owner>')
  console.log('Scopes: read | write | admin | cron | webhook')
  console.log('Example: pnpm tsx scripts/generate-api-key.ts "Dev Local" "admin" "alice"')
  process.exit(1)
}

generateApiKey(args[0], args[1], args[2])
