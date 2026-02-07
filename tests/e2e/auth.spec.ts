import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/AteliêFácil/);
});

test('login link works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /entrar/i })).toBeVisible();
});
