import { test, expect } from '@playwright/test'

// ── /volunteers page ──────────────────────────────────────────────────────────

test.describe('Volunteers page — smoke', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/volunteers')
    await expect(page).toHaveTitle(/Volunteer/)
  })

  test('hero heading is visible', async ({ page }) => {
    await page.goto('/volunteers')
    await expect(page.getByRole('heading', { name: /Volunteer Network/i })).toBeVisible()
  })

  test('nav is present with Volunteers link active', async ({ page }) => {
    await page.goto('/volunteers')
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.locator('.nav-links a.nav-active', { hasText: 'Volunteers' })).toBeVisible()
  })

  test('volunteer grid renders cards', async ({ page }) => {
    await page.goto('/volunteers')
    const cards = page.locator('.volunteer-card, .event-card, .form-card')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })

  test('grid or empty state is present', async ({ page }) => {
    await page.goto('/volunteers')
    // Either the grid with filter controls OR the empty-state card
    const hasFilters = await page.getByRole('button', { name: /All/i }).first().isVisible().catch(() => false)
    const hasEmptyState = await page.getByText(/Volunteer Registry Coming Soon/i).isVisible().catch(() => false)
    expect(hasFilters || hasEmptyState).toBe(true)
  })

  test('filter buttons toggle active state (when grid is populated)', async ({ page }) => {
    await page.goto('/volunteers')
    const allBtn = page.getByRole('button', { name: /^All$/i }).first()
    const hasFilters = await allBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasFilters) {
      // Volunteer board empty in this env — skip
      test.skip()
      return
    }
    const activeBtn = page.getByRole('button', { name: /^Active$/i }).first()
    await activeBtn.click()
    const afterBg = await activeBtn.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(afterBg).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('registration section is present below the grid', async ({ page }) => {
    await page.goto('/volunteers')
    await expect(page.locator('#volunteer-register')).toBeAttached()
    await expect(page.getByText(/Join the Network/i)).toBeVisible({ timeout: 10000 })
  })
})

// ── VolunteerForm ─────────────────────────────────────────────────────────────

test.describe('VolunteerForm — validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/volunteers')
    await page.locator('#volunteer-register').scrollIntoViewIfNeeded()
    // Wait for the reveal animation to make the form visible
    await page.locator('#vf-name').waitFor({ state: 'attached', timeout: 10000 })
    await page.evaluate(() => {
      // Force-reveal all .reveal elements so tests aren't blocked by IntersectionObserver
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'))
    })
    await expect(page.locator('#vf-name')).toBeVisible({ timeout: 5000 })
  })

  test('all form fields are present', async ({ page }) => {
    await expect(page.locator('#vf-name')).toBeVisible()
    await expect(page.locator('#vf-email')).toBeVisible()
    await expect(page.locator('#vf-phone')).toBeVisible()
    await expect(page.locator('#vf-location')).toBeVisible()
    await expect(page.locator('#vf-hours')).toBeVisible()
    await expect(page.locator('#vf-start')).toBeVisible()
    await expect(page.locator('#vf-message')).toBeVisible()
  })

  test('skill toggle buttons are present', async ({ page }) => {
    const skills = page.locator('#volunteer-register button[type="button"]')
    await expect(skills).toHaveCount(17)
  })

  test('clicking a skill button toggles its selected state', async ({ page }) => {
    const skillBtn = page.locator('#volunteer-register button[type="button"]').first()
    const initialBg = await skillBtn.evaluate(el => getComputedStyle(el).backgroundColor)
    await skillBtn.click()
    await expect(skillBtn).not.toHaveCSS('background-color', initialBg)
  })

  test('submit without name shows validation error', async ({ page }) => {
    await page.fill('#vf-email', 'test@example.com')
    await page.locator('#volunteer-register button.btn-submit').click()
    await expect(page.locator('#volunteer-register .field-error.visible').first()).toBeVisible()
  })

  test('submit without email shows validation error', async ({ page }) => {
    await page.fill('#vf-name', 'Test User')
    await page.locator('#volunteer-register button.btn-submit').click()
    await expect(page.locator('#volunteer-register .field-error.visible').first()).toBeVisible()
  })

  test('submit with invalid email shows validation error', async ({ page }) => {
    await page.fill('#vf-name', 'Test User')
    await page.fill('#vf-email', 'not-an-email')
    await page.locator('#volunteer-register button.btn-submit').click()
    await expect(page.locator('#volunteer-register .field-error.visible').first()).toBeVisible()
  })

  test('successful submit shows Wado confirmation', async ({ page }) => {
    await page.route('/api/volunteer', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) })
    })

    await page.fill('#vf-name', 'Playwright Test')
    await page.fill('#vf-email', 'test@example.com')
    await page.fill('#vf-phone', '9185550000')
    await page.fill('#vf-location', 'Tahlequah, OK')
    await page.selectOption('#vf-hours', '4-6')
    await page.fill('#vf-message', 'Automated test submission')
    await page.locator('#volunteer-register button.btn-submit').click()

    await expect(page.locator('#volunteer-register .form-success')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#volunteer-register .form-success').getByText(/wado/i)).toBeVisible()
  })

  test('submit button is disabled while request is in-flight', async ({ page }) => {
    await page.route('/api/volunteer', async route => {
      await new Promise(r => setTimeout(r, 1500))
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) })
    })

    await page.fill('#vf-name', 'Test User')
    await page.fill('#vf-email', 'test@example.com')
    await page.locator('#volunteer-register button.btn-submit').click()

    await expect(page.locator('#volunteer-register button.btn-submit')).toBeDisabled({ timeout: 3000 })
  })

  test('API 500 shows alert and form remains editable', async ({ page }) => {
    await page.route('/api/volunteer', async route => {
      await route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) })
    })
    page.on('dialog', d => d.accept())

    await page.fill('#vf-name', 'Test User')
    await page.fill('#vf-email', 'test@example.com')
    await page.locator('#volunteer-register button.btn-submit').click()

    await expect(page.locator('#vf-name')).toBeEditable({ timeout: 5000 })
    await expect(page.locator('#volunteer-register .form-success')).toBeHidden()
  })

  test('XSS payload in name does not execute', async ({ page }) => {
    await page.route('/api/volunteer', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) })
    })

    let alertFired = false
    page.on('dialog', () => { alertFired = true })

    await page.fill('#vf-name', '<script>alert("xss")</script>')
    await page.fill('#vf-email', 'test@example.com')
    await page.locator('#volunteer-register button.btn-submit').click()

    await page.waitForTimeout(1000)
    expect(alertFired).toBe(false)
  })
})

// ── /api/volunteer — contract tests ──────────────────────────────────────────

test.describe('API /api/volunteer — contract', () => {
  test('returns 400 when name is missing', async ({ request }) => {
    const res = await request.post('/api/volunteer', {
      data: { email: 'test@example.com' },
    })
    expect(res.status()).toBe(400)
  })

  test('returns 400 when email is missing', async ({ request }) => {
    const res = await request.post('/api/volunteer', {
      data: { name: 'Test User' },
    })
    expect(res.status()).toBe(400)
  })

  test('returns 400 for empty body', async ({ request }) => {
    const res = await request.post('/api/volunteer', { data: {} })
    expect(res.status()).toBe(400)
  })

  test('does not expose stack traces in 400 error body', async ({ request }) => {
    const res = await request.post('/api/volunteer', { data: {} })
    const body = await res.text()
    expect(body).not.toMatch(/at Object\.|\.js:\d+:\d+|node_modules/)
  })
})
