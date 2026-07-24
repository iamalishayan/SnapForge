import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

export default defineConfig({
  test: {
    exclude: ['**/e2e/**', '**/node_modules/**']
  }
})
