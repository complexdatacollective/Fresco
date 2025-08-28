import { Page } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  async ensureAuthenticated() {
    // Check if we're already authenticated
    const url = this.page.url();
    if (url.includes('/signin') || url.includes('/signup')) {
      await this.login();
    }
  }

  async login(
    username = process.env.TEST_USERNAME ?? 'testuser', 
    password = process.env.TEST_PASSWORD ?? 'TestPassword123!'
  ) {
    await this.page.goto('/signin');
    
    await this.page.fill('[name="username"]', username);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect
    await this.page.waitForURL(/\/(dashboard|setup)/);
    
    // Complete setup if needed
    if (this.page.url().includes('/setup')) {
      await this.page.waitForURL('/dashboard');
    }
  }

  async logout() {
    // Look for logout button in user menu or similar
    const userMenu = this.page.locator('[data-testid="user-menu"]');
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await this.page.click('[data-testid="logout-button"]');
    } else {
      // Fallback: navigate to logout endpoint or clear cookies
      await this.page.context().clearCookies();
      await this.page.goto('/signin');
    }
  }

  async createTestUser(username: string, password: string) {
    await this.page.goto('/signup');
    
    await this.page.fill('[name="username"]', username);
    await this.page.fill('[name="password"]', password);
    await this.page.fill('[name="confirmPassword"]', password);
    await this.page.click('button[type="submit"]');
    
    await this.page.waitForURL(/\/(dashboard|setup)/);
  }
}