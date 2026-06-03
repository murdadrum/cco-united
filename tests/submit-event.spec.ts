import { test, expect } from '@playwright/test'

test.describe('Submit Event page', () => {
  test('loads submit page with correct heading', async ({ page }) => {
    await page.goto('/events/submit')
    await expect(page.locator('h1')).toHaveText('Submit an Event')
  })

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/events/submit')
    await page.locator('button.btn-submit').click()
    await expect(page.locator('.field-error.visible').first()).toBeVisible()
  })

  test('shows format error for invalid email', async ({ page }) => {
    await page.goto('/events/submit')
    await page.fill('#sf-title', 'Test Event')
    await page.selectOption('#sf-cco', { index: 1 })
    await page.fill('#sf-date', '2026-07-01T10:00')
    await page.fill('#sf-location', 'Tahlequah, OK')
    await page.selectOption('#sf-type', { index: 1 })
    await page.fill('#sf-name', 'Test User')
    await page.fill('#sf-email', 'not-an-email')
    await page.locator('button.btn-submit').click()
    await expect(page.locator('.field-error.visible').filter({ hasText: /valid email/i })).toBeVisible()
  })

  test('submits successfully and shows Wado confirmation', async ({ page }) => {
    await page.route('/api/events/submit', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true, id: '99999' }) })
    })

    await page.goto('/events/submit')
    await page.fill('#sf-title', 'Test Event')
    await page.selectOption('#sf-cco', { index: 1 })
    await page.fill('#sf-date', '2026-07-01T10:00')
    await page.fill('#sf-location', 'Tahlequah, OK')
    await page.selectOption('#sf-type', { index: 1 })
    await page.fill('#sf-name', 'Playwright Test')
    await page.fill('#sf-email', 'test@example.com')
    await page.locator('button.btn-submit').click()

    await expect(page.locator('.form-success')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/wado/i)).toBeVisible()
  })
})
