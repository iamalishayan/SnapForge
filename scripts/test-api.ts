import { createAdminClient } from '@snapforge/db/src/server'
import crypto from 'crypto'

async function hashApiKey(key: string): Promise<string> {
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  return hash
}

async function runTests() {
  const supabase = createAdminClient()
  
  // 1. Generate a test API key
  const rawKey = 'test_admin_key_' + crypto.randomBytes(16).toString('hex')
  const hashedKey = await hashApiKey(rawKey)

  console.log('Inserting test API key with admin scope...')
  const { error } = await supabase.from('api_keys').insert({
    name: 'Test Key',
    key_hash: hashedKey,
    scope: 'admin',
    owner: 'test_script',
    active: true
  })

  if (error) {
    console.error('Failed to insert API key:', error)
    return
  }

  console.log('✅ Test API Key created.')

  // 2. Test Zod Validation (Issue V-1)
  console.log('\n--- Testing Zod Validation (V-1) ---')
  const resInvalid = await fetch('http://localhost:3000/api/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-api-key': rawKey
    },
    body: JSON.stringify({
      // Missing title and content to trigger Zod error
      status: 'draft'
    })
  })

  const invalidData = await resInvalid.json()
  if (resInvalid.status === 422 && invalidData.details) {
    console.log('✅ Zod validation successfully caught invalid data (422):', invalidData.details)
  } else {
    console.error('❌ Zod validation failed to block invalid request:', resInvalid.status, invalidData)
  }

  // 3. Test RBAC (Issue S-3)
  console.log('\n--- Testing RBAC (S-3) ---')
  const resNoKey = await fetch('http://localhost:3000/api/articles')
  if (resNoKey.status === 401) {
    console.log('✅ RBAC successfully blocked request without API key (401)')
  } else {
    console.error('❌ RBAC failed to block unauthenticated request:', resNoKey.status)
  }

  // 4. Test Rate Limiting (Issue S-5)
  // We'd have to spam requests, but we can verify headers.
  console.log('\n--- Testing Rate Limiting (S-5) ---')
  const resRateLimitCheck = await fetch('http://localhost:3000/api/articles', {
    headers: { 'x-admin-api-key': rawKey }
  })
  
  if (resRateLimitCheck.headers.get('x-ratelimit-remaining')) {
    console.log('✅ Rate limit headers are present on the response:', {
      limit: resRateLimitCheck.headers.get('x-ratelimit-limit'),
      remaining: resRateLimitCheck.headers.get('x-ratelimit-remaining')
    })
  } else {
    console.log('❌ Rate limit headers missing (Did you provide valid Upstash credentials?)')
  }

  console.log('\n🎉 All tests completed.')
}

runTests().catch(console.error)
