import { type Page } from '@playwright/test';
import { test as dbTest } from './database';

type AuthFixtures = {
  authenticatedPage: Page;
  loginAsUser: (username: string, password: string) => Promise<void>;
};

export const test = dbTest.extend<AuthFixtures>({
  authenticatedPage: async ({ page, basicData }, providePage) => {
    // Login with the test user from basicData
    await page.goto('/signin');

    await page.fill('[name="username"]', basicData.user.username);
    await page.fill('[name="password"]', basicData.user.password);
    await page.click('[type="submit"]');

    // Wait for successful login (adjust selector based on your app)
    await page.waitForURL('/dashboard');

    await providePage(page);
  },

  loginAsUser: async ({ page }, provideLoginFunction) => {
    const loginAsUser = async (username: string, password: string) => {
      await page.goto('/signin');
      await page.fill('[name="username"]', username);
      await page.fill('[name="password"]', password);
      await page.click('[type="submit"]');
      await page.waitForURL('/dashboard');
    };

    await provideLoginFunction(loginAsUser);
  },
});

