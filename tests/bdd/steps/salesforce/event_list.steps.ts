import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, Then } = createBdd();

Given('I am on the events page', async ({ page }) => {
  await page.goto('/events');
});

Then('I should see the events grid container', async ({ page }) => {
  // Wait for EventsClient to hydrate (controls always mount first)
  await expect(page.locator('.events-controls')).toBeVisible();
  await expect(page.locator('.events-grid, .events-list, .events-empty').first()).toBeVisible({ timeout: 10000 });
});
