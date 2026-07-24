import { config } from 'dotenv'
config({ path: '.env.local' })

async function run() {
  const apiKey = process.env.ADMIN_API_KEY || 'snapforge_super_secret_key_123'
  
  console.log('--- Testing E-3: Article CRUD HTTP Status Codes ---')
  
  // 1. Test 404 (Valid UUID, but doesn't exist in DB)
  console.log('\n1. Testing 404 Not Found...')
  const fakeUuid = '11111111-1111-1111-1111-111111111111'
  const res404 = await fetch(`http://localhost:3000/api/v1/articles/${fakeUuid}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  console.log(`Status: ${res404.status} (Expected 404)`)
  console.log(await res404.json())

  // 2. Test 422 (Validation Error - Missing required data on PATCH)
  // Wait, PATCH is partial. ArticleUpdateSchema allows optional fields.
  // But if we pass something explicitly invalid according to Zod, like a number instead of string
  console.log('\n2. Testing 422 Validation Error...')
  const res422 = await fetch(`http://localhost:3000/api/v1/articles/${fakeUuid}`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ priority: 'super-high-invalid-enum' })
  })
  console.log(`Status: ${res422.status} (Expected 422)`)
  console.log(await res422.json())

  // 3. Test 500 (Internal Server Error - Invalid UUID format causes DB syntax error)
  console.log('\n3. Testing 500 Internal Server Error...')
  const res500 = await fetch(`http://localhost:3000/api/v1/articles/invalid-uuid-string`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  console.log(`Status: ${res500.status} (Expected 500)`)
  console.log(await res500.json())
}

run()
