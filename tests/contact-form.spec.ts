import { test, expect } from '@playwright/test'

test.describe('Contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#get-involved')
  })

  test('form fields are visible', async ({ page }) => {
    await expect(page.locator('#f-name')).toBeVisible()
    await expect(page.locator('#f-email')).toBeVisible()
    await expect(page.locator('#f-org')).toBeVisible()
    await expect(page.locator('#f-role')).toBeVisible()
    await expect(page.locator('#f-interest')).toBeVisible()
    await expect(page.locator('#f-msg')).toBeVisible()
  })

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.locator('button.btn-submit').click()
    await expect(page.locator('.field-error.visible').first()).toBeVisible()
  })

  test('shows error for invalid email', async ({ page }) => {
    await page.fill('#f-name', 'Test User')
    await page.fill('#f-email', 'not-an-email')
    await page.fill('#f-org', 'Test Org')
    await page.locator('button.btn-submit').click()
    await expect(page.locator('#err-email')).toHaveClass(/visible/)
  })

  test('submits successfully with valid data and shows thank you', async ({ page }) => {
    // Intercept the API call so we don't send real emails during tests
    await page.route('/api/contact', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) })
    })

    await page.fill('#f-name', 'Playwright Test')
    await page.fill('#f-email', 'test@example.com')
    await page.fill('#f-org', 'Test CCO')
    await page.fill('#f-role', 'Tester')
    await page.selectOption('#f-interest', 'Volunteer')
    await page.fill('#f-msg', 'Automated test submission')
    await page.locator('button.btn-submit').click()

    await expect(page.locator('.form-success')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/thank you/i)).toBeVisible()
  })

  test('shows error alert when API fails', async ({ page }) => {
    await page.route('/api/contact', async route => {
      await route.fulfill({ status: 500, body: JSON.stringify({ error: 'Failed' }) })
    })

    await page.fill('#f-name', 'Playwright Test')
    await page.fill('#f-email', 'test@example.com')
    await page.fill('#f-org', 'Test CCO')

    // Capture the dialog before clicking
    const dialogPromise = page.waitForEvent('dialog')
    await page.locator('button.btn-submit').click()
    const dialog = await dialogPromise
    expect(dialog.message()).toContain('Something went wrong')
    await dialog.accept()
  })
})
