import { test, expect } from '@playwright/test';

test.describe('Dashboard & Circuit CRUD', () => {
    const circuitName = `Test Circuit ${Date.now()}`;

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.click('text="Don\'t have an account? Sign up"');
        await page.fill('input[type="email"]', `user_${Date.now()}@test.com`);
        await page.fill('input[type="password"]', '123456');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should create, rename, and delete a circuit', async ({ page }) => {
        // 1. СТВОРЕННЯ
        await page.click('text="+ New Circuit"');
        await page.fill('input[placeholder="Circuit name..."]', circuitName);
        await page.click('button:has-text("Save")');

        await expect(page).toHaveURL(/\/editor\/.+/);

        await page.click('text="← Back"');
        await expect(page.locator(`h3:has-text("${circuitName}")`)).toBeVisible();

        page.on('dialog', (dialog) => dialog.accept());

        const circuitCard = page.locator(`h3:has-text("${circuitName}")`).locator('..').locator('..');
        await circuitCard.hover();
        await circuitCard.locator('button[title="Delete"]').click();

        await expect(page.locator(`h3:has-text("${circuitName}")`)).not.toBeVisible();
    });
});
