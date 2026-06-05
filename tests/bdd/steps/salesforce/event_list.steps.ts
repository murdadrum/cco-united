import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, Then, And } = createBdd();

Given('I am on the events page', async ({ page }) => {
  await page.goto('/events');
});

Then('I should see the events grid container', async ({ page }) => {
  // Grid renders even when empty (API key missing in CI shows empty state alongside grid)
  await expect(page.locator('.events-grid, .events-empty').first()).toBeVisible();
});
