import { test, expect } from '@playwright/test';

test.describe('Logic Editor', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.click('text="Don\'t have an account? Sign up"');
        await page.fill('input[type="email"]', `editor_${Date.now()}@test.com`);
        await page.fill('input[type="password"]', '123456');
        await page.click('button[type="submit"]');

        await page.click('text="+ New Circuit"');
        await page.fill('input[placeholder="Circuit name..."]', 'Logic Test');
        await page.click('button:has-text("Save")');
        await expect(page).toHaveURL(/\/editor\/.+/);
    });

    test('should add a switch, toggle it, and save the circuit', async ({ page }) => {
        await page.click('button:has-text("Switch (Input)")');

        const initialNode = page.locator('.react-flow__node', { hasText: 'OFF' }).first();
        await expect(initialNode).toBeVisible();

        const nodeId = await initialNode.getAttribute('data-id');

        const switchNode = page.locator(`.react-flow__node[data-id="${nodeId}"]`);

        await switchNode.locator('text="OFF"').click();

        await expect(switchNode).toContainText('ON');

        await page.click('button:has-text("Save Circuit")');

        await expect(page.locator('text="Circuit saved successfully!"')).toBeVisible();
    });

    test('should clear the board using the clear button', async ({ page }) => {
        await page.click('button:has-text("AND Gate")');
        await page.click('button:has-text("OR Gate")');

        await expect(page.locator('.react-flow__node')).toHaveCount(2);

        page.on('dialog', (dialog) => dialog.accept());

        await page.click('button:has-text("Clear Board")');

        await expect(page.locator('.react-flow__node')).toHaveCount(0);
    });
});
