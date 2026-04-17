import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'password123';

    test('should register a new user and logout', async ({ page }) => {
        await page.goto('/');

        await page.click('text="Don\'t have an account? Sign up"');

        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);

        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.locator('text=My Circuits')).toBeVisible();

        await page.click('text="Logout"');
        await expect(page).toHaveURL('/');
    });

    test('should login an existing user', async ({ page }) => {
        const loginEmail = `login_${Date.now()}@example.com`;

        await page.goto('/');
        await page.click('text="Don\'t have an account? Sign up"');
        await page.fill('input[type="email"]', loginEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');
        await page.click('text="Logout"');

        await page.fill('input[type="email"]', loginEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/\/dashboard/);
    });
});
