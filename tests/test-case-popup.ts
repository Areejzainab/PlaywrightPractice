import { expect, type Page } from '@playwright/test';

export async function showTestCasePopup(page: Page, testTitle: string) {
  const [testCaseNumber, ...descriptionParts] = testTitle.split(' - ');
  const description = descriptionParts.join(' - ');

  await page.evaluate(({ testCaseNumber, description }) => {
    const overlay = document.createElement('div');
    overlay.dataset.testid = 'test-case-popup';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'assertive');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(0,0,0,.45);';

    const message = document.createElement('div');
    message.style.cssText = 'max-width:420px;padding:24px 32px;background:white;color:#222;text-align:center;border-radius:6px;font:16px Arial,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.25);';

    const title = document.createElement('strong');
    title.textContent = `Executing test case ${testCaseNumber}`;
    title.style.cssText = 'display:block;margin-bottom:10px;font-size:20px;';

    const details = document.createElement('div');
    details.textContent = description;

    message.append(title, details);
    overlay.append(message);
    document.body.append(overlay);

    window.setTimeout(() => overlay.remove(), 2000);
  }, { testCaseNumber, description });

  const popup = page.getByTestId('test-case-popup');
  await expect(popup).toBeVisible();
  await popup.waitFor({ state: 'detached' });
}

export async function showTestResultPopup(page: Page, passed: boolean) {
  if (page.isClosed()) {
    return;
  }

  const result = passed ? 'Testcase Passed' : 'Testcase Failed';
  const color = passed ? '#15803d' : '#b91c1c';

  await page.evaluate(({ result, color }) => {
    const overlay = document.createElement('div');
    overlay.dataset.testid = 'test-result-popup';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'assertive');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;display:grid;place-items:center;background:rgba(0,0,0,.5);';

    const message = document.createElement('strong');
    message.textContent = result;
    message.style.cssText = `padding:32px 48px;background:white;color:${color};text-align:center;border-radius:8px;font:700 48px Arial,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.25);`;

    overlay.append(message);
    document.body.append(overlay);
    window.setTimeout(() => overlay.remove(), 2000);
  }, { result, color });

  const popup = page.getByTestId('test-result-popup');
  await expect(popup).toBeVisible();
  await popup.waitFor({ state: 'detached' });
}