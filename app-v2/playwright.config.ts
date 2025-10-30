import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  expect: { timeout: 5000 },
  use: { headless: true, viewport: { width: 1280, height: 720 } }
})
