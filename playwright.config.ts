import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

// Generate Playwright specs from Gherkin .feature files
// Run `npx bddgen` before executing salesforce-bdd tests
const bddTestDir = defineBddConfig({
  features: './tests/bdd/features/**/*.feature',
  steps: './tests/bdd/steps/**/*.ts',
})

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['html'], ['json', { outputFile: 'test-results/results.json' }]]
    : 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // ── Monday-baseline (existing) ─────────────────────────────
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },

    // ── Salesforce BDD (new) ───────────────────────────────────
    // Phase 0: targets Next.js localhost (hello-world proof)
    // Phase 4+: set SF_BASE_URL to the Experience Cloud site URL
    {
      name: 'salesforce-bdd',
      testDir: bddTestDir,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.SF_BASE_URL || process.env.BASE_URL || 'http://localhost:3000',
      },
    },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
})
