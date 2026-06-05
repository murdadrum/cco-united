import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('I am on the housing inquiry page', async ({ page }) => {
  await page.goto('/housing');
});

When('I navigate to {string}', async ({ page }, path: string) => {
  await page.goto(path);
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
