import { test as base, expect, type Page } from '@playwright/test';

type Credentials = {
  username: string;
  password: string;
}

const defaultCredentials: Credentials = {
  username: 'admin',
  password: 'Administrator1!'
};

async function signIn(page: Page, credentials: Credentials = defaultCredentials): Promise<void> {
  await page.goto("/");
  await expect(page).toHaveURL(/\/signin/, { timeout: 15000 });

  try {
    await page.fill('input[name="username"]', credentials.username);
    await page.fill('input[name="password"]', credentials.password);
    await page.click('button[type="submit"]', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Sign-in failed:', error);
    throw error;
  }
}

// Define the test fixture
export const test = base.extend<{ signIn: void }>({
  signIn: [async ({ page }, use) => {
    await signIn(page, defaultCredentials);
    await use();
  }, { auto: true }],
});
