import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, Then } = createBdd();

Given('I am on the CCO United home page', async ({ page }) => {
  await page.goto('/');
});

Then('I should see the heading {string}', async ({ page }, heading: string) => {
  await expect(
    page.getByRole('heading', { name: heading }).first()
  ).toBeVisible();
});

Then('I should see the navigation bar', async ({ page }) => {
  await expect(page.locator('nav').first()).toBeVisible();
});

Then('I should see a link for {string}', async ({ page }, linkText: string) => {
  await expect(
    page.getByRole('link', { name: new RegExp(linkText, 'i') }).first()
  ).toBeVisible();
});
