

async function run() {
  const apiKey = process.env.ADMIN_API_KEY
  console.log('Testing Articles Pagination...')
  
  // Fetch first page
  const res1 = await fetch('http://localhost:3000/api/v1/articles?limit=2', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  const data1 = await res1.json()
  console.log('Page 1 Status:', res1.status)
  console.log('Page 1 count:', data1.data?.length)
  console.log('Page 1 Next Cursor:', data1.pagination?.nextCursor)
  
  if (data1.pagination?.nextCursor) {
    // Fetch second page
    const res2 = await fetch(`http://localhost:3000/api/v1/articles?limit=2&cursor=${data1.pagination.nextCursor}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    const data2 = await res2.json()
    console.log('Page 2 Status:', res2.status)
    console.log('Page 2 count:', data2.data?.length)
    console.log('Page 2 Next Cursor:', data2.pagination?.nextCursor)
  }

  console.log('\nTesting Translations Pagination...')
  
  // Fetch first page
  const res3 = await fetch('http://localhost:3000/api/v1/translations?limit=2', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  const data3 = await res3.json()
  console.log('Translations Page 1 Status:', res3.status)
  console.log('Translations Page 1 count:', data3.data?.length)
  console.log('Translations Page 1 Next Cursor:', data3.pagination?.nextCursor)
}

run()
