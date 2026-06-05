import { test, expect } from '@playwright/test'

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Mocks /api/chat with a minimal valid SSE stream containing `text`. */
async function mockAlis(page: any, text: string) {
  await page.route('/api/chat', async (route: any) => {
    const chunk = JSON.stringify({
      type: 'content_block_delta',
      delta: { text },
    })
    // Use string body — Playwright closes the stream correctly with string responses
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body: `data: ${chunk}\n\ndata: [DONE]\n\n`,
    })
  })
}

/** Mocks /api/agentforce with a minimal SSE stream containing `text`. */
async function mockAgentforce(page: any, text: string, sessionId = 'test-session-af') {
  await page.route('/api/agentforce', async (route: any) => {
    const chunk = JSON.stringify({ text })
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'X-Session-Id': sessionId,
      },
      body: `data: ${chunk}\n\ndata: [DONE]\n\n`,
    })
  })
}

/** Opens the widget and waits for the message area to be visible. */
async function openWidget(page: any) {
  await page.goto('/')
  // Wait for the initial assistant message to appear — confirms React has hydrated
  // and the AliWidget useEffect has run (sets initial history)
  await expect(page.locator('#ali-input')).toBeAttached({ timeout: 15000 })
  // Playwright's locator.click() dispatches synthetic pointer events via CDP,
  // which correctly triggers React 18's delegated event system
  await page.locator('#ali-toggle').click()
  await expect(page.locator('#ali-row')).toBeVisible({ timeout: 5000 })
}

/** Sends a message via the input and returns after pressing Enter. */
async function sendMessage(page: any, message: string) {
  const input = page.locator('#ali-input')
  await input.fill(message)
  await page.keyboard.press('Enter')
}

// ── Suite 1: Empty input guard ─────────────────────────────────────────────────

test.describe('AI QA — empty input guard', () => {
  test('Alis: pressing Enter on empty input fires no API request', async ({ page }) => {
    let apiCalled = false
    await page.route('/api/chat', () => { apiCalled = true })

    await openWidget(page)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    expect(apiCalled).toBe(false)
  })

  test('Alis: whitespace-only input fires no API request', async ({ page }) => {
    let apiCalled = false
    await page.route('/api/chat', () => { apiCalled = true })

    await openWidget(page)
    await page.locator('#ali-input').fill('   ')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    expect(apiCalled).toBe(false)
  })

  test('Agentforce: empty input fires no API request', async ({ page }) => {
    let apiCalled = false
    await page.route('/api/agentforce', () => { apiCalled = true })

    await openWidget(page)
    await page.getByRole('button', { name: 'AF' }).click()
    await expect(page.locator('.ali-hname')).toContainText('CCO Housing', { timeout: 3000 })
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    expect(apiCalled).toBe(false)
  })
})

// ── Suite 2: XSS input safety ──────────────────────────────────────────────────

test.describe('AI QA — XSS input safety', () => {
  test('Alis: XSS payload in user message is not executed', async ({ page }) => {
    await mockAlis(page, 'I cannot run scripts.')

    let xssExecuted = false
    await page.exposeFunction('__xssProbe', () => { xssExecuted = true })

    await openWidget(page)
    await sendMessage(page, '<script>window.__xssProbe()</script>')

    // Wait for any response to land
    await page.waitForTimeout(1000)
    expect(xssExecuted).toBe(false)
  })

  test('Alis: XSS payload rendered as plain text, not as DOM element', async ({ page }) => {
    await mockAlis(page, 'Safe response.')

    await openWidget(page)
    await sendMessage(page, '<img src=x onerror="document.title=\'XSS\'">')

    await page.waitForTimeout(800)
    // Title must not have been overwritten
    const title = await page.title()
    expect(title).not.toBe('XSS')
  })

  test('Agentforce: XSS payload in user message is not executed', async ({ page }) => {
    await mockAgentforce(page, 'Safe response from AF.')

    let xssExecuted = false
    await page.exposeFunction('__xssProbeAf', () => { xssExecuted = true })

    await openWidget(page)
    await page.getByRole('button', { name: 'AF' }).click()
    await expect(page.locator('.ali-hname')).toContainText('CCO Housing', { timeout: 3000 })
    await sendMessage(page, '<script>window.__xssProbeAf()</script>')

    await page.waitForTimeout(1000)
    expect(xssExecuted).toBe(false)
  })
})

// ── Suite 3: API error handling ────────────────────────────────────────────────

test.describe('AI QA — API error handling', () => {
  test('Alis: 500 error shows error message in chat', async ({ page }) => {
    await page.route('/api/chat', async route => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' })
    })

    await openWidget(page)
    await sendMessage(page, 'Hello')

    await expect(page.locator('#ali-msgs'))
      .toContainText(/something went wrong/i, { timeout: 8000 })
  })

  test('Alis: network failure shows error message in chat', async ({ page }) => {
    await page.route('/api/chat', route => route.abort('failed'))

    await openWidget(page)
    await sendMessage(page, 'Hello')

    await expect(page.locator('#ali-msgs'))
      .toContainText(/something went wrong/i, { timeout: 8000 })
  })

  test('Agentforce: 503 error shows unavailable message', async ({ page }) => {
    await page.route('/api/agentforce', async route => {
      await route.fulfill({ status: 503, body: 'Service Unavailable' })
    })

    await openWidget(page)
    await page.getByRole('button', { name: 'AF' }).click()
    await expect(page.locator('.ali-hname')).toContainText('CCO Housing', { timeout: 3000 })
    await sendMessage(page, 'Hello')

    await expect(page.locator('#ali-msgs'))
      .toContainText(/unavailable|went wrong/i, { timeout: 8000 })
  })

  test('Agentforce: 401 auth error shows error message', async ({ page }) => {
    await page.route('/api/agentforce', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Auth error' }),
      })
    })

    await openWidget(page)
    await page.getByRole('button', { name: 'AF' }).click()
    await expect(page.locator('.ali-hname')).toContainText('CCO Housing', { timeout: 3000 })
    await sendMessage(page, 'Hello')

    await expect(page.locator('#ali-msgs'))
      .toContainText(/unavailable|went wrong|auth/i, { timeout: 8000 })
  })
})

// ── Suite 4: Latency SLA ───────────────────────────────────────────────────────

test.describe('AI QA — latency SLA', () => {
  test('Alis: first chunk arrives within 5 seconds', async ({ page }) => {
    // Delay mock by 800ms to simulate real network, but within SLA
    await page.route('/api/chat', async route => {
      await new Promise(r => setTimeout(r, 800))
      const chunk = JSON.stringify({ type: 'content_block_delta', delta: { text: 'Osiyo!' } })
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: `data: ${chunk}\n\ndata: [DONE]\n\n`,
      })
    })

    await openWidget(page)
    const start = Date.now()
    await sendMessage(page, 'Hello')

    // Wait for any non-ellipsis text to appear in an assistant bubble
    await expect(page.locator('#ali-msgs'))
      .toContainText('Osiyo!', { timeout: 5000 })

    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(5000)
  })

  test('Agentforce: first chunk arrives within 5 seconds', async ({ page }) => {
    await page.route('/api/agentforce', async route => {
      await new Promise(r => setTimeout(r, 800))
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream', 'X-Session-Id': 'sla-test' },
        body: `data: ${JSON.stringify({ text: 'AF ready.' })}\n\ndata: [DONE]\n\n`,
      })
    })

    await openWidget(page)
    await page.getByRole('button', { name: 'AF' }).click()
    // Wait for mode switch to settle — header should update
    await expect(page.locator('.ali-hname')).toContainText('CCO Housing', { timeout: 3000 })
    const start = Date.now()
    await sendMessage(page, 'Hello')

    await expect(page.locator('#ali-msgs'))
      .toContainText('AF ready.', { timeout: 5000 })

    expect(Date.now() - start).toBeLessThan(5000)
  })
})

// ── Suite 5: Response keyword validation ───────────────────────────────────────

test.describe('AI QA — response keyword validation', () => {
  test('Alis: greeting question returns Cherokee/CCO-relevant content', async ({ page }) => {
    await mockAlis(page, 'Osiyo! I am Alisdelisgi, the CCO United assistant. Wado for asking.')

    await openWidget(page)
    await sendMessage(page, 'What is CCO United?')

    await expect(page.locator('#ali-msgs'))
      .toContainText(/CCO|Cherokee|Osiyo|Wado/i, { timeout: 8000 })
  })

  test('Alis: events question returns events-related content', async ({ page }) => {
    await mockAlis(page, 'You can find upcoming Cherokee Nation events at /events on this site.')

    await openWidget(page)
    await sendMessage(page, 'Tell me about upcoming events')

    await expect(page.locator('#ali-msgs'))
      .toContainText(/event/i, { timeout: 8000 })
  })

  test('Agentforce: response is rendered in the AF lane', async ({ page }) => {
    await mockAgentforce(page, 'I can help with CCO United housing and events.')

    await openWidget(page)
    await page.getByRole('button', { name: 'AF' }).click()
    await expect(page.locator('.ali-hname')).toContainText('CCO Housing', { timeout: 3000 })
    await sendMessage(page, 'What can you help with?')

    await expect(page.locator('#ali-msgs'))
      .toContainText(/housing|events|help/i, { timeout: 8000 })
  })

  test('Both mode: both lanes receive and display a response', async ({ page }) => {
    await mockAlis(page, 'Alis here — Osiyo!')
    await mockAgentforce(page, 'Agentforce here — ready to help.')

    await openWidget(page)
    await page.getByRole('button', { name: '⇌' }).click()
    // Wait for both-mode layout to render before sending
    await expect(page.locator('.ali-hsub')).toContainText('side by side', { timeout: 3000 })
    await sendMessage(page, 'Hello')

    // Both lane labels must be visible in split view
    await expect(page.locator('#ali-msgs')).toContainText('Alisdelisgi', { timeout: 3000 })
    await expect(page.locator('#ali-msgs')).toContainText('Agentforce', { timeout: 3000 })

    // Both responses must land
    await expect(page.locator('#ali-msgs')).toContainText('Alis here', { timeout: 8000 })
    await expect(page.locator('#ali-msgs')).toContainText('Agentforce here', { timeout: 8000 })
  })
})

// ── Suite 6: Mode toggle UI integrity ─────────────────────────────────────────

test.describe('AI QA — mode toggle UI integrity', () => {
  test('default mode is Alis — header shows Alisdelisgi name', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.ali-hname')).toContainText('Alisdelisgi')
  })

  test('switching to AF mode updates header to Agentforce label', async ({ page }) => {
    await openWidget(page)
    await page.getByRole('button', { name: 'AF' }).click()
    await expect(page.locator('.ali-hname')).toContainText('CCO Housing & Events Agent', { timeout: 3000 })
  })

  test('switching to Both mode updates subtitle', async ({ page }) => {
    await openWidget(page)
    await page.getByRole('button', { name: '⇌' }).click()
    await expect(page.locator('.ali-hsub')).toContainText('side by side', { timeout: 3000 })
  })

  test('send button is disabled while streaming', async ({ page }) => {
    // Use a never-resolving route to freeze streaming state
    await page.route('/api/chat', () => { /* hang */ })

    await openWidget(page)
    await sendMessage(page, 'Hello')

    await expect(page.locator('#ali-send')).toBeDisabled({ timeout: 2000 })
  })
})
