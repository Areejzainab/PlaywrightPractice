import { test } from '@playwright/test';
import { InventoryPage } from '../pages/inventory.page';
import { LoginPage } from '../pages/login.page';
import { showTestCasePopup, showTestResultPopup } from './test-case-popup';

test.describe('Login', () => {
  test.afterEach(async ({ page }, testInfo) => {
    await showTestResultPopup(page, testInfo.status === 'passed');
  });

  test.beforeEach(async ({ page }, testInfo) => {
    await new LoginPage(page).goto();
    await showTestCasePopup(page, testInfo.title);
  });

  test('TC01 - Verify user can login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('standard_user', 'secret_sauce');

    await new InventoryPage(page).expectProductsDisplayed();
  });

  test('TC02 - Verify login fails with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('invalid_user', 'wrong_password');

    await loginPage.expectErrorMessage(
      'Username and password do not match any user in this service',
    );
  });

  test('TC03 - Verify user can logout successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('standard_user', 'secret_sauce');
    await new InventoryPage(page).logout();

    await loginPage.expectLoginFormVisible();
  });
});