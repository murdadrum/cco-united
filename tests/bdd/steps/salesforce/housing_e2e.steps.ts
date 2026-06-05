import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

// Shared store for API response data across steps within a scenario
let _lastApiResponse: { ok?: boolean; caseId?: string; id?: string } = {};

Given('I am on the submit event page', async ({ page }) => {
  await page.goto('/events/submit');
  await expect(page.locator('#sf-title')).toBeVisible({ timeout: 10000 });
});

When('I submit a complete housing inquiry for {string}', async ({ page }, program: string) => {
  // Intercept the fetch to capture the API response body
  page.on('response', async res => {
    if (res.url().includes('/api/housing') && res.request().method() === 'POST') {
      try { _lastApiResponse = await res.json() } catch { /* ignore */ }
    }
  });

  await expect(page.locator('#hi-name')).toBeVisible({ timeout: 10000 });
  await page.fill('#hi-name', 'Angela Bigfeather');
  await page.fill('#hi-email', 'e2e-test@ccounited.test');
  await page.fill('#hi-phone', '918-555-0100');
  await page.selectOption('#hi-program', { label: program });
  await page.fill('#hi-message', `E2E test submission for ${program} program`);
  await page.locator('button[type="submit"]').last().click();
});

When('I submit a complete event for {string}', async ({ page }, title: string) => {
  page.on('response', async res => {
    if (res.url().includes('/api/events/submit') && res.request().method() === 'POST') {
      try { _lastApiResponse = await res.json() } catch { /* ignore */ }
    }
  });

  await page.fill('#sf-title', title);
  await page.selectOption('#sf-cco', { index: 1 });
  await page.fill('#sf-date', '2026-08-15T18:00');
  await page.fill('#sf-location', 'Cherokee Nation Community Center, Tahlequah OK');
  await page.selectOption('#sf-type', { index: 1 });
  await page.fill('#sf-name', 'Test Coordinator');
  await page.fill('#sf-email', 'e2e-test@ccounited.test');
  await page.locator('button[type="submit"]').last().click();
});

Then('the success confirmation should be visible', async ({ page }) => {
  await expect(page.locator('.form-success')).toBeVisible({ timeout: 15000 });
});

Then('I should see a valid reference number', async ({ page }) => {
  // Reference number is caseId.slice(-6).toUpperCase() — 6 alphanumeric chars
  await expect(page.locator('.form-success')).toContainText(/[A-Z0-9]{6}/, { timeout: 15000 });
});

Then('the case ID returned should be a valid Salesforce ID', async () => {
  // SF IDs are 15 or 18 alphanumeric chars
  expect(_lastApiResponse.caseId).toMatch(/^[a-zA-Z0-9]{15,18}$/);
});

Then('the API response should contain a case ID', async () => {
  expect(_lastApiResponse.caseId).toBeTruthy();
  expect(typeof _lastApiResponse.caseId).toBe('string');
});

Then('the event submission success message should be visible', async ({ page }) => {
  await expect(page.locator('.form-success')).toBeVisible({ timeout: 15000 });
});

Then('the event API response should contain a record ID', async () => {
  expect(_lastApiResponse.id).toBeTruthy();
  expect(typeof _lastApiResponse.id).toBe('string');
});
