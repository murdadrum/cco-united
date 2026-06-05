import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('I am on the events page', async ({ page }) => {
  await page.goto('/events');
});

Given('the events API returns an empty list', async ({ page }) => {
  await page.route('/api/events', async route => {
    await route.fulfill({ status: 200, body: JSON.stringify([]) });
  });
});

Then('I should see the events grid container', async ({ page }) => {
  // Wait for EventsClient to hydrate (controls always mount first)
  await expect(page.locator('.events-controls')).toBeVisible();
  await expect(page.locator('.events-grid, .events-list, .events-empty').first()).toBeVisible({ timeout: 10000 });
});

Then('I should see the events subscribe section', async ({ page }) => {
  await expect(page.locator('.events-subscribe')).toBeVisible();
});

Then('I should see the site navigation', async ({ page }) => {
  await expect(page.locator('nav').first()).toBeVisible();
});
