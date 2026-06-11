import { test, expect } from '@playwright/test'

// ── /qa page — smoke ──────────────────────────────────────────────────────────

test.describe('QA Board page — smoke', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/qa')
    await expect(page).toHaveTitle(/QA Board/)
  })

  test('hero heading is visible', async ({ page }) => {
    await page.goto('/qa')
    await expect(page.getByRole('heading', { name: /QA Board/i })).toBeVisible()
  })

  test('nav is present with QA | JIRA link active', async ({ page }) => {
    await page.goto('/qa')
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.locator('.nav-links a.nav-active')).toBeVisible()
  })

  test('At a Glance stat cards are present', async ({ page }) => {
    await page.goto('/qa')
    await expect(page.getByText('At a Glance')).toBeVisible()
    await expect(page.getByText('Total Issues')).toBeVisible()
    // Use .first() — page may have many "Done" badges from the issues list
    await expect(page.getByText('Done').first()).toBeVisible()
    await expect(page.getByText('In Progress').first()).toBeVisible()
    await expect(page.getByText('To Do').first()).toBeVisible()
  })

  test('Sprint Progress section renders gauge', async ({ page }) => {
    await page.goto('/qa')
    await expect(page.getByText('Sprint Progress')).toBeVisible()
    await expect(page.getByText('Overall Completion')).toBeVisible()
  })

  test('Issues by Epic section is present', async ({ page }) => {
    await page.goto('/qa')
    await expect(page.getByText('Issues by Epic')).toBeVisible()
  })

  test('Jira link in hero opens correct URL', async ({ page }) => {
    await page.goto('/qa')
    const link = page.getByRole('link', { name: /cco-united.atlassian.net/i })
    await expect(link).toHaveAttribute('href', /cco-united\.atlassian\.net/)
  })

  test('shows issue keys from SCRUM project', async ({ page }) => {
    await page.goto('/qa')
    // At least one SCRUM key should appear — use .first() for strict mode
    await expect(page.getByText(/SCRUM-/).first()).toBeVisible({ timeout: 10000 })
  })

  test('completion percentage is displayed', async ({ page }) => {
    await page.goto('/qa')
    await expect(page.locator('text=/\\d+%/').first()).toBeVisible()
  })
})

// ── /api/jira-board — contract ────────────────────────────────────────────────

test.describe('API /api/jira-board — contract', () => {
  test('returns 200 with array of issues', async ({ request }) => {
    const res = await request.get('/api/jira-board')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('each issue has key, summary, status, issuetype', async ({ request }) => {
    const res = await request.get('/api/jira-board')
    const issues = await res.json()
    if (issues.length === 0) return // Jira unavailable in this env — skip shape check
    for (const issue of issues.slice(0, 5)) {
      expect(issue).toHaveProperty('key')
      expect(issue).toHaveProperty('fields.summary')
      expect(issue).toHaveProperty('fields.status.name')
      expect(issue).toHaveProperty('fields.issuetype.name')
    }
  })

  test('includes SCRUM project keys', async ({ request }) => {
    const res = await request.get('/api/jira-board')
    const issues = await res.json()
    if (issues.length === 0) return
    expect(issues.some((i: { key: string }) => i.key.startsWith('SCRUM-'))).toBe(true)
  })

  test('does not expose stack traces on error', async ({ request }) => {
    // The API gracefully returns 503 if Jira is unavailable — never a raw stack
    const res = await request.get('/api/jira-board')
    const body = await res.text()
    expect(body).not.toMatch(/at Object\.|\.js:\d+:\d+|node_modules/)
  })
})

// ── QA Board page — edge cases ────────────────────────────────────────────────

test.describe('QA Board page — edge cases', () => {
  test('Jira API 503 does not crash the page', async ({ page }) => {
    await page.route('/api/jira-board', async route => {
      await route.fulfill({ status: 503, body: JSON.stringify({ error: 'Jira unavailable' }) })
    })
    await page.goto('/qa')
    // Nav and hero should still render
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /QA Board/i })).toBeVisible()
  })

  test('empty issue list renders stat cards with zeros', async ({ page }) => {
    await page.route('/api/jira-board', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) })
    })
    await page.goto('/qa')
    await expect(page.getByText('Total Issues')).toBeVisible()
    await expect(page.getByText('0%')).toBeVisible()
  })
})
