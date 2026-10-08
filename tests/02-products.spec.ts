import { test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { showTestCasePopup, showTestResultPopup } from './test-case-popup';

test.describe('Products', () => {
  test.afterEach(async ({ page }, testInfo) => {
    await showTestResultPopup(page, testInfo.status === 'passed');
  });

  test.beforeEach(async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await showTestCasePopup(page, testInfo.title);
    await loginPage.login('standard_user', 'secret_sauce');
  });

  test('TC04 - Verify products are displayed after login', async ({ page }) => {
    await new InventoryPage(page).expectProductsDisplayed();
  });

  test('TC05 - Verify products can be sorted by price', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortProductsByPriceLowToHigh();
    await inventoryPage.expectProductsSortedByPriceLowToHigh();
  });
});