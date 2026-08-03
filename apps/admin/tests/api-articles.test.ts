import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { GET, POST } from '../app/api/v1/articles/route'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const TEMPLATE_ID = '00000000-0000-0000-0000-000000000000'

const TEMPLATE_ROW = {
  id: TEMPLATE_ID,
  name: 'Test Template',
  slug: 'test',
  active: true,
  deleted_at: null,
}

const server = setupServer(
  http.get('*/rest/v1/articles', ({ request }) => {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')
    const accept = request.headers.get('Accept') || ''

    // Slug uniqueness check uses maybeSingle — must not return an array
    if (slug) {
      return HttpResponse.json(null)
    }

    if (accept.includes('object')) {
      return HttpResponse.json({ id: '1', title: 'Test Article 1', content: 'Content 1' })
    }

    return HttpResponse.json([
      { id: '1', title: 'Test Article 1', content: 'Content 1' },
      { id: '2', title: 'Test Article 2', content: 'Content 2' },
    ])
  }),
  http.get(/.*\/rest\/v1\/templates.*/, ({ request }) => {
    const accept = request.headers.get('Accept') || ''
    if (accept.includes('object')) {
      return HttpResponse.json(TEMPLATE_ROW)
    }
    return HttpResponse.json([TEMPLATE_ROW])
  }),
  http.post('*/rest/v1/articles', async () => {
    return HttpResponse.json({ id: '3', title: 'New Article', slug: 'new-article' }, { status: 201 })
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Articles API (Integration)', () => {
  it('GET /api/v1/articles returns paginated articles via MSW', async () => {
    const req = new Request('http://localhost:3000/api/v1/articles?limit=10')
    const res = await GET(req)
    
    expect(res.status).toBe(200)
    
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(2)
    expect(body.data[0].title).toBe('Test Article 1')
    expect(body.pagination.limit).toBe(10)
  })

  it('POST /api/v1/articles validates input via Zod and uses MSW', async () => {
    // 1. Test validation failure
    const badReq = new Request('http://localhost:3000/api/v1/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'draft' }) // Missing required title, content, template_id
    })
    const badRes = await POST(badReq)
    expect(badRes.status).toBe(422)

    // 2. Test successful creation
    const goodReq = new Request('http://localhost:3000/api/v1/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Article',
        content: '<p>Hi</p>',
        template_id: TEMPLATE_ID,
      }),
    })
    const goodRes = await POST(goodReq)
    expect(goodRes.status).toBe(201)
    
    const body = await goodRes.json()
    expect(body.success).toBe(true)
    expect(body.data.title).toBe('New Article')
  })
})
