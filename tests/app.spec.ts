import { expect, test } from '@playwright/test';

test('should respond', async ({ page }) => {
  await page.goto("/"); // base url is set in playwright.config.ts

  const pageContent = await page.content();
  // eslint-disable-next-line no-console
  console.log(pageContent);
});

test('should redirect to /setup', async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup/);
});

test('should create an account', async ({ page }) => {
  await page.goto("/setup");
  // expect setup/step=1
  await expect(page).toHaveURL(/\/setup\/step=1/);
  await page.fill('input[name="username"]', 'test-user', { timeout: 5000 });
  await page.fill('input[name="password"]', 'TestUser1!', { timeout: 5000 });
  await page.fill('input[name="confirmPassword"]', 'TestUser1!', { timeout: 5000 });
  await page.click('button[type="submit"]', { timeout: 5000 });
  // should redirect to /setup/step=2
  await expect(page).toHaveURL(/\/setup\/step=2/);
});



// should create an account
// should connect uploadthing, click save and continue
// should upload a protocol, click continue
// should configure participation, click continue
// should click "go to the dashboard" button
// should redirect to /dashboard


// test('should sign in', async ({ page }) => {
//   await page.goto("/");

//   // expect redirect to /signin
//   await expect(page).toHaveURL(/\/signin/);
  
//   // enter credentials from setup
//   await page.fill('input[name="username"]', 'admin', { timeout: 5000 });
//   await page.fill('input[name="password"]', 'Administrator1!', { timeout: 5000 });

//   // click Sign In button
//   await page.click('button[type="submit"]', { timeout: 5000 });

//   // expect succeess, redirect to /dashboard

// });