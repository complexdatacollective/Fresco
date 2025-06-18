# PHASE 3: Authentication & Core Test Utilities

This phase creates authentication helpers, page object models, and core testing utilities to build reliable and maintainable E2E tests.

## Prerequisites

- Phase 1 and Phase 2 completed successfully
- Test database and seeding infrastructure working
- Understanding of the Fresco authentication system (Lucia Auth)

## Task 3.1: Authentication Test Helpers

**Objective**: Create robust authentication utilities for testing authenticated user flows.

**Steps**:

1. **Create authentication utilities directory**:

   ```bash
   mkdir -p tests/e2e/utils/auth
   touch tests/e2e/utils/auth/index.ts
   ```

2. **Create session management utilities**:

   ```bash
   touch tests/e2e/utils/auth/session.ts
   ```

3. **Add session management implementation**:

   ```typescript
   // tests/e2e/utils/auth/session.ts
   import { Page, BrowserContext } from '@playwright/test';
   import { prisma } from '~/utils/db';
   import { generateId } from 'lucia';
   import { hash } from '@node-rs/argon2';

   export interface TestSession {
     sessionId: string;
     userId: string;
     username: string;
     password: string;
   }

   /**
    * Create a valid session for a user in the database
    */
   export const createTestSession = async (
     username: string,
     password: string,
   ): Promise<TestSession> => {
     // Hash the password
     const hashedPassword = await hash(password);

     // Create or get user
     const user = await prisma.user.upsert({
       where: { username },
       update: {},
       create: {
         username,
         key: {
           create: {
             id: `username:${username}`,
             hashed_password: hashedPassword,
           },
         },
       },
     });

     // Create session
     const sessionId = generateId(40);
     const now = new Date();
     const activeExpires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // 7 days
     const idleExpires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30); // 30 days

     await prisma.session.create({
       data: {
         id: sessionId,
         user_id: user.id,
         active_expires: BigInt(activeExpires.getTime()),
         idle_expires: BigInt(idleExpires.getTime()),
       },
     });

     return {
       sessionId,
       userId: user.id,
       username,
       password,
     };
   };

   /**
    * Set authentication cookies for a browser context
    */
   export const setAuthCookies = async (
     context: BrowserContext,
     sessionId: string,
   ) => {
     await context.addCookies([
       {
         name: 'auth_session',
         value: sessionId,
         domain: 'localhost',
         path: '/',
         httpOnly: true,
         secure: false,
         sameSite: 'Lax',
       },
     ]);
   };

   /**
    * Login user via UI (full authentication flow)
    */
   export const loginUserViaUI = async (
     page: Page,
     username: string,
     password: string,
   ) => {
     await page.goto('/signin');

     // Wait for signin form to be visible
     await page.waitForSelector('form');

     // Fill in credentials
     await page.fill('[name="username"]', username);
     await page.fill('[name="password"]', password);

     // Submit form
     await page.click('[type="submit"]');

     // Wait for successful login (dashboard or expected redirect)
     await page.waitForURL(/.*\/(dashboard|setup)/, { timeout: 10000 });
   };

   /**
    * Login user via session injection (faster for tests)
    */
   export const loginUserViaSession = async (
     page: Page,
     username: string,
     password: string,
   ) => {
     const session = await createTestSession(username, password);
     await setAuthCookies(page.context(), session.sessionId);

     // Navigate to a protected page to verify authentication
     await page.goto('/dashboard');
     await page.waitForLoadState('networkidle');

     return session;
   };

   /**
    * Logout user and clear session
    */
   export const logoutUser = async (page: Page) => {
     // Clear cookies
     await page.context().clearCookies();

     // Navigate to public page
     await page.goto('/');
     await page.waitForLoadState('networkidle');
   };

   /**
    * Verify user is authenticated
    */
   export const verifyUserAuthenticated = async (
     page: Page,
   ): Promise<boolean> => {
     try {
       // Try to navigate to a protected page
       await page.goto('/dashboard');
       await page.waitForURL(/.*\/dashboard/, { timeout: 5000 });
       return true;
     } catch {
       return false;
     }
   };

   /**
    * Verify user is not authenticated
    */
   export const verifyUserNotAuthenticated = async (
     page: Page,
   ): Promise<boolean> => {
     try {
       await page.goto('/dashboard');
       await page.waitForURL(/.*\/signin/, { timeout: 5000 });
       return true;
     } catch {
       return false;
     }
   };
   ```

4. **Create authentication fixtures**:

   ```bash
   touch tests/e2e/utils/auth/fixtures.ts
   ```

5. **Add authentication fixtures**:

   ```typescript
   // tests/e2e/utils/auth/fixtures.ts
   import { test as base, Page } from '@playwright/test';
   import { test as dbTest } from '../../fixtures/database';
   import { loginUserViaSession, loginUserViaUI, TestSession } from './session';

   export interface AuthenticatedFixtures {
     authenticatedPage: Page;
     adminPage: Page;
     loginAs: (username: string, password: string) => Promise<TestSession>;
     loginViaUI: (username: string, password: string) => Promise<void>;
   }

   export const test = dbTest.extend<AuthenticatedFixtures>({
     // Automatically authenticated page using session injection
     authenticatedPage: async ({ page, basicData }, use) => {
       const session = await loginUserViaSession(
         page,
         basicData.user.username,
         basicData.user.password,
       );
       await use(page);
     },

     // Admin authenticated page
     adminPage: async ({ page, dashboardData }, use) => {
       const session = await loginUserViaSession(
         page,
         dashboardData.user.username,
         dashboardData.user.password,
       );
       await use(page);
     },

     // Login as any user utility
     loginAs: async ({ page }, use) => {
       const loginAs = async (username: string, password: string) => {
         return await loginUserViaSession(page, username, password);
       };
       await use(loginAs);
     },

     // Login via UI utility
     loginViaUI: async ({ page }, use) => {
       const loginViaUI = async (username: string, password: string) => {
         await loginUserViaUI(page, username, password);
       };
       await use(loginViaUI);
     },
   });

   export { expect } from '@playwright/test';
   ```

6. **Update authentication utilities index**:

   ```typescript
   // tests/e2e/utils/auth/index.ts
   export * from './session';
   export * from './fixtures';
   ```

**Verification**: Create a simple test to verify authentication utilities work correctly.

## Task 3.2: Page Object Models

**Objective**: Create page object models for consistent and maintainable page interactions.

**Steps**:

1. **Create page objects directory structure**:

   ```bash
   mkdir -p tests/e2e/page-objects/pages
   mkdir -p tests/e2e/page-objects/components
   touch tests/e2e/page-objects/base.page.ts
   ```

2. **Create base page object**:

   ```typescript
   // tests/e2e/page-objects/base.page.ts
   import { Page, Locator, expect } from '@playwright/test';

   export class BasePage {
     protected page: Page;
     protected url: string;

     constructor(page: Page, url: string = '') {
       this.page = page;
       this.url = url;
     }

     // Navigation methods
     async goto(options?: {
       waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
     }) {
       await this.page.goto(this.url, options);
       await this.waitForPageLoad();
     }

     async waitForPageLoad() {
       await this.page.waitForLoadState('networkidle');
     }

     async reload() {
       await this.page.reload();
       await this.waitForPageLoad();
     }

     // Common UI interactions
     async clickElement(selector: string) {
       await this.page.click(selector);
     }

     async fillInput(selector: string, value: string) {
       await this.page.fill(selector, value);
     }

     async selectOption(selector: string, value: string) {
       await this.page.selectOption(selector, value);
     }

     async uploadFile(selector: string, filePath: string) {
       await this.page.setInputFiles(selector, filePath);
     }

     // Waiting utilities
     async waitForElement(selector: string, options?: { timeout?: number }) {
       return await this.page.waitForSelector(selector, options);
     }

     async waitForText(text: string, options?: { timeout?: number }) {
       return await this.page.waitForSelector(`text=${text}`, options);
     }

     async waitForUrl(
       pattern: string | RegExp,
       options?: { timeout?: number },
     ) {
       await this.page.waitForURL(pattern, options);
     }

     // Verification methods
     async verifyTitle(expectedTitle: string | RegExp) {
       await expect(this.page).toHaveTitle(expectedTitle);
     }

     async verifyUrl(expectedUrl: string | RegExp) {
       await expect(this.page).toHaveURL(expectedUrl);
     }

     async verifyElementVisible(selector: string) {
       await expect(this.page.locator(selector)).toBeVisible();
     }

     async verifyElementText(selector: string, expectedText: string | RegExp) {
       await expect(this.page.locator(selector)).toHaveText(expectedText);
     }

     async verifyElementContainsText(
       selector: string,
       expectedText: string | RegExp,
     ) {
       await expect(this.page.locator(selector)).toContainText(expectedText);
     }

     // Screenshot utilities
     async takeScreenshot(name: string) {
       await this.page.screenshot({
         path: `tests/e2e/test-results/${name}.png`,
       });
     }

     async takeElementScreenshot(selector: string, name: string) {
       await this.page
         .locator(selector)
         .screenshot({ path: `tests/e2e/test-results/${name}.png` });
     }

     // Common getters
     get pageTitle() {
       return this.page.title();
     }

     get currentUrl() {
       return this.page.url();
     }

     // Locator helpers
     getLocator(selector: string): Locator {
       return this.page.locator(selector);
     }

     getByTestId(testId: string): Locator {
       return this.page.getByTestId(testId);
     }

     getByRole(role: string, options?: { name?: string | RegExp }): Locator {
       return this.page.getByRole(role as any, options);
     }

     getByText(text: string | RegExp): Locator {
       return this.page.getByText(text);
     }
   }
   ```

3. **Create signin page object**:

   ```bash
   touch tests/e2e/page-objects/pages/signin.page.ts
   ```

4. **Add signin page implementation**:

   ```typescript
   // tests/e2e/page-objects/pages/signin.page.ts
   import { Page } from '@playwright/test';
   import { BasePage } from '../base.page';

   export class SigninPage extends BasePage {
     // Selectors
     private readonly usernameInput = '[name="username"]';
     private readonly passwordInput = '[name="password"]';
     private readonly submitButton = '[type="submit"]';
     private readonly errorMessage = '[data-testid="error-message"]';
     private readonly signupLink = 'a[href="/setup"]';

     constructor(page: Page) {
       super(page, '/signin');
     }

     // Actions
     async fillUsername(username: string) {
       await this.fillInput(this.usernameInput, username);
     }

     async fillPassword(password: string) {
       await this.fillInput(this.passwordInput, password);
     }

     async clickSubmit() {
       await this.clickElement(this.submitButton);
     }

     async clickSignupLink() {
       await this.clickElement(this.signupLink);
     }

     async login(username: string, password: string) {
       await this.fillUsername(username);
       await this.fillPassword(password);
       await this.clickSubmit();
     }

     // Verifications
     async verifyOnSigninPage() {
       await this.verifyUrl(/.*\/signin/);
       await this.verifyElementVisible(this.usernameInput);
       await this.verifyElementVisible(this.passwordInput);
       await this.verifyElementVisible(this.submitButton);
     }

     async verifyErrorMessage(expectedMessage?: string) {
       await this.verifyElementVisible(this.errorMessage);
       if (expectedMessage) {
         await this.verifyElementText(this.errorMessage, expectedMessage);
       }
     }

     async verifySuccessfulLogin() {
       await this.waitForUrl(/.*\/(dashboard|setup)/, { timeout: 10000 });
     }

     // Getters
     get usernameField() {
       return this.getLocator(this.usernameInput);
     }

     get passwordField() {
       return this.getLocator(this.passwordInput);
     }

     get submitBtn() {
       return this.getLocator(this.submitButton);
     }
   }
   ```

5. **Create dashboard page object**:

   ```bash
   touch tests/e2e/page-objects/pages/dashboard.page.ts
   ```

6. **Add dashboard page implementation**:

   ```typescript
   // tests/e2e/page-objects/pages/dashboard.page.ts
   import { Page } from '@playwright/test';
   import { BasePage } from '../base.page';

   export class DashboardPage extends BasePage {
     // Selectors
     private readonly pageTitle = 'h1';
     private readonly navigationBar = '[data-testid="navigation-bar"]';
     private readonly userMenu = '[data-testid="user-menu"]';
     private readonly logoutButton = '[data-testid="logout-button"]';
     private readonly protocolsTab = '[data-testid="protocols-tab"]';
     private readonly participantsTab = '[data-testid="participants-tab"]';
     private readonly interviewsTab = '[data-testid="interviews-tab"]';
     private readonly settingsTab = '[data-testid="settings-tab"]';
     private readonly summaryStats = '[data-testid="summary-statistics"]';
     private readonly activityFeed = '[data-testid="activity-feed"]';

     constructor(page: Page) {
       super(page, '/dashboard');
     }

     // Navigation actions
     async navigateToProtocols() {
       await this.clickElement(this.protocolsTab);
       await this.waitForUrl(/.*\/dashboard\/protocols/);
     }

     async navigateToParticipants() {
       await this.clickElement(this.participantsTab);
       await this.waitForUrl(/.*\/dashboard\/participants/);
     }

     async navigateToInterviews() {
       await this.clickElement(this.interviewsTab);
       await this.waitForUrl(/.*\/dashboard\/interviews/);
     }

     async navigateToSettings() {
       await this.clickElement(this.settingsTab);
       await this.waitForUrl(/.*\/dashboard\/settings/);
     }

     // User actions
     async openUserMenu() {
       await this.clickElement(this.userMenu);
     }

     async logout() {
       await this.openUserMenu();
       await this.clickElement(this.logoutButton);
       await this.waitForUrl(/.*\/signin/);
     }

     // Verifications
     async verifyOnDashboard() {
       await this.verifyUrl(/.*\/dashboard/);
       await this.verifyElementVisible(this.pageTitle);
       await this.verifyElementVisible(this.navigationBar);
     }

     async verifyDashboardContent() {
       await this.verifyElementVisible(this.summaryStats);
       await this.verifyElementVisible(this.activityFeed);
     }

     async verifySummaryStats() {
       await this.verifyElementVisible(this.summaryStats);
       // Add specific stat verifications based on seeded data
     }

     // Getters
     get title() {
       return this.getLocator(this.pageTitle);
     }

     get navigation() {
       return this.getLocator(this.navigationBar);
     }

     get stats() {
       return this.getLocator(this.summaryStats);
     }

     get activity() {
       return this.getLocator(this.activityFeed);
     }
   }
   ```

7. **Create setup page object**:

   ```bash
   touch tests/e2e/page-objects/pages/setup.page.ts
   ```

8. **Add setup page implementation**:

   ```typescript
   // tests/e2e/page-objects/pages/setup.page.ts
   import { Page } from '@playwright/test';
   import { BasePage } from '../base.page';

   export class SetupPage extends BasePage {
     // Selectors
     private readonly stepIndicator = '[data-testid="setup-steps"]';
     private readonly currentStep = '[data-testid="current-step"]';
     private readonly nextButton = '[data-testid="next-button"]';
     private readonly backButton = '[data-testid="back-button"]';
     private readonly skipButton = '[data-testid="skip-button"]';

     // Step-specific selectors
     private readonly createAccountForm = '[data-testid="create-account-form"]';
     private readonly usernameInput = '[name="username"]';
     private readonly passwordInput = '[name="password"]';
     private readonly confirmPasswordInput = '[name="confirmPassword"]';

     private readonly uploadThingForm = '[data-testid="uploadthing-form"]';
     private readonly uploadThingTokenInput = '[name="uploadThingToken"]';

     private readonly protocolUploadForm =
       '[data-testid="protocol-upload-form"]';
     private readonly protocolFileInput = '[name="protocolFile"]';

     constructor(page: Page) {
       super(page, '/setup');
     }

     // Navigation actions
     async clickNext() {
       await this.clickElement(this.nextButton);
     }

     async clickBack() {
       await this.clickElement(this.backButton);
     }

     async clickSkip() {
       await this.clickElement(this.skipButton);
     }

     // Account creation step
     async fillAccountDetails(
       username: string,
       password: string,
       confirmPassword?: string,
     ) {
       await this.fillInput(this.usernameInput, username);
       await this.fillInput(this.passwordInput, password);
       await this.fillInput(
         this.confirmPasswordInput,
         confirmPassword || password,
       );
     }

     async submitAccountForm() {
       await this.clickElement(`${this.createAccountForm} [type="submit"]`);
     }

     async createAccount(username: string, password: string) {
       await this.fillAccountDetails(username, password);
       await this.submitAccountForm();
     }

     // UploadThing configuration step
     async fillUploadThingToken(token: string) {
       await this.fillInput(this.uploadThingTokenInput, token);
     }

     async submitUploadThingForm() {
       await this.clickElement(`${this.uploadThingForm} [type="submit"]`);
     }

     async configureUploadThing(token: string) {
       await this.fillUploadThingToken(token);
       await this.submitUploadThingForm();
     }

     // Protocol upload step
     async uploadProtocolFile(filePath: string) {
       await this.uploadFile(this.protocolFileInput, filePath);
     }

     async submitProtocolUpload() {
       await this.clickElement(`${this.protocolUploadForm} [type="submit"]`);
     }

     async uploadProtocol(filePath: string) {
       await this.uploadProtocolFile(filePath);
       await this.submitProtocolUpload();
     }

     // Verifications
     async verifyOnSetupPage() {
       await this.verifyUrl(/.*\/setup/);
       await this.verifyElementVisible(this.stepIndicator);
     }

     async verifyCurrentStep(stepNumber: number) {
       await this.verifyElementText(this.currentStep, stepNumber.toString());
     }

     async verifySetupComplete() {
       await this.waitForUrl(/.*\/dashboard/);
     }

     // Getters
     get steps() {
       return this.getLocator(this.stepIndicator);
     }

     get accountForm() {
       return this.getLocator(this.createAccountForm);
     }

     get uploadThingForm() {
       return this.getLocator(this.uploadThingForm);
     }

     get protocolForm() {
       return this.getLocator(this.protocolUploadForm);
     }
   }
   ```

9. **Create page objects index**:

   ```bash
   touch tests/e2e/page-objects/index.ts
   ```

10. **Add page objects index**:

    ```typescript
    // tests/e2e/page-objects/index.ts
    export { BasePage } from './base.page';
    export { SigninPage } from './pages/signin.page';
    export { DashboardPage } from './pages/dashboard.page';
    export { SetupPage } from './pages/setup.page';
    ```

**Verification**: Create simple tests using page objects to ensure they work correctly.

## Task 3.3: Common Test Components

**Objective**: Create reusable components for testing common UI elements like tables, modals, and forms.

**Steps**:

1. **Create components directory**:

   ```bash
   mkdir -p tests/e2e/page-objects/components
   touch tests/e2e/page-objects/components/base.component.ts
   ```

2. **Create base component class**:

   ```typescript
   // tests/e2e/page-objects/components/base.component.ts
   import { Page, Locator } from '@playwright/test';

   export class BaseComponent {
     protected page: Page;
     protected container: Locator;

     constructor(page: Page, containerSelector: string) {
       this.page = page;
       this.container = page.locator(containerSelector);
     }

     async waitForVisible() {
       await this.container.waitFor({ state: 'visible' });
     }

     async waitForHidden() {
       await this.container.waitFor({ state: 'hidden' });
     }

     async isVisible(): Promise<boolean> {
       return await this.container.isVisible();
     }

     async click() {
       await this.container.click();
     }

     async hover() {
       await this.container.hover();
     }

     async takeScreenshot(name: string) {
       await this.container.screenshot({
         path: `tests/e2e/test-results/${name}.png`,
       });
     }
   }
   ```

3. **Create data table component**:

   ```bash
   touch tests/e2e/page-objects/components/data-table.component.ts
   ```

4. **Add data table implementation**:

   ```typescript
   // tests/e2e/page-objects/components/data-table.component.ts
   import { Page, Locator, expect } from '@playwright/test';
   import { BaseComponent } from './base.component';

   export class DataTableComponent extends BaseComponent {
     private readonly headerRow = 'thead tr';
     private readonly bodyRows = 'tbody tr';
     private readonly cells = 'td';
     private readonly headerCells = 'th';
     private readonly searchInput = '[data-testid="table-search"]';
     private readonly filterButton = '[data-testid="table-filter"]';
     private readonly paginationNext = '[data-testid="pagination-next"]';
     private readonly paginationPrev = '[data-testid="pagination-prev"]';
     private readonly pageInfo = '[data-testid="page-info"]';
     private readonly actionsDropdown = '[data-testid="actions-dropdown"]';

     constructor(
       page: Page,
       containerSelector: string = '[data-testid="data-table"]',
     ) {
       super(page, containerSelector);
     }

     // Table interaction methods
     async getRowCount(): Promise<number> {
       const rows = this.container.locator(this.bodyRows);
       return await rows.count();
     }

     async getColumnCount(): Promise<number> {
       const headers = this.container.locator(this.headerCells);
       return await headers.count();
     }

     async getColumnHeaders(): Promise<string[]> {
       const headers = this.container.locator(this.headerCells);
       const count = await headers.count();
       const headerTexts: string[] = [];

       for (let i = 0; i < count; i++) {
         const text = await headers.nth(i).textContent();
         headerTexts.push(text || '');
       }

       return headerTexts;
     }

     async getCellText(row: number, column: number): Promise<string> {
       const cell = this.container
         .locator(this.bodyRows)
         .nth(row)
         .locator(this.cells)
         .nth(column);
       return (await cell.textContent()) || '';
     }

     async getRowData(row: number): Promise<string[]> {
       const rowLocator = this.container.locator(this.bodyRows).nth(row);
       const cells = rowLocator.locator(this.cells);
       const cellCount = await cells.count();
       const rowData: string[] = [];

       for (let i = 0; i < cellCount; i++) {
         const text = await cells.nth(i).textContent();
         rowData.push(text || '');
       }

       return rowData;
     }

     async clickRow(row: number) {
       await this.container.locator(this.bodyRows).nth(row).click();
     }

     async clickCell(row: number, column: number) {
       await this.container
         .locator(this.bodyRows)
         .nth(row)
         .locator(this.cells)
         .nth(column)
         .click();
     }

     // Search and filter methods
     async search(term: string) {
       const searchField = this.container.locator(this.searchInput);
       await searchField.fill(term);
       await this.page.waitForTimeout(500); // Wait for search debounce
     }

     async clearSearch() {
       const searchField = this.container.locator(this.searchInput);
       await searchField.clear();
       await this.page.waitForTimeout(500);
     }

     async openFilter() {
       await this.container.locator(this.filterButton).click();
     }

     // Pagination methods
     async goToNextPage() {
       await this.container.locator(this.paginationNext).click();
       await this.page.waitForLoadState('networkidle');
     }

     async goToPreviousPage() {
       await this.container.locator(this.paginationPrev).click();
       await this.page.waitForLoadState('networkidle');
     }

     async getCurrentPageInfo(): Promise<string> {
       const pageInfo = this.container.locator(this.pageInfo);
       return (await pageInfo.textContent()) || '';
     }

     // Actions dropdown methods
     async openActionsDropdown(row: number) {
       const dropdown = this.container
         .locator(this.bodyRows)
         .nth(row)
         .locator(this.actionsDropdown);
       await dropdown.click();
     }

     async selectAction(row: number, action: string) {
       await this.openActionsDropdown(row);
       await this.page.locator(`[data-testid="action-${action}"]`).click();
     }

     // Verification methods
     async verifyTableNotEmpty() {
       const rowCount = await this.getRowCount();
       expect(rowCount).toBeGreaterThan(0);
     }

     async verifyTableEmpty() {
       const rowCount = await this.getRowCount();
       expect(rowCount).toBe(0);
     }

     async verifyColumnExists(columnName: string) {
       const headers = await this.getColumnHeaders();
       expect(headers).toContain(columnName);
     }

     async verifyCellContains(
       row: number,
       column: number,
       expectedText: string,
     ) {
       const cellText = await this.getCellText(row, column);
       expect(cellText).toContain(expectedText);
     }

     async verifyRowCount(expectedCount: number) {
       const actualCount = await this.getRowCount();
       expect(actualCount).toBe(expectedCount);
     }
   }
   ```

5. **Create modal component**:

   ```bash
   touch tests/e2e/page-objects/components/modal.component.ts
   ```

6. **Add modal implementation**:

   ```typescript
   // tests/e2e/page-objects/components/modal.component.ts
   import { Page, expect } from '@playwright/test';
   import { BaseComponent } from './base.component';

   export class ModalComponent extends BaseComponent {
     private readonly modalHeader = '[data-testid="modal-header"]';
     private readonly modalTitle = '[data-testid="modal-title"]';
     private readonly modalBody = '[data-testid="modal-body"]';
     private readonly modalFooter = '[data-testid="modal-footer"]';
     private readonly closeButton = '[data-testid="modal-close"]';
     private readonly cancelButton = '[data-testid="modal-cancel"]';
     private readonly confirmButton = '[data-testid="modal-confirm"]';
     private readonly overlay = '[data-testid="modal-overlay"]';

     constructor(
       page: Page,
       containerSelector: string = '[data-testid="modal"]',
     ) {
       super(page, containerSelector);
     }

     // Modal interaction methods
     async close() {
       await this.container.locator(this.closeButton).click();
       await this.waitForHidden();
     }

     async cancel() {
       await this.container.locator(this.cancelButton).click();
       await this.waitForHidden();
     }

     async confirm() {
       await this.container.locator(this.confirmButton).click();
     }

     async clickOverlay() {
       await this.container.locator(this.overlay).click();
       await this.waitForHidden();
     }

     async getTitle(): Promise<string> {
       const title = this.container.locator(this.modalTitle);
       return (await title.textContent()) || '';
     }

     async getBodyText(): Promise<string> {
       const body = this.container.locator(this.modalBody);
       return (await body.textContent()) || '';
     }

     // Form interactions within modal
     async fillField(fieldName: string, value: string) {
       await this.container.locator(`[name="${fieldName}"]`).fill(value);
     }

     async selectOption(fieldName: string, value: string) {
       await this.container
         .locator(`[name="${fieldName}"]`)
         .selectOption(value);
     }

     async submitForm() {
       await this.container.locator('[type="submit"]').click();
     }

     // Verification methods
     async verifyModalOpen() {
       await this.waitForVisible();
       await expect(this.container).toBeVisible();
     }

     async verifyModalClosed() {
       await this.waitForHidden();
       await expect(this.container).not.toBeVisible();
     }

     async verifyTitle(expectedTitle: string) {
       const title = await this.getTitle();
       expect(title).toBe(expectedTitle);
     }

     async verifyBodyContains(expectedText: string) {
       const body = this.container.locator(this.modalBody);
       await expect(body).toContainText(expectedText);
     }

     async verifyConfirmButtonEnabled() {
       const confirmBtn = this.container.locator(this.confirmButton);
       await expect(confirmBtn).toBeEnabled();
     }

     async verifyConfirmButtonDisabled() {
       const confirmBtn = this.container.locator(this.confirmButton);
       await expect(confirmBtn).toBeDisabled();
     }
   }
   ```

7. **Create form component**:

   ```bash
   touch tests/e2e/page-objects/components/form.component.ts
   ```

8. **Add form implementation**:

   ```typescript
   // tests/e2e/page-objects/components/form.component.ts
   import { Page, expect } from '@playwright/test';
   import { BaseComponent } from './base.component';

   export class FormComponent extends BaseComponent {
     private readonly submitButton = '[type="submit"]';
     private readonly resetButton = '[type="reset"]';
     private readonly errorMessage = '[data-testid="form-error"]';
     private readonly successMessage = '[data-testid="form-success"]';

     constructor(page: Page, containerSelector: string) {
       super(page, containerSelector);
     }

     // Form interaction methods
     async fillField(fieldName: string, value: string) {
       const field = this.container.locator(`[name="${fieldName}"]`);
       await field.fill(value);
     }

     async selectOption(fieldName: string, value: string) {
       const select = this.container.locator(`[name="${fieldName}"]`);
       await select.selectOption(value);
     }

     async checkBox(fieldName: string, checked: boolean = true) {
       const checkbox = this.container.locator(`[name="${fieldName}"]`);
       if (checked) {
         await checkbox.check();
       } else {
         await checkbox.uncheck();
       }
     }

     async uploadFile(fieldName: string, filePath: string) {
       const fileInput = this.container.locator(`[name="${fieldName}"]`);
       await fileInput.setInputFiles(filePath);
     }

     async submit() {
       await this.container.locator(this.submitButton).click();
     }

     async reset() {
       await this.container.locator(this.resetButton).click();
     }

     async getFieldValue(fieldName: string): Promise<string> {
       const field = this.container.locator(`[name="${fieldName}"]`);
       return (await field.inputValue()) || '';
     }

     async isFieldVisible(fieldName: string): Promise<boolean> {
       const field = this.container.locator(`[name="${fieldName}"]`);
       return await field.isVisible();
     }

     async isFieldDisabled(fieldName: string): Promise<boolean> {
       const field = this.container.locator(`[name="${fieldName}"]`);
       return await field.isDisabled();
     }

     // Validation methods
     async getFieldError(fieldName: string): Promise<string> {
       const errorElement = this.container.locator(
         `[data-testid="error-${fieldName}"]`,
       );
       return (await errorElement.textContent()) || '';
     }

     async hasFieldError(fieldName: string): Promise<boolean> {
       const errorElement = this.container.locator(
         `[data-testid="error-${fieldName}"]`,
       );
       return await errorElement.isVisible();
     }

     async getFormError(): Promise<string> {
       const error = this.container.locator(this.errorMessage);
       return (await error.textContent()) || '';
     }

     async getSuccessMessage(): Promise<string> {
       const success = this.container.locator(this.successMessage);
       return (await success.textContent()) || '';
     }

     // Verification methods
     async verifyFieldValue(fieldName: string, expectedValue: string) {
       const value = await this.getFieldValue(fieldName);
       expect(value).toBe(expectedValue);
     }

     async verifyFieldError(fieldName: string, expectedError: string) {
       const error = await this.getFieldError(fieldName);
       expect(error).toContain(expectedError);
     }

     async verifyFormError(expectedError: string) {
       const error = this.container.locator(this.errorMessage);
       await expect(error).toContainText(expectedError);
     }

     async verifyFormSuccess(expectedMessage: string) {
       const success = this.container.locator(this.successMessage);
       await expect(success).toContainText(expectedMessage);
     }

     async verifySubmitDisabled() {
       const submit = this.container.locator(this.submitButton);
       await expect(submit).toBeDisabled();
     }

     async verifySubmitEnabled() {
       const submit = this.container.locator(this.submitButton);
       await expect(submit).toBeEnabled();
     }
   }
   ```

9. **Update components index**:

   ```bash
   touch tests/e2e/page-objects/components/index.ts
   ```

10. **Add components index**:

    ```typescript
    // tests/e2e/page-objects/components/index.ts
    export { BaseComponent } from './base.component';
    export { DataTableComponent } from './data-table.component';
    export { ModalComponent } from './modal.component';
    export { FormComponent } from './form.component';
    ```

**Verification**: Create tests that use the component classes to verify they work correctly.

## Task 3.4: Test Utilities and Helpers

**Objective**: Create utility functions for common testing operations and assertions.

**Steps**:

1. **Create utilities directory**:

   ```bash
   mkdir -p tests/e2e/utils/helpers
   touch tests/e2e/utils/helpers/index.ts
   ```

2. **Create wait utilities**:

   ```bash
   touch tests/e2e/utils/helpers/wait.ts
   ```

3. **Add wait utilities implementation**:

   ```typescript
   // tests/e2e/utils/helpers/wait.ts
   import { Page } from '@playwright/test';

   /**
    * Wait for network requests to complete
    */
   export const waitForNetworkIdle = async (
     page: Page,
     timeout: number = 5000,
   ) => {
     await page.waitForLoadState('networkidle', { timeout });
   };

   /**
    * Wait for specific API endpoint to be called
    */
   export const waitForApiCall = async (
     page: Page,
     endpoint: string,
     timeout: number = 10000,
   ) => {
     return await page.waitForResponse(
       (response) =>
         response.url().includes(endpoint) && response.status() === 200,
       { timeout },
     );
   };

   /**
    * Wait for element to appear and be stable
    */
   export const waitForElementStable = async (
     page: Page,
     selector: string,
     timeout: number = 5000,
   ) => {
     const element = page.locator(selector);
     await element.waitFor({ state: 'visible', timeout });

     // Wait for element to stop moving (useful for animations)
     let previousBox = await element.boundingBox();
     let stableCount = 0;

     while (stableCount < 3) {
       await page.waitForTimeout(100);
       const currentBox = await element.boundingBox();

       if (JSON.stringify(previousBox) === JSON.stringify(currentBox)) {
         stableCount++;
       } else {
         stableCount = 0;
         previousBox = currentBox;
       }
     }
   };

   /**
    * Wait for text to appear in element
    */
   export const waitForTextInElement = async (
     page: Page,
     selector: string,
     expectedText: string,
     timeout: number = 5000,
   ) => {
     await page.waitForFunction(
       ({ selector, text }) => {
         const element = document.querySelector(selector);
         return element && element.textContent?.includes(text);
       },
       { selector, text: expectedText },
       { timeout },
     );
   };

   /**
    * Wait for condition to be true
    */
   export const waitForCondition = async (
     condition: () => Promise<boolean>,
     options: { timeout?: number; interval?: number } = {},
   ) => {
     const { timeout = 5000, interval = 100 } = options;
     const startTime = Date.now();

     while (Date.now() - startTime < timeout) {
       if (await condition()) {
         return true;
       }
       await new Promise((resolve) => setTimeout(resolve, interval));
     }

     throw new Error(`Condition not met within ${timeout}ms`);
   };
   ```

4. **Create data helpers**:

   ```bash
   touch tests/e2e/utils/helpers/data.ts
   ```

5. **Add data helpers implementation**:

   ```typescript
   // tests/e2e/utils/helpers/data.ts
   import { faker } from '@faker-js/faker';
   import path from 'path';
   import fs from 'fs';

   /**
    * Generate random test data
    */
   export class TestDataGenerator {
     static randomUsername(): string {
       return faker.internet.userName().toLowerCase();
     }

     static randomEmail(): string {
       return faker.internet.email().toLowerCase();
     }

     static randomPassword(): string {
       return faker.internet.password({ length: 12, prefix: 'Test123!' });
     }

     static randomProtocolName(): string {
       return `${faker.company.name()} Study ${faker.number.int({ min: 1, max: 999 })}`;
     }

     static randomParticipantId(): string {
       return faker.string.alphanumeric(8).toUpperCase();
     }

     static randomNetworkData() {
       const nodeCount = faker.number.int({ min: 2, max: 10 });
       const nodes = [];

       for (let i = 0; i < nodeCount; i++) {
         nodes.push({
           uid: faker.string.uuid(),
           type: 'person',
           attributes: {
             name: faker.person.firstName(),
             age: faker.number.int({ min: 18, max: 80 }),
           },
         });
       }

       return {
         nodes,
         edges: [],
         ego: {
           uid: 'ego',
           attributes: {},
         },
       };
     }
   }

   /**
    * File system helpers for test files
    */
   export class TestFileHelper {
     private static testFilesDir = path.join(
       process.cwd(),
       'tests/e2e/test-data/files',
     );

     static ensureTestFilesDir() {
       if (!fs.existsSync(this.testFilesDir)) {
         fs.mkdirSync(this.testFilesDir, { recursive: true });
       }
     }

     static getTestFilePath(filename: string): string {
       return path.join(this.testFilesDir, filename);
     }

     static createTestProtocolFile(content?: any): string {
       this.ensureTestFilesDir();

       const protocolData = content || {
         name: TestDataGenerator.randomProtocolName(),
         description: faker.lorem.sentence(),
         schemaVersion: 6,
         stages: [
           {
             id: 'stage1',
             type: 'NameGenerator',
             label: 'Name Generator',
             prompts: [
               {
                 id: 'prompt1',
                 text: 'Please name people you know',
                 variable: 'name',
               },
             ],
           },
         ],
         codebook: {
           node: {
             person: {
               name: 'Person',
               variables: {
                 name: { name: 'Name', type: 'text' },
               },
             },
           },
           edge: {},
           ego: { variables: {} },
         },
       };

       const filename = `test-protocol-${Date.now()}.json`;
       const filepath = this.getTestFilePath(filename);

       fs.writeFileSync(filepath, JSON.stringify(protocolData, null, 2));

       return filepath;
     }

     static createTestImageFile(): string {
       this.ensureTestFilesDir();

       // Create a simple 1x1 pixel PNG
       const pngData = Buffer.from([
         0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
         0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
         0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
         0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0x00, 0x00, 0x00,
         0x01, 0x00, 0x01, 0x5c, 0xcc, 0x5e, 0x27, 0x00, 0x00, 0x00, 0x00, 0x49,
         0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
       ]);

       const filename = `test-image-${Date.now()}.png`;
       const filepath = this.getTestFilePath(filename);

       fs.writeFileSync(filepath, pngData);

       return filepath;
     }

     static createTestCSVFile(data: any[]): string {
       this.ensureTestFilesDir();

       if (data.length === 0) {
         data = [
           { id: '1', name: 'John Doe', email: 'john@example.com' },
           { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
         ];
       }

       const headers = Object.keys(data[0]);
       const csvContent = [
         headers.join(','),
         ...data.map((row) => headers.map((header) => row[header]).join(',')),
       ].join('\n');

       const filename = `test-data-${Date.now()}.csv`;
       const filepath = this.getTestFilePath(filename);

       fs.writeFileSync(filepath, csvContent);

       return filepath;
     }

     static cleanupTestFiles() {
       if (fs.existsSync(this.testFilesDir)) {
         const files = fs.readdirSync(this.testFilesDir);
         for (const file of files) {
           fs.unlinkSync(path.join(this.testFilesDir, file));
         }
       }
     }
   }
   ```

6. **Create assertion helpers**:

   ```bash
   touch tests/e2e/utils/helpers/assertions.ts
   ```

7. **Add assertion helpers implementation**:

   ```typescript
   // tests/e2e/utils/helpers/assertions.ts
   import { Page, expect, Locator } from '@playwright/test';

   /**
    * Custom assertion helpers for common test scenarios
    */
   export class CustomAssertions {
     /**
      * Assert that a table has the expected number of rows
      */
     static async assertTableRowCount(
       page: Page,
       tableSelector: string,
       expectedCount: number,
     ) {
       const rows = page.locator(`${tableSelector} tbody tr`);
       await expect(rows).toHaveCount(expectedCount);
     }

     /**
      * Assert that a table contains specific data
      */
     static async assertTableContainsRow(
       page: Page,
       tableSelector: string,
       rowData: string[],
     ) {
       const table = page.locator(tableSelector);
       const rows = table.locator('tbody tr');
       const rowCount = await rows.count();

       let found = false;
       for (let i = 0; i < rowCount; i++) {
         const cells = rows.nth(i).locator('td');
         const cellCount = await cells.count();

         if (cellCount >= rowData.length) {
           let allMatch = true;
           for (let j = 0; j < rowData.length; j++) {
             const cellText = await cells.nth(j).textContent();
             if (!cellText?.includes(rowData[j])) {
               allMatch = false;
               break;
             }
           }

           if (allMatch) {
             found = true;
             break;
           }
         }
       }

       expect(found).toBe(true);
     }

     /**
      * Assert that form validation errors are displayed
      */
     static async assertFormErrors(
       page: Page,
       formSelector: string,
       expectedErrors: Record<string, string>,
     ) {
       const form = page.locator(formSelector);

       for (const [fieldName, expectedError] of Object.entries(
         expectedErrors,
       )) {
         const errorElement = form.locator(
           `[data-testid="error-${fieldName}"]`,
         );
         await expect(errorElement).toBeVisible();
         await expect(errorElement).toContainText(expectedError);
       }
     }

     /**
      * Assert that a modal is open with specific content
      */
     static async assertModalOpen(
       page: Page,
       expectedTitle?: string,
       expectedContent?: string,
     ) {
       const modal = page.locator('[data-testid="modal"]');
       await expect(modal).toBeVisible();

       if (expectedTitle) {
         const title = modal.locator('[data-testid="modal-title"]');
         await expect(title).toContainText(expectedTitle);
       }

       if (expectedContent) {
         const body = modal.locator('[data-testid="modal-body"]');
         await expect(body).toContainText(expectedContent);
       }
     }

     /**
      * Assert that a toast notification appears
      */
     static async assertToastMessage(
       page: Page,
       expectedMessage: string,
       type: 'success' | 'error' | 'info' = 'success',
     ) {
       const toast = page.locator(`[data-testid="toast-${type}"]`);
       await expect(toast).toBeVisible();
       await expect(toast).toContainText(expectedMessage);

       // Wait for toast to disappear
       await expect(toast).not.toBeVisible({ timeout: 10000 });
     }

     /**
      * Assert that page has loaded completely
      */
     static async assertPageLoaded(
       page: Page,
       expectedUrl?: string | RegExp,
       expectedTitle?: string | RegExp,
     ) {
       await page.waitForLoadState('networkidle');

       if (expectedUrl) {
         await expect(page).toHaveURL(expectedUrl);
       }

       if (expectedTitle) {
         await expect(page).toHaveTitle(expectedTitle);
       }

       // Ensure no loading spinners are visible
       const loadingSpinners = page.locator(
         '[data-testid*="loading"], .loading, .spinner',
       );
       await expect(loadingSpinners).toHaveCount(0);
     }

     /**
      * Assert that data has been saved (by checking API response or UI feedback)
      */
     static async assertDataSaved(page: Page, apiEndpoint?: string) {
       if (apiEndpoint) {
         // Wait for successful API response
         const response = await page.waitForResponse(
           (resp) =>
             resp.url().includes(apiEndpoint) &&
             resp.status() >= 200 &&
             resp.status() < 300,
         );
         expect(response.ok()).toBe(true);
       } else {
         // Look for success indicators in UI
         await this.assertToastMessage(page, '', 'success');
       }
     }

     /**
      * Assert that file upload completed successfully
      */
     static async assertFileUploaded(page: Page, filename?: string) {
       // Wait for upload progress to complete
       const progressBars = page.locator(
         '[data-testid*="progress"], .upload-progress',
       );
       await expect(progressBars).toHaveCount(0);

       // Look for success indication
       if (filename) {
         await expect(page.locator('text=uploaded successfully')).toBeVisible();
         await expect(page.getByText(filename)).toBeVisible();
       }
     }

     /**
      * Assert that element has specific CSS class
      */
     static async assertElementHasClass(locator: Locator, className: string) {
       await expect(locator).toHaveClass(new RegExp(className));
     }

     /**
      * Assert that element has specific attribute value
      */
     static async assertElementAttribute(
       locator: Locator,
       attribute: string,
       expectedValue: string,
     ) {
       await expect(locator).toHaveAttribute(attribute, expectedValue);
     }

     /**
      * Assert that API response has expected structure
      */
     static async assertApiResponse(
       page: Page,
       endpoint: string,
       expectedStructure: any,
     ) {
       const response = await page.waitForResponse((resp) =>
         resp.url().includes(endpoint),
       );
       const data = await response.json();

       // Basic structure validation
       for (const key of Object.keys(expectedStructure)) {
         expect(data).toHaveProperty(key);
       }
     }
   }
   ```

8. **Create browser helpers**:

   ```bash
   touch tests/e2e/utils/helpers/browser.ts
   ```

9. **Add browser helpers implementation**:

   ```typescript
   // tests/e2e/utils/helpers/browser.ts
   import { Page, BrowserContext } from '@playwright/test';

   /**
    * Browser and page utilities
    */
   export class BrowserHelper {
     /**
      * Clear all browser storage
      */
     static async clearStorage(page: Page) {
       await page.evaluate(() => {
         localStorage.clear();
         sessionStorage.clear();
       });

       await page.context().clearCookies();
     }

     /**
      * Set local storage item
      */
     static async setLocalStorage(page: Page, key: string, value: string) {
       await page.evaluate(
         ({ key, value }) => localStorage.setItem(key, value),
         { key, value },
       );
     }

     /**
      * Get local storage item
      */
     static async getLocalStorage(
       page: Page,
       key: string,
     ): Promise<string | null> {
       return await page.evaluate((key) => localStorage.getItem(key), key);
     }

     /**
      * Mock geolocation
      */
     static async mockGeolocation(
       context: BrowserContext,
       latitude: number,
       longitude: number,
     ) {
       await context.setGeolocation({ latitude, longitude });
       await context.grantPermissions(['geolocation']);
     }

     /**
      * Block specific resource types
      */
     static async blockResources(
       page: Page,
       resourceTypes: string[] = ['image', 'stylesheet', 'font'],
     ) {
       await page.route('**/*', (route) => {
         if (resourceTypes.includes(route.request().resourceType())) {
           route.abort();
         } else {
           route.continue();
         }
       });
     }

     /**
      * Take full page screenshot
      */
     static async takeFullPageScreenshot(page: Page, name: string) {
       await page.screenshot({
         path: `tests/e2e/test-results/${name}-full.png`,
         fullPage: true,
       });
     }

     /**
      * Simulate slow network
      */
     static async simulateSlowNetwork(page: Page) {
       const client = await page.context().newCDPSession(page);
       await client.send('Network.emulateNetworkConditions', {
         offline: false,
         downloadThroughput: 500 * 1024, // 500 KB/s
         uploadThroughput: 500 * 1024, // 500 KB/s
         latency: 100, // 100ms
       });
     }

     /**
      * Reset network conditions
      */
     static async resetNetwork(page: Page) {
       const client = await page.context().newCDPSession(page);
       await client.send('Network.emulateNetworkConditions', {
         offline: false,
         downloadThroughput: -1,
         uploadThroughput: -1,
         latency: 0,
       });
     }

     /**
      * Enable request/response logging
      */
     static enableNetworkLogging(page: Page) {
       page.on('request', (request) => {
         console.log(`→ ${request.method()} ${request.url()}`);
       });

       page.on('response', (response) => {
         console.log(`← ${response.status()} ${response.url()}`);
       });
     }

     /**
      * Wait for multiple requests to complete
      */
     static async waitForRequests(
       page: Page,
       urlPatterns: (string | RegExp)[],
       timeout: number = 10000,
     ) {
       const responses = await Promise.all(
         urlPatterns.map((pattern) =>
           page.waitForResponse(
             (response) => {
               if (typeof pattern === 'string') {
                 return response.url().includes(pattern);
               }
               return pattern.test(response.url());
             },
             { timeout },
           ),
         ),
       );

       return responses;
     }
   }
   ```

10. **Update helpers index**:

    ```typescript
    // tests/e2e/utils/helpers/index.ts
    export * from './wait';
    export * from './data';
    export * from './assertions';
    export * from './browser';
    ```

**Verification**: Create tests that use the helper utilities to ensure they work correctly.

## Task 3.5: Enhanced Fixtures with Utilities

**Objective**: Update the test fixtures to include the new utilities and page objects.

**Steps**:

1. **Update fixtures to include page objects**:

   ```bash
   touch tests/e2e/fixtures/pages.ts
   ```

2. **Add page object fixtures**:

   ```typescript
   // tests/e2e/fixtures/pages.ts
   import { test as base } from '@playwright/test';
   import { test as authTest } from './auth';
   import { SigninPage, DashboardPage, SetupPage } from '../page-objects';

   export interface PageFixtures {
     signinPage: SigninPage;
     dashboardPage: DashboardPage;
     setupPage: SetupPage;
   }

   export const test = authTest.extend<PageFixtures>({
     signinPage: async ({ page }, use) => {
       const signinPage = new SigninPage(page);
       await use(signinPage);
     },

     dashboardPage: async ({ page }, use) => {
       const dashboardPage = new DashboardPage(page);
       await use(dashboardPage);
     },

     setupPage: async ({ page }, use) => {
       const setupPage = new SetupPage(page);
       await use(setupPage);
     },
   });

   export { expect } from '@playwright/test';
   ```

3. **Update main fixtures file**:

   ```typescript
   // Update tests/e2e/fixtures/index.ts
   import { test as pageTest } from './pages';
   import { test as authTest } from './auth';
   import { test as dbTest } from './database';

   // Export the most comprehensive test (includes pages + auth + database)
   export const test = pageTest;
   export { expect } from '@playwright/test';

   // Export individual test types for specific use cases
   export { test as dbTest } from './database';
   export { test as authTest } from './auth';
   export { test as pageTest } from './pages';
   ```

4. **Create utility fixtures**:

   ```bash
   touch tests/e2e/fixtures/utilities.ts
   ```

5. **Add utility fixtures**:

   ```typescript
   // tests/e2e/fixtures/utilities.ts
   import { test as base } from '@playwright/test';
   import { test as pageTest } from './pages';
   import {
     TestDataGenerator,
     TestFileHelper,
     CustomAssertions,
     BrowserHelper,
   } from '../utils/helpers';

   export interface UtilityFixtures {
     dataGenerator: typeof TestDataGenerator;
     fileHelper: typeof TestFileHelper;
     assertions: typeof CustomAssertions;
     browserHelper: typeof BrowserHelper;
   }

   export const test = pageTest.extend<UtilityFixtures>({
     dataGenerator: async ({}, use) => {
       await use(TestDataGenerator);
     },

     fileHelper: async ({}, use) => {
       await use(TestFileHelper);
       // Cleanup test files after test
       TestFileHelper.cleanupTestFiles();
     },

     assertions: async ({}, use) => {
       await use(CustomAssertions);
     },

     browserHelper: async ({}, use) => {
       await use(BrowserHelper);
     },
   });

   export { expect } from '@playwright/test';
   ```

**Verification**: Update the main fixtures to use the enhanced utilities.

## Task 3.6: Sample Tests with New Infrastructure

**Objective**: Create comprehensive sample tests demonstrating the authentication, page objects, and utilities.

**Steps**:

1. **Create authentication sample tests**:

   ```bash
   touch tests/e2e/auth.integration.spec.ts
   ```

2. **Add authentication integration tests**:

   ```typescript
   // tests/e2e/auth.integration.spec.ts
   import { test, expect } from './fixtures';

   test.describe('Authentication Integration', () => {
     test('should login with valid credentials using page objects', async ({
       signinPage,
       dashboardPage,
       basicData,
     }) => {
       await signinPage.goto();
       await signinPage.verifyOnSigninPage();

       await signinPage.login(basicData.user.username, basicData.user.password);
       await signinPage.verifySuccessfulLogin();

       await dashboardPage.verifyOnDashboard();
       await dashboardPage.verifyDashboardContent();
     });

     test('should show error for invalid credentials', async ({
       signinPage,
       assertions,
     }) => {
       await signinPage.goto();

       await signinPage.login('invalid-user', 'invalid-password');

       await signinPage.verifyErrorMessage();
       await assertions.assertFormErrors(signinPage.getLocator('form'), {
         general: 'Invalid credentials',
       });
     });

     test('should maintain session across page refreshes', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.verifyOnDashboard();

       await authenticatedPage.reload();
       await dashboardPage.verifyOnDashboard();
     });

     test('should logout successfully', async ({
       authenticatedPage,
       dashboardPage,
       signinPage,
     }) => {
       await dashboardPage.verifyOnDashboard();

       await dashboardPage.logout();

       await signinPage.verifyOnSigninPage();
     });

     test('should redirect to signin when accessing protected page without auth', async ({
       page,
       signinPage,
     }) => {
       await page.goto('/dashboard');
       await signinPage.verifyOnSigninPage();
     });
   });
   ```

3. **Create page object sample tests**:

   ```bash
   touch tests/e2e/page-objects.sample.spec.ts
   ```

4. **Add page object sample tests**:

   ```typescript
   // tests/e2e/page-objects.sample.spec.ts
   import { test, expect } from './fixtures';

   test.describe('Page Objects Integration', () => {
     test('should navigate dashboard using page objects', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.goto();
       await dashboardPage.verifyOnDashboard();

       // Test navigation
       await dashboardPage.navigateToProtocols();
       await expect(authenticatedPage).toHaveURL(/.*\/dashboard\/protocols/);

       await dashboardPage.navigateToParticipants();
       await expect(authenticatedPage).toHaveURL(/.*\/dashboard\/participants/);

       await dashboardPage.navigateToInterviews();
       await expect(authenticatedPage).toHaveURL(/.*\/dashboard\/interviews/);

       await dashboardPage.navigateToSettings();
       await expect(authenticatedPage).toHaveURL(/.*\/dashboard\/settings/);
     });

     test('should use component objects for table interactions', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Use DataTableComponent (will be imported in actual implementation)
       const { DataTableComponent } = await import('./page-objects/components');
       const protocolsTable = new DataTableComponent(authenticatedPage);

       await protocolsTable.waitForVisible();
       await protocolsTable.verifyTableNotEmpty();

       const rowCount = await protocolsTable.getRowCount();
       expect(rowCount).toBeGreaterThan(0);

       const headers = await protocolsTable.getColumnHeaders();
       expect(headers).toContain('Name');
       expect(headers).toContain('Description');
     });

     test('should handle modals using component objects', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToParticipants();

       // Trigger modal (adjust based on actual UI)
       await authenticatedPage.click('[data-testid="add-participant-button"]');

       const { ModalComponent } = await import('./page-objects/components');
       const modal = new ModalComponent(authenticatedPage);

       await modal.verifyModalOpen();
       await modal.verifyTitle('Add Participant');

       await modal.close();
       await modal.verifyModalClosed();
     });
   });
   ```

5. **Create utilities sample tests**:

   ```bash
   touch tests/e2e/utilities.sample.spec.ts
   ```

6. **Add utilities sample tests**:

   ```typescript
   // tests/e2e/utilities.sample.spec.ts
   import { test, expect } from './fixtures';

   test.describe('Test Utilities Integration', () => {
     test('should use data generator utilities', async ({
       dataGenerator,
       basicData,
     }) => {
       const username = dataGenerator.randomUsername();
       const email = dataGenerator.randomEmail();
       const password = dataGenerator.randomPassword();
       const protocolName = dataGenerator.randomProtocolName();

       expect(username).toBeTruthy();
       expect(email).toContain('@');
       expect(password).toMatch(/Test123!/);
       expect(protocolName).toContain('Study');

       const networkData = dataGenerator.randomNetworkData();
       expect(networkData.nodes.length).toBeGreaterThan(0);
       expect(networkData.ego).toBeDefined();
     });

     test('should use file helper utilities', async ({ fileHelper }) => {
       const protocolFile = fileHelper.createTestProtocolFile();
       const imageFile = fileHelper.createTestImageFile();
       const csvFile = fileHelper.createTestCSVFile([
         { id: '1', name: 'Test User 1' },
         { id: '2', name: 'Test User 2' },
       ]);

       expect(protocolFile).toBeTruthy();
       expect(imageFile).toBeTruthy();
       expect(csvFile).toBeTruthy();

       // Files will be cleaned up automatically by fixture
     });

     test('should use custom assertions', async ({
       authenticatedPage,
       dashboardPage,
       assertions,
     }) => {
       await dashboardPage.navigateToProtocols();

       await assertions.assertPageLoaded(
         authenticatedPage,
         /.*\/dashboard\/protocols/,
       );

       // Test table assertions
       const tableSelector = '[data-testid="protocols-table"]';
       await assertions.assertTableRowCount(
         authenticatedPage,
         tableSelector,
         2,
       ); // From basicData
     });

     test('should use browser helpers', async ({ page, browserHelper }) => {
       // Test storage helpers
       await browserHelper.setLocalStorage(page, 'testKey', 'testValue');
       const value = await browserHelper.getLocalStorage(page, 'testKey');
       expect(value).toBe('testValue');

       await browserHelper.clearStorage(page);
       const clearedValue = await browserHelper.getLocalStorage(
         page,
         'testKey',
       );
       expect(clearedValue).toBeNull();

       // Test screenshot helper
       await page.goto('/');
       await browserHelper.takeFullPageScreenshot(page, 'homepage-test');
     });

     test('should use wait utilities', async ({ page }) => {
       const { waitForNetworkIdle, waitForApiCall } = await import(
         './utils/helpers/wait'
       );

       await page.goto('/dashboard');
       await waitForNetworkIdle(page);

       // Test API waiting (adjust endpoint based on actual API)
       const responsePromise = waitForApiCall(page, '/api/protocols');
       await page.reload();
       const response = await responsePromise;
       expect(response.status()).toBe(200);
     });
   });
   ```

**Verification**: Run all sample tests to ensure the infrastructure works correctly together.

## Phase 3 Completion Checklist

- [ ] Authentication utilities and session management implemented
- [ ] Authentication fixtures for automatic login created
- [ ] Base page object model with common functionality
- [ ] Specific page objects for signin, dashboard, and setup pages
- [ ] Reusable component objects for tables, modals, and forms
- [ ] Comprehensive utility helpers for wait, data, assertions, and browser operations
- [ ] Enhanced fixtures that combine all utilities
- [ ] Sample tests demonstrating authentication flows
- [ ] Sample tests showing page object usage
- [ ] Sample tests using utility helpers
- [ ] All integration tests passing
- [ ] Documentation updated with new patterns

## Next Steps

After completing Phase 3, you should have:

- Robust authentication testing infrastructure
- Reusable page objects for consistent test maintenance
- Powerful utility helpers for common operations
- Foundation for building complex user journey tests

Proceed to **PHASE-4.md** for visual testing and screenshot management.
