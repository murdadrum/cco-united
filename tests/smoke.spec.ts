import { test, expect } from '@playwright/test'

test.describe('Page load & navigation', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/CCO United/)
  })

  test('nav bar is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.getByText('CCO United', { exact: false }).first()).toBeVisible()
  })

  test('all major sections are present', async ({ page }) => {
    await page.goto('/')
    for (const id of ['#about', '#building', '#get-involved']) {
      await expect(page.locator(id)).toBeAttached()
    }
  })

  test('Request Access button scrolls to form', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /request access/i }).first().click()
    await expect(page.locator('#get-involved')).toBeInViewport({ ratio: 0.3 })
  })
})

test.describe('About section stats', () => {
  test('shows tribal citizens stat', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('450K+')).toBeVisible()
    await expect(page.getByText('Tribal Citizens')).toBeVisible()
  })

  test('shows economic impact stat', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('$2.16B')).toBeVisible()
  })

  test('shows constitutional governance stat', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('1839', { exact: true })).toBeVisible()
  })
})

test.describe('Building section', () => {
  test('feature cards are present', async ({ page }) => {
    await page.goto('/')
    const cards = page.locator('.feature-card')
    await expect(cards).toHaveCount(7)
  })

  test('each feature card has a CTA', async ({ page }) => {
    await page.goto('/')
    const ctas = page.locator('.feature-card-cta')
    await expect(ctas).toHaveCount(7)
  })

  test('Alisdelisgi spotlight is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.ali-spotlight')).toBeVisible()
    await expect(page.getByText(/One who helps/i).first()).toBeVisible()
  })

  test('Request Workspace Access button fits on one line', async ({ page }) => {
    await page.goto('/')
    const btn = page.getByRole('link', { name: /Request Workspace Access/i })
    await expect(btn).toBeVisible()
    const box = await btn.boundingBox()
    expect(box!.height).toBeLessThan(70)
  })
})
