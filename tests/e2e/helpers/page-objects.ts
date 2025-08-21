import { type Page, type Locator } from '@playwright/test';

/**
 * Base Page Object for common functionality
 */
export class BasePage {
  constructor(public readonly page: Page) {}

  async navigate(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForElement(selector: string) {
    await this.page.waitForSelector(selector, { state: 'visible' });
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `tests/e2e/__screenshots__/${name}.png`,
      fullPage: true,
    });
  }
}

/**
 * Login Page Object
 */
export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-sonner-toast]');
  }

  async login(username: string, password: string) {
    await this.navigate('/signin');
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    
    // Wait for navigation to complete (either success or failure)
    await this.page.waitForLoadState('networkidle');
  }

  async expectError(message: string) {
    // Wait for any toast notification to appear
    await this.page.waitForSelector('[data-testid="toast"], [role="status"], .toast, .notification, [data-sonner-toast]', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // Check if the error message appears anywhere on the page (use first match)
    const errorLocator = this.page.locator(`text=${message}`).first();
    await errorLocator.waitFor({ state: 'visible', timeout: 5000 });
    return true;
  }
}

/**
 * Dashboard Page Object
 */
export class DashboardPage extends BasePage {
  readonly protocolCard: Locator;
  readonly uploadButton: Locator;
  readonly interviewList: Locator;
  readonly participantList: Locator;

  constructor(page: Page) {
    super(page);
    this.protocolCard = page.locator('[data-testid="protocol-card"]');
    this.uploadButton = page.locator('button:has-text("Upload Protocol")');
    this.interviewList = page.locator('[data-testid="interview-list"]');
    this.participantList = page.locator('[data-testid="participant-list"]');
  }

  async navigateToDashboard() {
    await this.navigate('/dashboard');
  }

  async uploadProtocol(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await this.page.waitForLoadState('networkidle');
  }

  async selectProtocol(protocolName: string) {
    await this.page.locator(`text=${protocolName}`).click();
  }

  async startInterview() {
    await this.page.locator('button:has-text("Start Interview")').click();
  }
}

/**
 * Interview Page Object
 */
export class InterviewPage extends BasePage {
  readonly stageProgress: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;
  readonly finishButton: Locator;
  readonly canvas: Locator;

  constructor(page: Page) {
    super(page);
    this.stageProgress = page.locator('[data-testid="stage-progress"]');
    this.nextButton = page.locator('button:has-text("Next")');
    this.previousButton = page.locator('button:has-text("Previous")');
    this.finishButton = page.locator('button:has-text("Finish")');
    this.canvas = page.locator('[data-testid="interview-canvas"]');
  }

  async navigateToStage(stageNumber: number) {
    await this.page.locator(`[data-testid="stage-${stageNumber}"]`).click();
  }

  async addNode(nodeName: string) {
    await this.page.locator('[data-testid="add-node-button"]').click();
    await this.page.locator('input[name="name"]').fill(nodeName);
    await this.page.locator('button:has-text("Add")').click();
  }

  async connectNodes(fromNode: string, toNode: string) {
    const from = this.page.locator(`[data-testid="node-${fromNode}"]`);
    const to = this.page.locator(`[data-testid="node-${toNode}"]`);

    await from.dragTo(to);
  }

  async completeInterview() {
    await this.finishButton.click();
    await this.page.locator('button:has-text("Confirm")').click();
  }
}
