import { expect, type Page } from '@playwright/test';

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async fillFirstName(firstName: string) {
    await this.page.getByPlaceholder('First Name').fill(firstName);
  }

  async fillLastName(lastName: string) {
    await this.page.getByPlaceholder('Last Name').fill(lastName);
  }

  async fillPostalCode(postalCode: string) {
    await this.page.getByPlaceholder('Zip/Postal Code').fill(postalCode);
  }

  async fillInformation(firstName: string, lastName: string, postalCode: string) {
    await this.fillFirstName(firstName);
    await this.fillLastName(lastName);
    await this.fillPostalCode(postalCode);
  }

  async continueToOverview() {
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }

  async expectValidationMessage(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async finishOrder() {
    await this.page.getByRole('button', { name: 'Finish' }).click();
  }

  async expectOrderComplete() {
    await expect(this.page.getByText('Thank you for your order!', { exact: true })).toBeVisible();
  }
}