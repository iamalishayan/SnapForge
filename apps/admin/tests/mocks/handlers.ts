import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock GET /articles
  http.get('*/rest/v1/articles', () => {
    return HttpResponse.json([
      { id: '1', title: 'Test Article 1', content: 'Content 1' },
      { id: '2', title: 'Test Article 2', content: 'Content 2' }
    ])
  }),

  // Mock POST /articles
  http.post('*/rest/v1/articles', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json([
      { id: '3', ...body as any }
    ], { status: 201 })
  })
]
