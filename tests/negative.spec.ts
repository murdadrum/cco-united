/**
 * Negative / adversarial test suite
 *
 * Covers: API error paths, boundary inputs, network failures, HTML injection,
 * empty-state rendering, and navigation edge cases across all major surfaces.
 */
import { test, expect } from '@playwright/test'

// ── API: /api/contact ─────────────────────────────────────────────────────────
test.describe('API /api/contact — negative paths', () => {
  test('returns 400 when name is missing', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: { email: 'test@example.com', org: 'TestCCO', interest: 'General Inquiry' },
    })
    expect(res.status()).toBe(400)
  })

  test('returns 400 when email is missing', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: { name: 'Test User', org: 'TestCCO', interest: 'General Inquiry' },
    })
    expect(res.status()).toBe(400)
  })

  test('returns 400 for empty body', async ({ request }) => {
    const res = await request.post('/api/contact', { data: {} })
    expect(res.status()).toBe(400)
  })
})

// ── API: /api/housing ─────────────────────────────────────────────────────────
test.describe('API /api/housing — negative paths', () => {
  test('returns 400 when name is missing', async ({ request }) => {
    const res = await request.post('/api/housing', {
      data: { email: 'x@example.com', program: 'Rental Assistance' },
    })
    expect(res.status()).toBe(400)
  })

  test('returns 400 when email is missing', async ({ request }) => {
    const res = await request.post('/api/housing', {
      data: { name: 'Test User', program: 'Emergency Shelter' },
    })
    expect(res.status()).toBe(400)
  })

  test('returns 400 when program is missing', async ({ request }) => {
    const res = await request.post('/api/housing', {
      data: { name: 'Test User', email: 'x@example.com' },
    })
    expect(res.status()).toBe(400)
  })

  test('returns 400 for completely empty body', async ({ request }) => {
    const res = await request.post('/api/housing', { data: {} })
    expect(res.status()).toBe(400)
  })
})

// ── API: /api/events/submit ───────────────────────────────────────────────────
test.describe('API /api/events/submit — negative paths', () => {
  test('returns 400 when title is missing', async ({ request }) => {
    const res = await request.post('/api/events/submit', {
      data: {
        cco: 'Park Hill Cultural Circle',
        date: '2026-09-01T10:00',
        location: 'Tahlequah, OK',
        type: 'Cultural',
        submitterName: 'Test',
        submitterEmail: 'test@example.com',
      },
    })
    expect(res.status()).toBe(400)
  })

  test('returns 400 for empty body', async ({ request }) => {
    const res = await request.post('/api/events/submit', { data: {} })
    expect(res.status()).toBe(400)
  })
})

// ── Contact form — boundary inputs ────────────────────────────────────────────
test.describe('Contact form — boundary inputs', () => {
  test('XSS payload in name field does not execute', async ({ page }) => {
    await page.goto('/#get-involved')
    await page.route('/api/contact', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) })
    })

    let alertFired = false
    page.on('dialog', () => { alertFired = true })

    await page.fill('#f-name', '<script>alert("xss")</script>')
    await page.fill('#f-email', 'test@example.com')
    await page.fill('#f-org', 'Test Org')
    await page.locator('button.btn-submit').click()

    await page.waitForTimeout(1000)
    expect(alertFired).toBe(false)
  })

  test('form fields remain editable after API 500 error', async ({ page }) => {
    await page.goto('/#get-involved')
    await page.route('/api/contact', async route => {
      await route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) })
    })

    page.on('dialog', d => d.accept())

    await page.fill('#f-name', 'Test User')
    await page.fill('#f-email', 'test@example.com')
    await page.fill('#f-org', 'Test Org')
    await page.locator('button.btn-submit').click()

    // Form must remain interactive after error
    await expect(page.locator('#f-name')).toBeEditable({ timeout: 5000 })
    await expect(page.locator('#f-email')).toBeEditable({ timeout: 5000 })
  })
})

// ── Submit Event form — boundary inputs ───────────────────────────────────────
test.describe('Submit Event form — boundary inputs', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Submit button timing differs in WebKit emulation')
    await page.goto('/events/submit')
  })

  test('past date is accepted by browser date input (server validates)', async ({ page }) => {
    // The form should not JS-block past dates — server-side owns that rule
    await page.fill('#sf-title', 'Past Event')
    await page.selectOption('#sf-cco', { index: 1 })
    await page.fill('#sf-date', '2020-01-01T10:00')
    await page.fill('#sf-location', 'Tahlequah, OK')
    await page.selectOption('#sf-type', { index: 1 })
    await page.fill('#sf-name', 'Test User')
    await page.fill('#sf-email', 'test@example.com')
    // No field-error should appear for date — only server may reject it
    await expect(page.locator('.field-error.visible').filter({ hasText: /date/i })).toHaveCount(0)
  })

  test('API failure shows graceful error state', async ({ page }) => {
    await page.route('/api/events/submit', async route => {
      await route.fulfill({ status: 503, body: JSON.stringify({ error: 'Service unavailable' }) })
    })

    await page.fill('#sf-title', 'Test Event')
    await page.selectOption('#sf-cco', { index: 1 })
    await page.fill('#sf-date', '2026-09-01T10:00')
    await page.fill('#sf-location', 'Tahlequah, OK')
    await page.selectOption('#sf-type', { index: 1 })
    await page.fill('#sf-name', 'Test User')
    await page.fill('#sf-email', 'test@example.com')
    await page.locator('button.btn-submit').click()

    // Success screen must NOT appear
    await expect(page.locator('.form-success')).toBeHidden({ timeout: 5000 })
  })

  test('submit button is disabled during in-flight request', async ({ page }) => {
    // Slow route so we can observe the loading state
    await page.route('/api/events/submit', async route => {
      await new Promise(r => setTimeout(r, 1500))
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true, id: '99999' }) })
    })

    await page.fill('#sf-title', 'Test Event')
    await page.selectOption('#sf-cco', { index: 1 })
    await page.fill('#sf-date', '2026-09-01T10:00')
    await page.fill('#sf-location', 'Tahlequah, OK')
    await page.selectOption('#sf-type', { index: 1 })
    await page.fill('#sf-name', 'Test User')
    await page.fill('#sf-email', 'test@example.com')
    await page.locator('button.btn-submit').click()

    await expect(page.locator('button.btn-submit')).toBeDisabled({ timeout: 3000 })
  })
})

// ── Housing inquiry form — boundary inputs ────────────────────────────────────
test.describe('Housing form — boundary inputs', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'React hydration scroll timing in WebKit emulation is unreliable')
    await page.goto('/housing')
    // Wait for React to hydrate and render the form
    await expect(page.locator('#hi-name')).toBeVisible({ timeout: 10000 })
  })

  test('submit without required fields shows browser validation', async ({ page }) => {
    await page.locator('button[type="submit"]').last().click()
    // HTML5 required prevents submission — form-success must not appear
    await expect(page.locator('.form-success')).toBeHidden()
  })

  test('API 500 shows inline error message', async ({ page }) => {
    await page.route('/api/housing', async route => {
      await route.fulfill({ status: 500, body: JSON.stringify({ error: 'Service unavailable' }) })
    })

    await page.fill('#hi-name', 'Test User')
    await page.fill('#hi-email', 'test@example.com')
    await page.selectOption('#hi-program', { index: 1 })
    await page.locator('button[type="submit"]').last().click()

    await expect(page.locator('.form-success')).toBeHidden({ timeout: 5000 })
    // The error <p> is rendered inline inside the form when status === 'error'
    await expect(page.locator('#inquire p').filter({ hasText: /wrong|failed|error|unavailable/i }).first()).toBeVisible({ timeout: 5000 })
  })

  test('network failure shows inline error message', async ({ page }) => {
    await page.route('/api/housing', async route => {
      await route.abort('failed')
    })

    await page.fill('#hi-name', 'Test User')
    await page.fill('#hi-email', 'test@example.com')
    await page.selectOption('#hi-program', { index: 1 })
    await page.locator('button[type="submit"]').last().click()

    await expect(page.locator('.form-success')).toBeHidden({ timeout: 5000 })
    await expect(page.locator('#inquire p').filter({ hasText: /wrong|failed|error|unavailable/i }).first()).toBeVisible({ timeout: 5000 })
  })

  test('submit button shows loading text during in-flight request', async ({ page }) => {
    await page.route('/api/housing', async route => {
      await new Promise(r => setTimeout(r, 1500))
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true, caseId: 'CASE001234' }) })
    })

    await page.fill('#hi-name', 'Test User')
    await page.fill('#hi-email', 'test@example.com')
    await page.selectOption('#hi-program', { index: 1 })
    await page.locator('button[type="submit"]').last().click()

    await expect(page.locator('button[type="submit"]').last()).toBeDisabled({ timeout: 3000 })
    await expect(page.locator('button[type="submit"]').last()).toContainText(/sending/i, { timeout: 3000 })
  })

  test('success state shows reference number from caseId', async ({ page }) => {
    await page.route('/api/housing', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true, caseId: 'CASE001234ABCDEF' }) })
    })

    await page.fill('#hi-name', 'Test User')
    await page.fill('#hi-email', 'test@example.com')
    await page.selectOption('#hi-program', { index: 1 })
    await page.locator('button[type="submit"]').last().click()

    await expect(page.locator('.form-success')).toBeVisible({ timeout: 5000 })
    // Should show last 6 chars of caseId uppercased: ABCDEF
    await expect(page.getByText(/ABCDEF/)).toBeVisible()
  })

  test('success state has a Reset button that restores the form', async ({ page }) => {
    await page.route('/api/housing', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true, caseId: 'CASE001234ABCDEF' }) })
    })

    await page.fill('#hi-name', 'Test User')
    await page.fill('#hi-email', 'test@example.com')
    await page.selectOption('#hi-program', { index: 1 })
    await page.locator('button[type="submit"]').last().click()

    await expect(page.locator('.form-success')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /submit another|new inquiry|reset/i }).click()
    await expect(page.locator('#hi-name')).toBeVisible()
    await expect(page.locator('#hi-name')).toHaveValue('')
  })

  test('liaison contact-this-coordinator pre-fills message and scrolls to form', async ({ page }) => {
    await page.goto('/housing')
    // Select a district in the liaison lookup
    await page.locator('.housing-district-select').selectOption({ index: 1 })
    // Click the contact coordinator button
    await page.getByRole('button', { name: /contact this coordinator/i }).click()
    // Message field should be pre-filled
    const msgVal = await page.locator('#hi-message').inputValue()
    expect(msgVal.length).toBeGreaterThan(5)
  })
})

// ── Alisdelisgi chat — edge cases ─────────────────────────────────────────────
test.describe('Alisdelisgi chat — edge cases', () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Chat widget SSE streaming unreliable in WebKit emulation')
    await page.goto('/')
    await page.locator('#ali-toggle').click()
    await expect(page.locator('#ali-msgs')).toBeVisible()
  })

  test('empty message does not send', async ({ page }) => {
    const initialCount = await page.locator('#ali-msgs > div').count()
    await page.locator('#ali-input').fill('')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    const afterCount = await page.locator('#ali-msgs > div').count()
    expect(afterCount).toBe(initialCount)
  })

  test('whitespace-only message does not send', async ({ page }) => {
    const initialCount = await page.locator('#ali-msgs > div').count()
    await page.locator('#ali-input').fill('   ')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    const afterCount = await page.locator('#ali-msgs > div').count()
    expect(afterCount).toBe(initialCount)
  })

  test('API error does not crash the widget', async ({ page }) => {
    await page.route('/api/chat', async route => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' })
    })

    await page.locator('#ali-input').fill('Hello')
    await page.keyboard.press('Enter')

    // Widget should still be visible after error
    await expect(page.locator('#ali-msgs')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#ali-toggle')).toBeVisible()
  })

  test('network abort does not crash the widget', async ({ page }) => {
    await page.route('/api/chat', async route => {
      await route.abort('failed')
    })

    await page.locator('#ali-input').fill('Hello')
    await page.keyboard.press('Enter')

    await expect(page.locator('#ali-msgs')).toBeVisible({ timeout: 5000 })
  })

  test('XSS payload in chat input is not executed', async ({ page }) => {
    await page.route('/api/chat', async route => {
      const encoder = new TextEncoder()
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: encoder.encode('data: Safe response\n\ndata: [DONE]\n\n'),
      })
    })

    let alertFired = false
    page.on('dialog', () => { alertFired = true })

    await page.locator('#ali-input').fill('<img src=x onerror=alert(1)>')
    await page.keyboard.press('Enter')

    await page.waitForTimeout(1000)
    expect(alertFired).toBe(false)
  })
})

// ── Events page — edge cases ──────────────────────────────────────────────────
test.describe('Events page — edge cases', () => {
  test('API returning empty array shows empty state, not a crash', async ({ page }) => {
    await page.route('/api/events', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) })
    })
    await page.goto('/events')
    // Page should still have the heading and no JS error modal
    await expect(page.locator('h1')).toBeVisible()
  })

  test('API 500 on events does not show a blank white page', async ({ page }) => {
    await page.route('/api/events', async route => {
      await route.fulfill({ status: 500, body: 'error' })
    })
    await page.goto('/events')
    await expect(page.locator('nav').first()).toBeVisible()
  })

  test('direct navigation to a non-existent event ID returns 404', async ({ page }) => {
    const res = await page.goto('/events/nonexistent-id-00000000')
    // Server correctly returns 404 for unknown event IDs
    expect(res?.status()).toBe(404)
    // Page has some content — not a blank crash
    const body = await page.locator('body').textContent()
    expect(body!.length).toBeGreaterThan(5)
  })

  test('subscribe form ignores empty email — success state does not appear', async ({ page }) => {
    await page.goto('/events')
    // Wait for EventsClient to hydrate before checking subscribe section
    await expect(page.locator('.events-controls')).toBeVisible({ timeout: 10000 })
    const subscribeSection = page.locator('.events-subscribe')
    await expect(subscribeSection).toBeVisible({ timeout: 10000 })
    // JS guard: handleSubscribe returns early if email is empty
    const submitBtn = subscribeSection.getByRole('button').first()
    await submitBtn.click()
    await page.waitForTimeout(500)
    // Success state must not appear
    await expect(page.locator('.subscribe-success')).toBeHidden()
    await expect(page).toHaveURL(/\/events/)
  })
})

// ── Navigation — 404 and direct deep links ────────────────────────────────────
test.describe('Navigation — 404 and unknown routes', () => {
  test('completely unknown path renders something (not a blank crash)', async ({ page }) => {
    await page.goto('/does-not-exist-at-all')
    // Next.js 404 page or custom — either way should have some content
    const body = await page.locator('body').textContent()
    expect(body!.length).toBeGreaterThan(20)
  })

  test('404 page returns HTTP 404 status', async ({ page }) => {
    const res = await page.goto('/not-a-real-route')
    expect(res?.status()).toBe(404)
  })

  test('going back from /events preserves nav state on previous page', async ({ page }) => {
    await page.goto('/')
    await page.goto('/events')
    await page.goBack()
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page).toHaveURL('/')
  })
})

// ── Security headers ──────────────────────────────────────────────────────────
test.describe('Security headers', () => {
  test('home page sets X-Content-Type-Options', async ({ request }) => {
    const res = await request.get('/')
    const header = res.headers()['x-content-type-options']
    expect(header).toBe('nosniff')
  })

  test('API route does not expose stack traces in error body', async ({ request }) => {
    const res = await request.post('/api/contact', { data: {} })
    const body = await res.text()
    expect(body).not.toMatch(/at Object\.|\.js:\d+:\d+|node_modules/)
  })

  test('housing API does not expose stack traces in error body', async ({ request }) => {
    const res = await request.post('/api/housing', { data: {} })
    const body = await res.text()
    expect(body).not.toMatch(/at Object\.|\.js:\d+:\d+|node_modules/)
  })
})
