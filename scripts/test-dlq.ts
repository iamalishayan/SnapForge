import { config } from 'dotenv'
config({ path: '.env.local' })
import { translationQueue, deadLetterQueue } from '../packages/queue/src/index'

async function run() {
  console.log('Adding a deliberately bad job to translationQueue...')
  
  const job = await translationQueue.add('translate', {
    articleId: 'bad-uuid-that-does-not-exist',
    siteConfigId: 'another-bad-uuid',
    targetLanguage: 'en',
    countryCode: 'US'
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 } // fast backoff for testing
  })

  console.log('Job added! Wait 10 seconds for it to fail 3 times and hit the DLQ...')
  
  let dlqJobs = 0
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1000))
    dlqJobs = await deadLetterQueue.getJobCountByTypes('waiting', 'active', 'delayed')
    if (dlqJobs > 0) {
      console.log(`✅ Success! Found ${dlqJobs} job(s) in the Dead Letter Queue!`)
      process.exit(0)
    }
    console.log('Waiting...')
  }
  
  console.log('❌ Failed to find job in DLQ after 20 seconds.')
  process.exit(1)
}

run()
