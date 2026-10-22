import { test, type Page } from '@playwright/test';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { InventoryPage } from '../pages/inventory.page';
import { LoginPage } from '../pages/login.page';
import { showTestCasePopup, showTestResultPopup } from './test-case-popup';
import * as ExcelJS from 'exceljs';
import path from 'node:path';

const selectedProduct = 'Sauce Labs Backpack';

type LoginCase = {
  username: string;
  password: string;
  expected: 'success' | 'failure';
  message: string;
};

async function readLoginCases(): Promise<LoginCase[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(
    path.resolve(__dirname, '../test-data/LoginCases.xlsx'),
  );

  const sheet = workbook.getWorksheet('LoginCases');
  if (!sheet) {
    throw new Error('Workbook is missing the LoginCases worksheet');
  }

  const headers = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, column) => {
    headers.set(cell.text.trim().toLowerCase(), column);
  });

  for (const requiredHeader of ['username', 'password', 'expected', 'message']) {
    if (!headers.has(requiredHeader)) {
      throw new Error(`LoginCases worksheet is missing the "${requiredHeader}" column`);
    }
  }

  const cases: LoginCase[] = [];
  const getColumn = (header: string) => {
    const column = headers.get(header);
    if (column === undefined) {
      throw new Error(`LoginCases worksheet is missing the "${header}" column`);
    }
    return column;
  };
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const value = (header: string) => row.getCell(getColumn(header)).text.trim();
    const username = value('username');
    const password = value('password');
    const expected = value('expected').toLowerCase();
    const message = value('message');

    if (!username && !password && !expected && !message) {
      continue;
    }
    if (!username || !password) {
      throw new Error(`LoginCases row ${rowNumber} must include username and password`);
    }
    if (expected !== 'success' && expected !== 'failure') {
      throw new Error(
        `LoginCases row ${rowNumber} expected value must be "success" or "failure"`,
      );
    }
    if (expected === 'failure' && !message) {
      throw new Error(`LoginCases row ${rowNumber} must include the expected failure message`);
    }

    cases.push({ username, password, expected, message });
  }

  if (cases.length === 0) {
    throw new Error('LoginCases worksheet contains no test data');
  }

  return cases;
}

async function runCase(
  page: Page,
  title: string,
  action: () => Promise<void>,
) {
  await test.step(title, async () => {
    await showTestCasePopup(page, title);
    try {
      await action();
      await showTestResultPopup(page, true);
    } catch (error) {
      await showTestResultPopup(page, false);
      throw error;
    }
  });
}

test('TC01-TC10 - Run the user flow in one session', async ({ page }) => {
  test.setTimeout(240_000);

  const loginCases = await readLoginCases();
  const successfulLogins = loginCases.filter(({ expected }) => expected === 'success');
  const failedLogins = loginCases.filter(({ expected }) => expected === 'failure');
  if (successfulLogins.length === 0 || failedLogins.length === 0) {
    throw new Error('LoginCases must include at least one success and one failure row');
  }

  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);

  await page.goto('https://www.saucedemo.com/');
  for (const [index, loginCase] of successfulLogins.entries()) {
    if (index > 0) {
      await inventoryPage.logout();
      await loginPage.goto();
    }
    await runCase(
      page,
      `TC01 - Verify valid login for ${loginCase.username}`,
      async () => {
        await loginPage.login(loginCase.username, loginCase.password);
        await loginPage.expectSessionCookie(loginCase.username);
        await inventoryPage.expectProductsDisplayed();
      },
    );
  }

  await runCase(page, 'TC02 - Verify products are displayed after login', async () => {
    await page.goto('https://www.saucedemo.com/inventory.html');
    await inventoryPage.expectProductsDisplayed();
  });

  await runCase(page, 'TC03 - Verify products can be sorted by price', async () => {
    await page.goto('https://www.saucedemo.com/inventory.html');
    await inventoryPage.sortProductsByPriceLowToHigh();
    await inventoryPage.expectProductsSortedByPriceLowToHigh();
  });

  await runCase(page, 'TC04 - Verify user can add a product to the cart', async () => {
    await page.goto('https://www.saucedemo.com/inventory.html');
    await page
      .getByRole('combobox', { name: 'Sort products' })
      .selectOption({ label: 'Name (A to Z)' });
    await inventoryPage.addFirstProductToCart();
    await inventoryPage.expectCartItemCount(1);
  });

  await runCase(page, 'TC05 - Verify cart displays the selected product', async () => {
    await inventoryPage.openCart();
    await new CartPage(page).expectProductDisplayed(selectedProduct);
  });

  await runCase(page, 'TC06 - Verify user can remove a product from the cart', async () => {
    const cartPage = new CartPage(page);
    await cartPage.removeProduct(selectedProduct);
    await cartPage.expectProductRemoved(selectedProduct);
  });

  await runCase(page, 'TC07 - Verify user can complete checkout', async () => {
    await page.goto('https://www.saucedemo.com/inventory.html');
    await page
      .getByRole('combobox', { name: 'Sort products' })
      .selectOption({ label: 'Name (A to Z)' });
    await inventoryPage.addProductToCart(selectedProduct);
    await inventoryPage.openCart();
    await new CartPage(page).checkout();

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.fillInformation('Emily', 'Smith', '12345');
    await checkoutPage.continueToOverview();
    await checkoutPage.finishOrder();
    await checkoutPage.expectOrderComplete();
  });

  await runCase(page, 'TC08 - Verify required checkout fields are validated', async () => {
    await page.goto('https://www.saucedemo.com/inventory.html');
    await page
      .getByRole('combobox', { name: 'Sort products' })
      .selectOption({ label: 'Name (A to Z)' });
    await inventoryPage.addProductToCart(selectedProduct);
    await inventoryPage.openCart();
    await new CartPage(page).checkout();

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

  await runCase(page, 'TC09 - Verify user can logout successfully', async () => {
    await page.goto('https://www.saucedemo.com/inventory.html');
    await inventoryPage.logout();
    await loginPage.expectLoginFormVisible();
    await loginPage.expectSessionCookieCleared();
    await page.goto('https://www.saucedemo.com/inventory.html');
    await loginPage.expectLoginFormVisible();
    await loginPage.expectErrorMessage(
      "Epic sadface: You can only access '/inventory.html' when you are logged in.",
    );
  });

  for (const loginCase of failedLogins) {
    await runCase(
      page,
      `TC10 - Verify invalid login for ${loginCase.username}`,
      async () => {
        await loginPage.goto();
        await loginPage.login(loginCase.username, loginCase.password);
        await loginPage.expectErrorMessage(loginCase.message);
      },
    );
  }
});

/*
test.skip('TC11 - Verify login session survives a page reload', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);

  await page.goto('https://www.saucedemo.com/');
  await loginPage.login('standard_user', 'secret_sauce');
  await loginPage.expectSessionCookie('standard_user');
  await page.reload();
  await inventoryPage.expectProductsDisplayed();
  await loginPage.expectSessionCookie('standard_user');
});
*/
