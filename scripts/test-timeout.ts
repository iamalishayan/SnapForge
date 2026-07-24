import { withTimeout } from '../packages/shared/src/timeout'

async function run() {
  console.log('Testing withTimeout utility...')

  // Test 1: Resolves in time
  try {
    const fastPromise = new Promise(resolve => setTimeout(() => resolve('success'), 500))
    const result = await withTimeout(fastPromise, 1000, 'Should not timeout')
    console.log('✅ Test 1 Passed:', result)
  } catch (err: any) {
    console.error('❌ Test 1 Failed:', err.message)
    process.exit(1)
  }

  // Test 2: Times out
  try {
    const slowPromise = new Promise(resolve => setTimeout(() => resolve('too late'), 1500))
    await withTimeout(slowPromise, 1000, 'Expected timeout error')
    console.error('❌ Test 2 Failed: Promise did not timeout')
    process.exit(1)
  } catch (err: any) {
    if (err.message === 'Expected timeout error') {
      console.log('✅ Test 2 Passed: Successfully timed out!')
    } else {
      console.error('❌ Test 2 Failed with wrong error:', err.message)
      process.exit(1)
    }
  }

  console.log('All tests passed!')
}

run()
