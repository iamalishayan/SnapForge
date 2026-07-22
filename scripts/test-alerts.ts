#!/usr/bin/env tsx
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { sendAlert } from '../packages/shared/src/alerts'

async function runTest() {
  console.log('🔄 Triggering test system alert dispatch using Resend API...')
  try {
    const success = await sendAlert(
      'Database Connection Status',
      'The automated verification check passed successfully. Connection to Supabase is active.'
    )
    if (success) {
      console.log('🎉 Verification Success! (Check your ALERT_EMAIL inbox for sandbox email).')
    } else {
      throw new Error('Verification Failure: Alert send method returned false.')
    }
  } catch (error: any) {
    console.error('❌ Alert test failed:', error.message)
    process.exit(1)
  }
}

runTest()
