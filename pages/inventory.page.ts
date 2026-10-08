import { expect, type Page } from '@playwright/test';

export class InventoryPage {
  constructor(private readonly page: Page) {}

  async expectProductsDisplayed() {
    await expect(this.page.getByText('Products', { exact: true })).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'Add to cart' })).toHaveCount(6);
  }

  async sortProductsByPriceLowToHigh() {
    await this.page
      .getByRole('combobox', { name: 'Sort products' })
      .selectOption({ label: 'Price (low to high)' });
  }

  async expectProductsSortedByPriceLowToHigh() {
    await expect(this.page.getByText(/^\$\d+\.\d{2}$/)).toHaveText([
      '$7.99',
      '$9.99',
      '$15.99',
      '$15.99',
      '$29.99',
      '$49.99',
    ]);
  }

  async addFirstProductToCart() {
    await this.page.getByRole('button', { name: 'Add to cart' }).first().click();
  }

  async openCart() {
    await this.page.getByRole('button', { name: /Cart/ }).click();
  }

  async expectCartItemCount(count: number) {
    await expect(this.page.getByRole('button', { name: new RegExp(`Cart.*${count}`) })).toBeVisible();
  }

  async logout() {
    await this.page.getByRole('button', { name: 'Open Menu' }).click();
    await this.page.getByRole('button', { name: 'Logout' }).click();
  }
}