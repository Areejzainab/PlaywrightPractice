import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('https://www.saucedemo.com/');
  }

  async login(username: string, password: string) {
    await this.page.getByPlaceholder('Username').fill(username);
    await this.page.getByPlaceholder('Password').fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectLoginFormVisible() {
    await expect(this.page.getByPlaceholder('Username')).toBeVisible();
  }

  async expectSessionCookie(username: string) {
    await expect
      .poll(() => this.page.evaluate(() => document.cookie))
      .toContain(`session-username=${username}`);
  }

  async expectSessionCookieCleared() {
    await expect
      .poll(() => this.page.evaluate(() => document.cookie))
      .not.toContain('session-username=');
  }
}