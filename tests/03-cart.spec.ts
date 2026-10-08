import { test } from '@playwright/test';
import { CartPage } from '../pages/cart.page';
import { InventoryPage } from '../pages/inventory.page';
import { LoginPage } from '../pages/login.page';
import { showTestCasePopup, showTestResultPopup } from './test-case-popup';

const selectedProduct = 'Sauce Labs Backpack';

test.describe('Cart', () => {
  test.afterEach(async ({ page }, testInfo) => {
    await showTestResultPopup(page, testInfo.status === 'passed');
  });

  test.beforeEach(async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await showTestCasePopup(page, testInfo.title);
    await loginPage.login('standard_user', 'secret_sauce');
  });

  test('TC06 - Verify user can add a product to the cart', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addFirstProductToCart();
    await inventoryPage.expectCartItemCount(1);
  });

  test('TC07 - Verify cart displays the selected product', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addFirstProductToCart();
    await inventoryPage.openCart();

    await new CartPage(page).expectProductDisplayed(selectedProduct);
  });

  test('TC08 - Verify user can remove a product from the cart', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addFirstProductToCart();
    await inventoryPage.openCart();

    const cartPage = new CartPage(page);
    await cartPage.removeProduct();
    await cartPage.expectProductRemoved(selectedProduct);
  });
});