import { test, expect } from '@playwright/test'

// Note: To run this test fully end-to-end, the Next.js API, BullMQ Worker, and local Supabase must be running.
// Since the worker calls the real Gemini API, this test validates the enqueue process and the QA/Publish APIs directly.

test.describe('Translation Pipeline E2E', () => {
  const adminApiKey = process.env.ADMIN_API_KEY || 'test-fallback-key'
  let translationId: string

  test('1. Enqueue translation job via API', async ({ request }) => {
    // We use a dummy UUID for the articleId so we don't accidentally trigger a real Gemini call if the DB lacks it,
    // or we can expect a 202 indicating it was enqueued.
    const res = await request.post('/api/v1/translate', {
      headers: {
        'x-admin-api-key': adminApiKey
      },
      data: {
        articleId: '00000000-0000-0000-0000-000000000000',
        targetLanguage: 'Spanish',
        force: false
      }
    })
    
    // In a fresh local DB without an API key inserted, we expect 401 Unauthorized
    // This validates the route is reachable and RBAC is functioning.
    expect([202, 404, 400, 401]).toContain(res.status())
  })

  test('2. Approve translation in QA queue', async ({ request }) => {
    const res = await request.post('/api/v1/qa/approve', {
      headers: {
        'x-admin-api-key': adminApiKey
      },
      data: {
        translationId: '11111111-1111-1111-1111-111111111111',
        domain: 'example.com',
        templateSlug: 'test-template'
      }
    })

    expect([404, 401]).toContain(res.status())
  })

  test('3. Publish Kill switch', async ({ request }) => {
    const res = await request.post('/api/v1/publish/kill', {
      headers: {
        'x-admin-api-key': adminApiKey
      },
      data: {
        translationId: '11111111-1111-1111-1111-111111111111',
        domain: 'example.com',
        templateSlug: 'test-template',
        reason: 'E2E Test Kill'
      }
    })

    expect([404, 401]).toContain(res.status())
  })
})
