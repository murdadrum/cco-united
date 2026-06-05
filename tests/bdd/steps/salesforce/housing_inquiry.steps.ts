import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('I am on the housing inquiry page', async ({ page }) => {
  await page.goto('/housing');
});

Given('the housing API will return an error', async ({ page }) => {
  await page.route('/api/housing', async route => {
    await route.fulfill({ status: 500, body: JSON.stringify({ error: 'Service unavailable' }) });
  });
});

When('I navigate to {string}', async ({ page }, path: string) => {
  await page.goto(path);
});

When('I click the submit button without filling required fields', async ({ page }) => {
  await expect(page.locator('#hi-name')).toBeVisible({ timeout: 10000 });
  await page.locator('button[type="submit"]').last().click();
});

When('I submit a valid housing inquiry', async ({ page }) => {
  await expect(page.locator('#hi-name')).toBeVisible({ timeout: 10000 });
  await page.fill('#hi-name', 'Test User');
  await page.fill('#hi-email', 'test@example.com');
  await page.selectOption('#hi-program', { index: 1 });
  await page.locator('button[type="submit"]').last().click();
});

When('I select a district from the liaison dropdown', async ({ page }) => {
  await page.locator('.housing-district-select').selectOption({ index: 1 });
});

When('I click the contact coordinator button', async ({ page }) => {
  await page.getByRole('button', { name: /contact this coordinator/i }).click();
});

Then('I should see a form field labeled {string}', async ({ page }, label: string) => {
  const labelMap: Record<string, string> = {
    'Full Name':     '#hi-name',
    'Email Address': '#hi-email',
    'Phone Number':  '#hi-phone',
    'Message':       '#hi-message',
  };
  const selector = labelMap[label] ?? `[placeholder*="${label}"]`;
  await expect(page.locator(selector).first()).toBeVisible();
});

Then('I should see a button labeled {string}', async ({ page }, label: string) => {
  await expect(
    page.getByRole('button', { name: new RegExp(label, 'i') }).first()
  ).toBeVisible();
});

Then('the success confirmation should not be visible', async ({ page }) => {
  await expect(page.locator('.form-success')).toBeHidden({ timeout: 5000 });
});

Then('I should see an error message', async ({ page }) => {
  await expect(
    page.locator('p').filter({ hasText: /wrong|failed|error|unavailable/i }).first()
  ).toBeVisible({ timeout: 5000 });
});

Then('I should see a liaison contact card', async ({ page }) => {
  await expect(page.locator('.housing-liaison-card')).toBeVisible({ timeout: 3000 });
});

Then('the inquiry message field should be pre-filled', async ({ page }) => {
  const val = await page.locator('#hi-message').inputValue();
  expect(val.length).toBeGreaterThan(5);
});
