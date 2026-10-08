import { test } from '@playwright/test';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { InventoryPage } from '../pages/inventory.page';
import { LoginPage } from '../pages/login.page';
import { showTestCasePopup, showTestResultPopup } from './test-case-popup';

test.describe('Checkout', () => {
  test.afterEach(async ({ page }, testInfo) => {
    await showTestResultPopup(page, testInfo.status === 'passed');
  });

  test.beforeEach(async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await showTestCasePopup(page, testInfo.title);
    await loginPage.login('standard_user', 'secret_sauce');

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addFirstProductToCart();
    await inventoryPage.openCart();
    await new CartPage(page).checkout();
  });

  test('TC09 - Verify user can complete checkout', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.fillInformation('Emily', 'Smith', '12345');
    await checkoutPage.continueToOverview();
    await checkoutPage.finishOrder();

    await checkoutPage.expectOrderComplete();
  });

  test('TC10 - Verify required checkout fields are validated', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.continueToOverview();
    await checkoutPage.expectValidationMessage('Error: First Name is required');

    await checkoutPage.fillFirstName('Emily');
    await checkoutPage.continueToOverview();
    await checkoutPage.expectValidationMessage('Error: Last Name is required');

    await checkoutPage.fillLastName('Smith');
    await checkoutPage.continueToOverview();
    await checkoutPage.expectValidationMessage('Error: Postal Code is required');
  });
});