import { test, expect } from '@playwright/test'

test.describe('Alisdelisgi chat widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('widget toggle button is visible', async ({ page }) => {
    await expect(page.locator('#ali-toggle')).toBeVisible()
  })

  test('chat panel is collapsed by default', async ({ page }) => {
    const panel = page.locator('#ali-panel')
    // Panel exists but should not be expanded
    await expect(panel).toBeAttached()
    await expect(panel).not.toHaveClass(/open/)
  })

  test('opens chat panel on toggle click', async ({ page }) => {
    await page.locator('#ali-toggle').click()
    await expect(page.locator('#ali-panel')).toBeVisible({ timeout: 2000 })
  })

  test('sends a message and receives a streaming response', async ({ page }) => {
    // Mock the streaming API so tests are fast and free
    await page.route('/api/chat', async route => {
      const encoder = new TextEncoder()
      const body = encoder.encode('data: Hello from Alis!\n\ndata: [DONE]\n\n')
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body,
      })
    })

    await page.locator('#ali-toggle').click()
    await expect(page.locator('#ali-panel')).toBeVisible()

    const input = page.locator('#ali-input')
    await input.fill('Hello')
    await page.keyboard.press('Enter')

    // A response message should appear in the chat
    await expect(page.locator('.ali-msg').last()).toBeVisible({ timeout: 8000 })
  })

  test('closes chat panel on second toggle click', async ({ page }) => {
    await page.locator('#ali-toggle').click()
    await expect(page.locator('#ali-panel')).toBeVisible()
    await page.locator('#ali-toggle').click()
    await expect(page.locator('#ali-panel')).not.toBeVisible({ timeout: 2000 })
  })
})
