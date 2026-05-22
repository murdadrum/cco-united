import { test, expect } from '@playwright/test'

test.describe('Page load & navigation', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/CCO United/)
  })

  test('nav bar is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav')).toBeVisible()
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
  test('shows 14 CCO Organizations stat', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('14')).toBeVisible()
    await expect(page.getByText('CCO Organizations')).toBeVisible()
  })

  test('shows 501(c)(3) stat without wrapping', async ({ page }) => {
    await page.goto('/')
    const statEl = page.getByText('501(c)(3)')
    await expect(statEl).toBeVisible()
    const box = await statEl.boundingBox()
    // Should fit on one line — height under 60px
    expect(box!.height).toBeLessThan(60)
  })

  test('infinity symbol is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('∞')).toBeVisible()
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
    await expect(page.getByText(/One who helps/i)).toBeVisible()
  })

  test('Request Workspace Access button fits on one line', async ({ page }) => {
    await page.goto('/')
    const btn = page.getByRole('link', { name: /Request Workspace Access/i })
    await expect(btn).toBeVisible()
    const box = await btn.boundingBox()
    expect(box!.height).toBeLessThan(70)
  })
})
