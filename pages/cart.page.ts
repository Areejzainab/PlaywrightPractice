import { expect, type Page } from '@playwright/test';

export class CartPage {
  constructor(private readonly page: Page) {}

  async expectProductDisplayed(productName: string) {
    await expect(this.page.getByText(productName, { exact: true })).toBeVisible();
  }

  async removeProduct(productName: string) {
    await this.page
      .locator('.cart_item')
      .filter({ hasText: productName })
      .getByRole('button', { name: 'Remove' })
      .click();
  }

  async checkout() {
    await this.page.getByRole('button', { name: 'Checkout' }).click();
  }

  async expectProductRemoved(productName: string) {
    await expect(this.page.getByText(productName, { exact: true })).toHaveCount(0);
    await expect(this.page.getByRole('button', { name: 'Cart, empty' })).toBeVisible();
  }
}