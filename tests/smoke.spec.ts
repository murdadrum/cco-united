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

test.describe('Navigation links', () => {
  test('Events link is present in nav', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.nav-links').getByRole('link', { name: 'Events' })).toBeVisible()
  })

  test('Volunteers link is present in nav', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.nav-links').getByRole('link', { name: 'Volunteers' })).toBeVisible()
  })

  test('QA | MIGRATION link is present in nav', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.nav-links').getByRole('link', { name: 'QA | MIGRATION' })).toBeVisible()
  })

  test('QA | JIRA link is present in nav', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.nav-links').getByRole('link', { name: 'QA | JIRA' })).toBeVisible()
  })

  test('QA | GitHub link opens github.com', async ({ page }) => {
    await page.goto('/')
    const link = page.locator('.nav-links').getByRole('link', { name: 'QA | GitHub' })
    await expect(link).toHaveAttribute('href', 'https://github.com/murdadrum/ccou-salesforce')
    await expect(link).toHaveAttribute('target', '_blank')
  })

  test('/volunteers route returns 200', async ({ request }) => {
    const res = await request.get('/volunteers')
    expect(res.status()).toBe(200)
  })

  test('/qa route returns 200', async ({ request }) => {
    const res = await request.get('/qa')
    expect(res.status()).toBe(200)
  })

  test('/migration-status route returns 200', async ({ request }) => {
    const res = await request.get('/migration-status')
    expect(res.status()).toBe(200)
  })
})

test.describe('Building section', () => {
  test('feature cards are present', async ({ page }) => {
    await page.goto('/')
    const cards = page.locator('.feature-card')
    await expect(cards).toHaveCount(9)
  })

  test('each feature card has a CTA', async ({ page }) => {
    await page.goto('/')
    const ctas = page.locator('.feature-card-cta')
    await expect(ctas).toHaveCount(9)
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
