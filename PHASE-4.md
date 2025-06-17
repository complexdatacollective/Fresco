# PHASE 4: Visual Testing & Screenshot Management

This phase implements comprehensive visual regression testing using Playwright's screenshot comparison capabilities, ensuring UI consistency and catching visual breakages.

## Prerequisites
- Phase 1, 2, and 3 completed successfully
- Understanding of visual regression testing concepts
- Awareness of cross-browser rendering differences

## Task 4.1: Visual Testing Configuration

**Objective**: Configure Playwright for consistent and reliable visual testing across different environments.

**Steps**:

1. **Update Playwright configuration for visual testing**:
   ```typescript
   // Update playwright.config.ts - add to existing configuration
   export default defineConfig({
     // ... existing configuration
     
     // Visual testing configuration
     expect: {
       // Global screenshot comparison threshold
       toHaveScreenshot: {
         threshold: 0.2,           // 20% threshold for pixel differences
         maxDiffPixels: 1000,      // Maximum number of different pixels allowed
         animationHandling: 'disable', // Disable animations for consistent screenshots
       },
       toMatchSnapshot: {
         threshold: 0.2,
         maxDiffPixels: 1000,
       },
     },
     
     use: {
       // ... existing use configuration
       
       // Force consistent rendering for visual tests
       reducedMotion: 'reduce',
       forcedColors: 'none',
       
       // Ensure consistent screenshot timing
       actionTimeout: 10000,
     },
     
     projects: [
       {
         name: 'chromium-visual',
         use: {
           ...devices['Desktop Chrome'],
           viewport: { width: 1280, height: 720 }, // Fixed viewport for consistency
           deviceScaleFactor: 1, // Consistent pixel density
         },
         testMatch: '**/*.visual.spec.ts',
       },
       {
         name: 'firefox-visual',
         use: {
           ...devices['Desktop Firefox'],
           viewport: { width: 1280, height: 720 },
           deviceScaleFactor: 1,
         },
         testMatch: '**/*.visual.spec.ts',
       },
       {
         name: 'mobile-visual',
         use: {
           ...devices['iPhone 12'],
           viewport: { width: 390, height: 844 },
           deviceScaleFactor: 1,
         },
         testMatch: '**/*.mobile-visual.spec.ts',
       },
       // ... existing projects
     ],
   });
   ```

2. **Create visual testing utilities directory**:
   ```bash
   mkdir -p tests/e2e/utils/visual
   touch tests/e2e/utils/visual/index.ts
   ```

3. **Create visual testing configuration**:
   ```bash
   touch tests/e2e/utils/visual/config.ts
   ```

4. **Add visual testing configuration**:
   ```typescript
   // tests/e2e/utils/visual/config.ts
   
   export interface VisualTestConfig {
     threshold: number;
     maxDiffPixels: number;
     fullPage: boolean;
     clip?: { x: number; y: number; width: number; height: number };
     mask?: string[];
     animations?: 'disabled' | 'allow';
   }
   
   export const defaultVisualConfig: VisualTestConfig = {
     threshold: 0.2,
     maxDiffPixels: 1000,
     fullPage: false,
     animations: 'disabled',
   };
   
   export const strictVisualConfig: VisualTestConfig = {
     threshold: 0.1,
     maxDiffPixels: 100,
     fullPage: false,
     animations: 'disabled',
   };
   
   export const fullPageVisualConfig: VisualTestConfig = {
     threshold: 0.2,
     maxDiffPixels: 2000,
     fullPage: true,
     animations: 'disabled',
   };
   
   export const mobileVisualConfig: VisualTestConfig = {
     threshold: 0.2,
     maxDiffPixels: 500,
     fullPage: false,
     animations: 'disabled',
   };
   
   // Common selectors to mask in screenshots (dynamic content)
   export const commonMasks = [
     '[data-testid="timestamp"]',
     '[data-testid="time-ago"]',
     '[data-testid="loading-spinner"]',
     '.toaster',
     '[data-testid="activity-feed-timestamp"]',
   ];
   
   // Viewport configurations for different test scenarios
   export const viewports = {
     desktop: { width: 1280, height: 720 },
     tablet: { width: 768, height: 1024 },
     mobile: { width: 390, height: 844 },
     wide: { width: 1920, height: 1080 },
   } as const;
   ```

5. **Create visual testing utilities**:
   ```bash
   touch tests/e2e/utils/visual/helpers.ts
   ```

6. **Add visual testing helpers**:
   ```typescript
   // tests/e2e/utils/visual/helpers.ts
   import { Page, Locator, expect } from '@playwright/test';
   import { VisualTestConfig, defaultVisualConfig, commonMasks } from './config';
   
   export class VisualTestHelper {
     private page: Page;
     private config: VisualTestConfig;
   
     constructor(page: Page, config: VisualTestConfig = defaultVisualConfig) {
       this.page = page;
       this.config = config;
     }
   
     /**
      * Wait for page to be ready for screenshot
      */
     async waitForScreenshotReady(): Promise<void> {
       // Wait for network to be idle
       await this.page.waitForLoadState('networkidle');
       
       // Wait for fonts to load
       await this.page.waitForFunction(() => document.fonts.ready);
       
       // Wait for any CSS animations to complete
       if (this.config.animations === 'disabled') {
         await this.page.addStyleTag({
           content: `
             *, *::before, *::after {
               animation-duration: 0s !important;
               animation-delay: 0s !important;
               transition-duration: 0s !important;
               transition-delay: 0s !important;
             }
           `,
         });
       }
       
       // Wait a moment for rendering to stabilize
       await this.page.waitForTimeout(500);
     }
   
     /**
      * Take a screenshot of the entire page
      */
     async screenshotPage(name: string, options?: Partial<VisualTestConfig>): Promise<void> {
       const config = { ...this.config, ...options };
       
       await this.waitForScreenshotReady();
       
       await expect(this.page).toHaveScreenshot(`${name}.png`, {
         fullPage: config.fullPage,
         threshold: config.threshold,
         maxDiffPixels: config.maxDiffPixels,
         mask: config.mask ? config.mask.map(selector => this.page.locator(selector)) : undefined,
         clip: config.clip,
       });
     }
   
     /**
      * Take a screenshot of a specific element
      */
     async screenshotElement(
       selector: string,
       name: string,
       options?: Partial<VisualTestConfig>
     ): Promise<void> {
       const config = { ...this.config, ...options };
       const element = this.page.locator(selector);
       
       await this.waitForScreenshotReady();
       await element.waitFor({ state: 'visible' });
       
       await expect(element).toHaveScreenshot(`${name}.png`, {
         threshold: config.threshold,
         maxDiffPixels: config.maxDiffPixels,
         mask: config.mask ? config.mask.map(sel => this.page.locator(sel)) : undefined,
       });
     }
   
     /**
      * Take screenshots at multiple viewport sizes
      */
     async screenshotResponsive(name: string, viewports: { name: string; width: number; height: number }[]): Promise<void> {
       for (const viewport of viewports) {
         await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
         await this.waitForScreenshotReady();
         
         await expect(this.page).toHaveScreenshot(`${name}-${viewport.name}.png`, {
           fullPage: this.config.fullPage,
           threshold: this.config.threshold,
           maxDiffPixels: this.config.maxDiffPixels,
           mask: this.config.mask ? this.config.mask.map(selector => this.page.locator(selector)) : undefined,
         });
       }
     }
   
     /**
      * Mask dynamic content before taking screenshot
      */
     async maskDynamicContent(additionalMasks: string[] = []): Promise<void> {
       const allMasks = [...commonMasks, ...additionalMasks];
       
       for (const mask of allMasks) {
         try {
           const elements = this.page.locator(mask);
           const count = await elements.count();
           
           for (let i = 0; i < count; i++) {
             await elements.nth(i).evaluate(el => {
               (el as HTMLElement).style.visibility = 'hidden';
             });
           }
         } catch (error) {
           // Ignore if selector doesn't exist
         }
       }
     }
   
     /**
      * Wait for specific elements to be loaded before screenshot
      */
     async waitForElements(selectors: string[]): Promise<void> {
       const promises = selectors.map(selector => 
         this.page.locator(selector).waitFor({ state: 'visible' }).catch(() => {
           // Ignore if element doesn't exist
         })
       );
       
       await Promise.allSettled(promises);
     }
   
     /**
      * Set up consistent state for visual testing
      */
     async setupVisualTestState(): Promise<void> {
       // Disable animations
       await this.page.addStyleTag({
         content: `
           *, *::before, *::after {
             animation-duration: 0s !important;
             animation-delay: 0s !important;
             transition-duration: 0s !important;
             transition-delay: 0s !important;
           }
           
           /* Hide scroll bars for consistent screenshots */
           ::-webkit-scrollbar {
             display: none !important;
           }
           
           /* Ensure consistent font rendering */
           * {
             -webkit-font-smoothing: antialiased;
             -moz-osx-font-smoothing: grayscale;
             font-variant-ligatures: none;
           }
         `,
       });
       
       // Set fixed date for consistent timestamps
       await this.page.addInitScript(() => {
         const mockDate = new Date('2024-01-01T12:00:00Z');
         Date.now = () => mockDate.getTime();
         
         // Mock other time-sensitive functions
         Object.defineProperty(window, 'performance', {
           value: {
             ...window.performance,
             now: () => 0,
           },
         });
       });
     }
   
     /**
      * Compare screenshots with custom configuration
      */
     async compareScreenshot(
       locator: Locator | Page,
       name: string,
       options?: {
         threshold?: number;
         maxDiffPixels?: number;
         mask?: Locator[];
         clip?: { x: number; y: number; width: number; height: number };
       }
     ): Promise<void> {
       await this.waitForScreenshotReady();
       
       if ('url' in locator) {
         // It's a Page
         await expect(locator).toHaveScreenshot(`${name}.png`, options);
       } else {
         // It's a Locator
         await expect(locator).toHaveScreenshot(`${name}.png`, options);
       }
     }
   }
   ```

**Verification**: Test the visual testing utilities with a simple screenshot.

## Task 4.2: Visual Test Fixtures

**Objective**: Create fixtures specifically for visual testing with proper setup and teardown.

**Steps**:

1. **Create visual testing fixtures**:
   ```bash
   touch tests/e2e/fixtures/visual.ts
   ```

2. **Add visual testing fixtures**:
   ```typescript
   // tests/e2e/fixtures/visual.ts
   import { test as base } from '@playwright/test';
   import { test as pageTest } from './pages';
   import { VisualTestHelper } from '../utils/visual/helpers';
   import { 
     defaultVisualConfig, 
     strictVisualConfig, 
     fullPageVisualConfig,
     mobileVisualConfig,
     viewports 
   } from '../utils/visual/config';
   
   export interface VisualFixtures {
     visualHelper: VisualTestHelper;
     visualHelperStrict: VisualTestHelper;
     visualHelperFullPage: VisualTestHelper;
     visualHelperMobile: VisualTestHelper;
     setupVisualTest: () => Promise<void>;
   }
   
   export const test = pageTest.extend<VisualFixtures>({
     // Default visual helper
     visualHelper: async ({ page }, use) => {
       const helper = new VisualTestHelper(page, defaultVisualConfig);
       await helper.setupVisualTestState();
       await use(helper);
     },
   
     // Strict visual helper (lower tolerance)
     visualHelperStrict: async ({ page }, use) => {
       const helper = new VisualTestHelper(page, strictVisualConfig);
       await helper.setupVisualTestState();
       await use(helper);
     },
   
     // Full page visual helper
     visualHelperFullPage: async ({ page }, use) => {
       const helper = new VisualTestHelper(page, fullPageVisualConfig);
       await helper.setupVisualTestState();
       await use(helper);
     },
   
     // Mobile visual helper
     visualHelperMobile: async ({ page }, use) => {
       await page.setViewportSize(viewports.mobile);
       const helper = new VisualTestHelper(page, mobileVisualConfig);
       await helper.setupVisualTestState();
       await use(helper);
     },
   
     // Setup function for visual tests
     setupVisualTest: async ({ page }, use) => {
       const setup = async () => {
         // Set consistent viewport
         await page.setViewportSize(viewports.desktop);
         
         // Set up visual test state
         const helper = new VisualTestHelper(page);
         await helper.setupVisualTestState();
         
         // Clear any existing local storage
         await page.evaluate(() => {
           localStorage.clear();
           sessionStorage.clear();
         });
       };
       
       await use(setup);
     },
   });
   
   export { expect } from '@playwright/test';
   ```

3. **Create component-specific visual fixtures**:
   ```bash
   touch tests/e2e/fixtures/component-visual.ts
   ```

4. **Add component visual fixtures**:
   ```typescript
   // tests/e2e/fixtures/component-visual.ts
   import { test as base } from '@playwright/test';
   import { test as visualTest } from './visual';
   
   export interface ComponentVisualFixtures {
     screenshotComponent: (selector: string, name: string) => Promise<void>;
     screenshotTable: (name: string) => Promise<void>;
     screenshotModal: (name: string) => Promise<void>;
     screenshotForm: (selector: string, name: string) => Promise<void>;
     screenshotNavigation: (name: string) => Promise<void>;
   }
   
   export const test = visualTest.extend<ComponentVisualFixtures>({
     screenshotComponent: async ({ visualHelper }, use) => {
       const screenshotComponent = async (selector: string, name: string) => {
         await visualHelper.screenshotElement(selector, name);
       };
       await use(screenshotComponent);
     },
   
     screenshotTable: async ({ visualHelper }, use) => {
       const screenshotTable = async (name: string) => {
         const tableSelector = '[data-testid="data-table"]';
         await visualHelper.waitForElements([tableSelector]);
         await visualHelper.screenshotElement(tableSelector, `table-${name}`);
       };
       await use(screenshotTable);
     },
   
     screenshotModal: async ({ visualHelper }, use) => {
       const screenshotModal = async (name: string) => {
         const modalSelector = '[data-testid="modal"]';
         await visualHelper.waitForElements([modalSelector]);
         await visualHelper.screenshotElement(modalSelector, `modal-${name}`);
       };
       await use(screenshotModal);
     },
   
     screenshotForm: async ({ visualHelper }, use) => {
       const screenshotForm = async (selector: string, name: string) => {
         await visualHelper.waitForElements([selector]);
         await visualHelper.screenshotElement(selector, `form-${name}`);
       };
       await use(screenshotForm);
     },
   
     screenshotNavigation: async ({ visualHelper }, use) => {
       const screenshotNavigation = async (name: string) => {
         const navSelector = '[data-testid="navigation-bar"]';
         await visualHelper.waitForElements([navSelector]);
         await visualHelper.screenshotElement(navSelector, `nav-${name}`);
       };
       await use(screenshotNavigation);
     },
   });
   
   export { expect } from '@playwright/test';
   ```

**Verification**: Create simple visual test using the fixtures.

## Task 4.3: Dashboard Visual Tests

**Objective**: Create comprehensive visual tests for all dashboard routes and components.

**Steps**:

1. **Create dashboard visual tests directory**:
   ```bash
   mkdir -p tests/e2e/visual/dashboard
   touch tests/e2e/visual/dashboard/overview.visual.spec.ts
   ```

2. **Add dashboard overview visual tests**:
   ```typescript
   // tests/e2e/visual/dashboard/overview.visual.spec.ts
   import { test, expect } from '../../fixtures/visual';
   
   test.describe('Dashboard Overview - Visual Tests', () => {
     test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
       await setupVisualTest();
     });
   
     test('should render dashboard overview correctly', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.goto();
       await dashboardPage.verifyOnDashboard();
       
       // Wait for all dashboard components to load
       await visualHelper.waitForElements([
         '[data-testid="summary-statistics"]',
         '[data-testid="activity-feed"]',
         '[data-testid="navigation-bar"]',
       ]);
       
       // Mask dynamic content
       await visualHelper.maskDynamicContent([
         '[data-testid="activity-feed-timestamp"]',
         '[data-testid="last-updated"]',
       ]);
       
       // Take full page screenshot
       await visualHelper.screenshotPage('dashboard-overview');
     });
   
     test('should render summary statistics correctly', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.goto();
       
       await visualHelper.waitForElements(['[data-testid="summary-statistics"]']);
       await visualHelper.screenshotElement(
         '[data-testid="summary-statistics"]', 
         'dashboard-summary-stats'
       );
     });
   
     test('should render activity feed correctly', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.goto();
       
       await visualHelper.waitForElements(['[data-testid="activity-feed"]']);
       
       // Mask timestamps in activity feed
       await visualHelper.maskDynamicContent(['[data-testid="activity-timestamp"]']);
       
       await visualHelper.screenshotElement(
         '[data-testid="activity-feed"]', 
         'dashboard-activity-feed'
       );
     });
   
     test('should render navigation correctly', async ({ 
       authenticatedPage, 
       dashboardPage, 
       screenshotNavigation 
     }) => {
       await dashboardPage.goto();
       await screenshotNavigation('dashboard');
     });
   
     test('should render dashboard in different viewport sizes', async ({ 
       page, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.goto();
       
       const viewportSizes = [
         { name: 'desktop', width: 1280, height: 720 },
         { name: 'tablet', width: 768, height: 1024 },
         { name: 'mobile', width: 390, height: 844 },
       ];
       
       await visualHelper.screenshotResponsive('dashboard-responsive', viewportSizes);
     });
   });
   ```

3. **Create protocols visual tests**:
   ```bash
   touch tests/e2e/visual/dashboard/protocols.visual.spec.ts
   ```

4. **Add protocols visual tests**:
   ```typescript
   // tests/e2e/visual/dashboard/protocols.visual.spec.ts
   import { test, expect } from '../../fixtures/component-visual';
   
   test.describe('Protocols Page - Visual Tests', () => {
     test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
       await setupVisualTest();
     });
   
     test('should render protocols table correctly', async ({ 
       authenticatedPage, 
       dashboardPage, 
       screenshotTable 
     }) => {
       await dashboardPage.navigateToProtocols();
       await screenshotTable('protocols');
     });
   
     test('should render protocols page layout', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToProtocols();
       
       await visualHelper.waitForElements([
         '[data-testid="protocols-table"]',
         '[data-testid="add-protocol-button"]',
         '[data-testid="table-search"]',
       ]);
       
       await visualHelper.screenshotPage('protocols-page');
     });
   
     test('should render protocol actions dropdown', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToProtocols();
       
       // Open actions dropdown for first protocol
       await authenticatedPage.click('[data-testid="protocols-table"] tbody tr:first-child [data-testid="actions-dropdown"]');
       
       await visualHelper.waitForElements(['[data-testid="dropdown-menu"]']);
       await visualHelper.screenshotElement('[data-testid="dropdown-menu"]', 'protocol-actions-dropdown');
     });
   
     test('should render add protocol modal', async ({ 
       authenticatedPage, 
       dashboardPage, 
       screenshotModal 
     }) => {
       await dashboardPage.navigateToProtocols();
       
       await authenticatedPage.click('[data-testid="add-protocol-button"]');
       await screenshotModal('add-protocol');
     });
   
     test('should render protocol table with search results', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToProtocols();
       
       // Search for specific protocol
       await authenticatedPage.fill('[data-testid="table-search"]', 'Test Protocol 1');
       await authenticatedPage.waitForTimeout(500); // Wait for search debounce
       
       await visualHelper.screenshotElement('[data-testid="protocols-table"]', 'protocols-table-search');
     });
   
     test('should render empty protocols state', async ({ 
       cleanDatabase, 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await cleanDatabase();
       await dashboardPage.navigateToProtocols();
       
       await visualHelper.waitForElements(['[data-testid="empty-state"]']);
       await visualHelper.screenshotPage('protocols-empty-state');
     });
   });
   ```

5. **Create participants visual tests**:
   ```bash
   touch tests/e2e/visual/dashboard/participants.visual.spec.ts
   ```

6. **Add participants visual tests**:
   ```typescript
   // tests/e2e/visual/dashboard/participants.visual.spec.ts
   import { test, expect } from '../../fixtures/component-visual';
   
   test.describe('Participants Page - Visual Tests', () => {
     test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
       await setupVisualTest();
     });
   
     test('should render participants table correctly', async ({ 
       authenticatedPage, 
       dashboardPage, 
       screenshotTable 
     }) => {
       await dashboardPage.navigateToParticipants();
       await screenshotTable('participants');
     });
   
     test('should render participants page layout', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToParticipants();
       
       await visualHelper.waitForElements([
         '[data-testid="participants-table"]',
         '[data-testid="add-participant-button"]',
         '[data-testid="import-csv-button"]',
       ]);
       
       await visualHelper.screenshotPage('participants-page');
     });
   
     test('should render add participant modal', async ({ 
       authenticatedPage, 
       dashboardPage, 
       screenshotModal 
     }) => {
       await dashboardPage.navigateToParticipants();
       
       await authenticatedPage.click('[data-testid="add-participant-button"]');
       await screenshotModal('add-participant');
     });
   
     test('should render import CSV modal', async ({ 
       authenticatedPage, 
       dashboardPage, 
       screenshotModal 
     }) => {
       await dashboardPage.navigateToParticipants();
       
       await authenticatedPage.click('[data-testid="import-csv-button"]');
       await screenshotModal('import-csv');
     });
   
     test('should render participant URL generation modal', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToParticipants();
       
       // Open actions dropdown and click generate URL
       await authenticatedPage.click('[data-testid="participants-table"] tbody tr:first-child [data-testid="actions-dropdown"]');
       await authenticatedPage.click('[data-testid="generate-url-action"]');
       
       await visualHelper.waitForElements(['[data-testid="modal"]']);
       await visualHelper.screenshotElement('[data-testid="modal"]', 'participant-url-modal');
     });
   
     test('should render participants table pagination', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToParticipants();
       
       await visualHelper.waitForElements(['[data-testid="pagination"]']);
       await visualHelper.screenshotElement('[data-testid="pagination"]', 'participants-pagination');
     });
   });
   ```

7. **Create interviews visual tests**:
   ```bash
   touch tests/e2e/visual/dashboard/interviews.visual.spec.ts
   ```

8. **Add interviews visual tests**:
   ```typescript
   // tests/e2e/visual/dashboard/interviews.visual.spec.ts
   import { test, expect } from '../../fixtures/component-visual';
   
   test.describe('Interviews Page - Visual Tests', () => {
     test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
       await setupVisualTest();
     });
   
     test('should render interviews table correctly', async ({ 
       authenticatedPage, 
       dashboardPage, 
       screenshotTable 
     }) => {
       await dashboardPage.navigateToInterviews();
       await screenshotTable('interviews');
     });
   
     test('should render interviews page layout', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToInterviews();
       
       await visualHelper.waitForElements([
         '[data-testid="interviews-table"]',
         '[data-testid="export-interviews-button"]',
         '[data-testid="filter-button"]',
       ]);
       
       await visualHelper.screenshotPage('interviews-page');
     });
   
     test('should render interview status indicators', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToInterviews();
       
       await visualHelper.waitForElements(['[data-testid="status-badge"]']);
       await visualHelper.screenshotElement(
         '[data-testid="interviews-table"] tbody tr:first-child [data-testid="status-badge"]',
         'interview-status-badge'
       );
     });
   
     test('should render export interviews modal', async ({ 
       authenticatedPage, 
       dashboardPage, 
       screenshotModal 
     }) => {
       await dashboardPage.navigateToInterviews();
       
       await authenticatedPage.click('[data-testid="export-interviews-button"]');
       await screenshotModal('export-interviews');
     });
   
     test('should render interview network summary', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToInterviews();
       
       // Click on an interview to see network summary
       await authenticatedPage.click('[data-testid="interviews-table"] tbody tr:first-child [data-testid="view-network"]');
       
       await visualHelper.waitForElements(['[data-testid="network-summary"]']);
       await visualHelper.screenshotElement('[data-testid="network-summary"]', 'interview-network-summary');
     });
   
     test('should render interviews filter panel', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToInterviews();
       
       await authenticatedPage.click('[data-testid="filter-button"]');
       
       await visualHelper.waitForElements(['[data-testid="filter-panel"]']);
       await visualHelper.screenshotElement('[data-testid="filter-panel"]', 'interviews-filter-panel');
     });
   });
   ```

9. **Create settings visual tests**:
   ```bash
   touch tests/e2e/visual/dashboard/settings.visual.spec.ts
   ```

10. **Add settings visual tests**:
    ```typescript
    // tests/e2e/visual/dashboard/settings.visual.spec.ts
    import { test, expect } from '../../fixtures/component-visual';
    
    test.describe('Settings Page - Visual Tests', () => {
      test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
        await setupVisualTest();
      });
    
      test('should render settings page layout', async ({ 
        authenticatedPage, 
        dashboardPage, 
        visualHelper 
      }) => {
        await dashboardPage.navigateToSettings();
        
        await visualHelper.waitForElements([
          '[data-testid="settings-form"]',
          '[data-testid="settings-sections"]',
        ]);
        
        await visualHelper.screenshotPage('settings-page');
      });
    
      test('should render settings form sections', async ({ 
        authenticatedPage, 
        dashboardPage, 
        visualHelper 
      }) => {
        await dashboardPage.navigateToSettings();
        
        const sections = [
          'general-settings',
          'uploadthing-settings',
          'analytics-settings',
          'advanced-settings',
        ];
        
        for (const section of sections) {
          await visualHelper.screenshotElement(
            `[data-testid="${section}"]`,
            `settings-${section}`
          );
        }
      });
    
      test('should render uploadthing token form', async ({ 
        authenticatedPage, 
        dashboardPage, 
        screenshotForm 
      }) => {
        await dashboardPage.navigateToSettings();
        await screenshotForm('[data-testid="uploadthing-form"]', 'uploadthing-token');
      });
    
      test('should render analytics settings switches', async ({ 
        authenticatedPage, 
        dashboardPage, 
        visualHelper 
      }) => {
        await dashboardPage.navigateToSettings();
        
        await visualHelper.screenshotElement(
          '[data-testid="analytics-settings"]',
          'analytics-settings-switches'
        );
      });
    
      test('should render settings save confirmation', async ({ 
        authenticatedPage, 
        dashboardPage, 
        visualHelper 
      }) => {
        await dashboardPage.navigateToSettings();
        
        // Make a change to trigger save state
        await authenticatedPage.click('[data-testid="disable-analytics-switch"]');
        
        await visualHelper.waitForElements(['[data-testid="save-button"]']);
        await visualHelper.screenshotElement('[data-testid="save-button"]', 'settings-save-button');
      });
    });
    ```

**Verification**: Run the dashboard visual tests to ensure they capture screenshots correctly.

## Task 4.4: Setup Route Visual Tests

**Objective**: Create visual tests for the setup/onboarding flow.

**Steps**:

1. **Create setup visual tests directory**:
   ```bash
   mkdir -p tests/e2e/visual/setup
   touch tests/e2e/visual/setup/onboarding.visual.spec.ts
   ```

2. **Add setup onboarding visual tests**:
   ```typescript
   // tests/e2e/visual/setup/onboarding.visual.spec.ts
   import { test, expect } from '../../fixtures/visual';
   
   test.describe('Setup Onboarding - Visual Tests', () => {
     test.beforeEach(async ({ setupData, setupVisualTest }) => {
       await setupVisualTest();
     });
   
     test('should render initial setup page', async ({ 
       page, 
       setupPage, 
       visualHelper 
     }) => {
       await setupPage.goto();
       
       await visualHelper.waitForElements([
         '[data-testid="setup-steps"]',
         '[data-testid="current-step"]',
       ]);
       
       await visualHelper.screenshotPage('setup-initial');
     });
   
     test('should render create account step', async ({ 
       page, 
       setupPage, 
       screenshotForm 
     }) => {
       await setupPage.goto();
       
       await screenshotForm('[data-testid="create-account-form"]', 'create-account');
     });
   
     test('should render uploadthing configuration step', async ({ 
       page, 
       setupPage, 
       visualHelper 
     }) => {
       await setupPage.goto();
       
       // Navigate to uploadthing step
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       
       await visualHelper.waitForElements(['[data-testid="uploadthing-form"]']);
       await visualHelper.screenshotPage('setup-uploadthing');
     });
   
     test('should render protocol upload step', async ({ 
       page, 
       setupPage, 
       visualHelper 
     }) => {
       await setupPage.goto();
       
       // Navigate through steps to protocol upload
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       await setupPage.configureUploadThing('test-token');
       await setupPage.clickNext();
       
       await visualHelper.waitForElements(['[data-testid="protocol-upload-form"]']);
       await visualHelper.screenshotPage('setup-protocol-upload');
     });
   
     test('should render setup progress indicator', async ({ 
       page, 
       setupPage, 
       visualHelper 
     }) => {
       await setupPage.goto();
       
       await visualHelper.screenshotElement(
         '[data-testid="setup-steps"]',
         'setup-progress-step-1'
       );
       
       // Move to next step and screenshot progress
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       
       await visualHelper.screenshotElement(
         '[data-testid="setup-steps"]',
         'setup-progress-step-2'
       );
     });
   
     test('should render setup completion', async ({ 
       page, 
       setupPage, 
       visualHelper,
       fileHelper 
     }) => {
       await setupPage.goto();
       
       // Complete entire setup flow
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       await setupPage.configureUploadThing('test-token');
       await setupPage.clickNext();
       
       const protocolFile = fileHelper.createTestProtocolFile();
       await setupPage.uploadProtocol(protocolFile);
       await setupPage.clickNext();
       
       await visualHelper.waitForElements(['[data-testid="setup-complete"]']);
       await visualHelper.screenshotPage('setup-complete');
     });
   
     test('should render setup error states', async ({ 
       page, 
       setupPage, 
       visualHelper 
     }) => {
       await setupPage.goto();
       
       // Try to create account with invalid data
       await setupPage.fillAccountDetails('', 'short');
       await setupPage.submitAccountForm();
       
       await visualHelper.waitForElements(['[data-testid="form-error"]']);
       await visualHelper.screenshotPage('setup-account-errors');
     });
   });
   ```

3. **Create signin visual tests**:
   ```bash
   touch tests/e2e/visual/setup/signin.visual.spec.ts
   ```

4. **Add signin visual tests**:
   ```typescript
   // tests/e2e/visual/setup/signin.visual.spec.ts
   import { test, expect } from '../../fixtures/visual';
   
   test.describe('Signin Page - Visual Tests', () => {
     test.beforeEach(async ({ basicData, setupVisualTest }) => {
       await setupVisualTest();
     });
   
     test('should render signin page layout', async ({ 
       signinPage, 
       visualHelper 
     }) => {
       await signinPage.goto();
       await visualHelper.screenshotPage('signin-page');
     });
   
     test('should render signin form', async ({ 
       signinPage, 
       screenshotForm 
     }) => {
       await signinPage.goto();
       await screenshotForm('form', 'signin-form');
     });
   
     test('should render signin form with validation errors', async ({ 
       signinPage, 
       visualHelper 
     }) => {
       await signinPage.goto();
       
       // Try to login with empty fields
       await signinPage.clickSubmit();
       
       await visualHelper.waitForElements(['[data-testid="form-error"]']);
       await visualHelper.screenshotPage('signin-validation-errors');
     });
   
     test('should render signin form with invalid credentials error', async ({ 
       signinPage, 
       visualHelper 
     }) => {
       await signinPage.goto();
       
       await signinPage.login('invalid-user', 'invalid-password');
       
       await visualHelper.waitForElements(['[data-testid="error-message"]']);
       await visualHelper.screenshotPage('signin-invalid-credentials');
     });
   
     test('should render signin page on mobile', async ({ 
       page, 
       signinPage, 
       visualHelperMobile 
     }) => {
       await signinPage.goto();
       await visualHelperMobile.screenshotPage('signin-mobile');
     });
   });
   ```

**Verification**: Run setup visual tests to ensure they capture the onboarding flow correctly.

## Task 4.5: Component Visual Tests

**Objective**: Create visual tests for reusable UI components.

**Steps**:

1. **Create components visual tests directory**:
   ```bash
   mkdir -p tests/e2e/visual/components
   touch tests/e2e/visual/components/data-table.visual.spec.ts
   ```

2. **Add data table visual tests**:
   ```typescript
   // tests/e2e/visual/components/data-table.visual.spec.ts
   import { test, expect } from '../../fixtures/component-visual';
   
   test.describe('Data Table Component - Visual Tests', () => {
     test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
       await setupVisualTest();
     });
   
     test('should render data table with data', async ({ 
       authenticatedPage, 
       dashboardPage, 
       screenshotTable 
     }) => {
       await dashboardPage.navigateToProtocols();
       await screenshotTable('with-data');
     });
   
     test('should render empty data table', async ({ 
       cleanDatabase, 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await cleanDatabase();
       await dashboardPage.navigateToProtocols();
       
       await visualHelper.waitForElements(['[data-testid="empty-state"]']);
       await visualHelper.screenshotElement('[data-testid="data-table"]', 'table-empty-state');
     });
   
     test('should render data table loading state', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       // Intercept API to delay response
       await authenticatedPage.route('**/api/protocols', route => {
         setTimeout(() => route.continue(), 2000);
       });
       
       await dashboardPage.navigateToProtocols();
       
       await visualHelper.waitForElements(['[data-testid="loading-spinner"]']);
       await visualHelper.screenshotElement('[data-testid="data-table"]', 'table-loading');
     });
   
     test('should render data table with search active', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToProtocols();
       
       await authenticatedPage.fill('[data-testid="table-search"]', 'Test Protocol');
       await authenticatedPage.waitForTimeout(500);
       
       await visualHelper.screenshotElement('[data-testid="data-table"]', 'table-with-search');
     });
   
     test('should render data table pagination states', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToParticipants(); // Has more data for pagination
       
       const paginationStates = ['first-page', 'middle-page', 'last-page'];
       
       // First page
       await visualHelper.screenshotElement('[data-testid="pagination"]', 'pagination-first-page');
       
       // Go to next page if available
       const nextButton = authenticatedPage.locator('[data-testid="pagination-next"]');
       if (await nextButton.isEnabled()) {
         await nextButton.click();
         await visualHelper.screenshotElement('[data-testid="pagination"]', 'pagination-middle-page');
       }
     });
   
     test('should render data table sorting indicators', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToProtocols();
       
       // Click on sortable column header
       await authenticatedPage.click('[data-testid="data-table"] th:first-child');
       
       await visualHelper.screenshotElement(
         '[data-testid="data-table"] thead',
         'table-header-sorted'
       );
     });
   });
   ```

3. **Create modal component visual tests**:
   ```bash
   touch tests/e2e/visual/components/modal.visual.spec.ts
   ```

4. **Add modal visual tests**:
   ```typescript
   // tests/e2e/visual/components/modal.visual.spec.ts
   import { test, expect } from '../../fixtures/component-visual';
   
   test.describe('Modal Component - Visual Tests', () => {
     test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
       await setupVisualTest();
     });
   
     test('should render basic modal', async ({ 
       authenticatedPage, 
       dashboardPage, 
       screenshotModal 
     }) => {
       await dashboardPage.navigateToParticipants();
       await authenticatedPage.click('[data-testid="add-participant-button"]');
       await screenshotModal('basic');
     });
   
     test('should render confirmation modal', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToProtocols();
       
       // Open actions dropdown and click delete
       await authenticatedPage.click('[data-testid="protocols-table"] tbody tr:first-child [data-testid="actions-dropdown"]');
       await authenticatedPage.click('[data-testid="delete-action"]');
       
       await visualHelper.waitForElements(['[data-testid="confirmation-modal"]']);
       await visualHelper.screenshotElement('[data-testid="confirmation-modal"]', 'modal-confirmation');
     });
   
     test('should render modal with form validation errors', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToParticipants();
       await authenticatedPage.click('[data-testid="add-participant-button"]');
       
       // Try to submit empty form
       await authenticatedPage.click('[data-testid="modal-confirm"]');
       
       await visualHelper.waitForElements(['[data-testid="form-error"]']);
       await visualHelper.screenshotElement('[data-testid="modal"]', 'modal-form-errors');
     });
   
     test('should render modal on different screen sizes', async ({ 
       page, 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToParticipants();
       await authenticatedPage.click('[data-testid="add-participant-button"]');
       
       const viewportSizes = [
         { name: 'desktop', width: 1280, height: 720 },
         { name: 'tablet', width: 768, height: 1024 },
         { name: 'mobile', width: 390, height: 844 },
       ];
       
       await visualHelper.screenshotResponsive('modal-responsive', viewportSizes);
     });
   });
   ```

5. **Create form component visual tests**:
   ```bash
   touch tests/e2e/visual/components/form.visual.spec.ts
   ```

6. **Add form visual tests**:
   ```typescript
   // tests/e2e/visual/components/form.visual.spec.ts
   import { test, expect } from '../../fixtures/component-visual';
   
   test.describe('Form Component - Visual Tests', () => {
     test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
       await setupVisualTest();
     });
   
     test('should render basic form fields', async ({ 
       authenticatedPage, 
       dashboardPage, 
       screenshotForm 
     }) => {
       await dashboardPage.navigateToParticipants();
       await authenticatedPage.click('[data-testid="add-participant-button"]');
       await screenshotForm('[data-testid="participant-form"]', 'basic-fields');
     });
   
     test('should render form with validation errors', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToParticipants();
       await authenticatedPage.click('[data-testid="add-participant-button"]');
       
       // Submit empty form to trigger validation
       await authenticatedPage.click('[data-testid="modal-confirm"]');
       
       await visualHelper.waitForElements(['[data-testid="field-error"]']);
       await visualHelper.screenshotElement('[data-testid="participant-form"]', 'form-validation-errors');
     });
   
     test('should render form field states', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToSettings();
       
       const fieldStates = [
         { state: 'default', action: () => {} },
         { state: 'focused', action: () => authenticatedPage.focus('[name="uploadThingToken"]') },
         { state: 'filled', action: () => authenticatedPage.fill('[name="uploadThingToken"]', 'test-value') },
       ];
       
       for (const { state, action } of fieldStates) {
         await action();
         await visualHelper.screenshotElement(
           '[name="uploadThingToken"]',
           `form-field-${state}`
         );
       }
     });
   
     test('should render form success state', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.navigateToSettings();
       
       // Make a change and save
       await authenticatedPage.fill('[name="uploadThingToken"]', 'new-test-token');
       await authenticatedPage.click('[data-testid="save-button"]');
       
       await visualHelper.waitForElements(['[data-testid="success-message"]']);
       await visualHelper.screenshotElement('[data-testid="settings-form"]', 'form-success-state');
     });
   });
   ```

7. **Create navigation component visual tests**:
   ```bash
   touch tests/e2e/visual/components/navigation.visual.spec.ts
   ```

8. **Add navigation visual tests**:
   ```typescript
   // tests/e2e/visual/components/navigation.visual.spec.ts
   import { test, expect } from '../../fixtures/component-visual';
   
   test.describe('Navigation Component - Visual Tests', () => {
     test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
       await setupVisualTest();
     });
   
     test('should render main navigation', async ({ 
       authenticatedPage, 
       dashboardPage, 
       screenshotNavigation 
     }) => {
       await dashboardPage.goto();
       await screenshotNavigation('main');
     });
   
     test('should render navigation with active states', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       const navItems = ['protocols', 'participants', 'interviews', 'settings'];
       
       for (const item of navItems) {
         await authenticatedPage.click(`[data-testid="${item}-tab"]`);
         await visualHelper.screenshotElement(
           '[data-testid="navigation-bar"]',
           `navigation-${item}-active`
         );
       }
     });
   
     test('should render user menu', async ({ 
       authenticatedPage, 
       dashboardPage, 
       visualHelper 
     }) => {
       await dashboardPage.goto();
       
       await authenticatedPage.click('[data-testid="user-menu"]');
       
       await visualHelper.waitForElements(['[data-testid="user-menu-dropdown"]']);
       await visualHelper.screenshotElement('[data-testid="user-menu-dropdown"]', 'navigation-user-menu');
     });
   
     test('should render navigation on mobile', async ({ 
       page, 
       authenticatedPage, 
       dashboardPage, 
       visualHelperMobile 
     }) => {
       await dashboardPage.goto();
       await visualHelperMobile.screenshotElement('[data-testid="navigation-bar"]', 'navigation-mobile');
     });
   });
   ```

**Verification**: Run component visual tests to ensure they capture all component states correctly.

## Task 4.6: Visual Test Management

**Objective**: Create utilities for managing visual test baselines and handling updates.

**Steps**:

1. **Create visual test management utilities**:
   ```bash
   touch tests/e2e/utils/visual/management.ts
   ```

2. **Add visual test management**:
   ```typescript
   // tests/e2e/utils/visual/management.ts
   import { exec } from 'child_process';
   import { promisify } from 'util';
   import path from 'path';
   import fs from 'fs';
   
   const execAsync = promisify(exec);
   
   export class VisualTestManager {
     private static screenshotsDir = path.join(process.cwd(), 'tests/e2e');
   
     /**
      * Update visual test baselines
      */
     static async updateBaselines(testPattern?: string): Promise<void> {
       const command = `npx playwright test ${testPattern || '**/*.visual.spec.ts'} --update-snapshots`;
       
       try {
         const { stdout, stderr } = await execAsync(command);
         console.log('Updated visual baselines:', stdout);
         if (stderr) console.error('Update warnings:', stderr);
       } catch (error) {
         console.error('Failed to update baselines:', error);
         throw error;
       }
     }
   
     /**
      * Generate visual test report
      */
     static async generateVisualReport(): Promise<void> {
       const command = 'npx playwright show-report';
       
       try {
         await execAsync(command);
       } catch (error) {
         console.error('Failed to generate visual report:', error);
         throw error;
       }
     }
   
     /**
      * Clean up old visual test artifacts
      */
     static async cleanupVisualArtifacts(olderThanDays: number = 7): Promise<void> {
       const testResultsDir = path.join(this.screenshotsDir, 'test-results');
       const cutoffDate = new Date();
       cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
   
       if (!fs.existsSync(testResultsDir)) {
         return;
       }
   
       const files = fs.readdirSync(testResultsDir);
       let cleanedCount = 0;
   
       for (const file of files) {
         const filePath = path.join(testResultsDir, file);
         const stat = fs.statSync(filePath);
         
         if (stat.mtime < cutoffDate) {
           if (stat.isDirectory()) {
             fs.rmSync(filePath, { recursive: true });
           } else {
             fs.unlinkSync(filePath);
           }
           cleanedCount++;
         }
       }
   
       console.log(`Cleaned up ${cleanedCount} old visual test artifacts`);
     }
   
     /**
      * Compare visual test results between runs
      */
     static async compareVisualResults(baselinePath: string, currentPath: string): Promise<{
       totalTests: number;
       passedTests: number;
       failedTests: number;
       failedTestDetails: string[];
     }> {
       // This would integrate with Playwright's visual comparison results
       // For now, we'll return a mock structure
       return {
         totalTests: 0,
         passedTests: 0,
         failedTests: 0,
         failedTestDetails: [],
       };
     }
   
     /**
      * Get visual test statistics
      */
     static async getVisualTestStats(): Promise<{
       totalScreenshots: number;
       screenshotsByCategory: Record<string, number>;
       lastUpdated: Date | null;
     }> {
       const screenshotsDir = path.join(this.screenshotsDir);
       let totalScreenshots = 0;
       const screenshotsByCategory: Record<string, number> = {};
       let lastUpdated: Date | null = null;
   
       const walkDir = (dir: string, category: string = '') => {
         if (!fs.existsSync(dir)) return;
         
         const files = fs.readdirSync(dir);
         
         for (const file of files) {
           const filePath = path.join(dir, file);
           const stat = fs.statSync(filePath);
           
           if (stat.isDirectory()) {
             walkDir(filePath, file);
           } else if (file.endsWith('.png')) {
             totalScreenshots++;
             
             if (category) {
               screenshotsByCategory[category] = (screenshotsByCategory[category] || 0) + 1;
             }
             
             if (!lastUpdated || stat.mtime > lastUpdated) {
               lastUpdated = stat.mtime;
             }
           }
         }
       };
   
       walkDir(screenshotsDir);
   
       return {
         totalScreenshots,
         screenshotsByCategory,
         lastUpdated,
       };
     }
   
     /**
      * Validate visual test setup
      */
     static async validateSetup(): Promise<{
       isValid: boolean;
       issues: string[];
       suggestions: string[];
     }> {
       const issues: string[] = [];
       const suggestions: string[] = [];
   
       // Check if Playwright is configured for visual testing
       const configPath = path.join(process.cwd(), 'playwright.config.ts');
       if (!fs.existsSync(configPath)) {
         issues.push('Playwright configuration not found');
       }
   
       // Check if visual test utilities exist
       const visualUtilsPath = path.join(this.screenshotsDir, 'utils/visual');
       if (!fs.existsSync(visualUtilsPath)) {
         issues.push('Visual test utilities not found');
       }
   
       // Check if browsers are installed
       try {
         await execAsync('npx playwright --version');
       } catch (error) {
         issues.push('Playwright browsers not installed');
         suggestions.push('Run: npx playwright install');
       }
   
       return {
         isValid: issues.length === 0,
         issues,
         suggestions,
       };
     }
   }
   ```

3. **Create visual test scripts**:
   ```bash
   mkdir -p scripts/visual
   touch scripts/visual/update-baselines.sh
   chmod +x scripts/visual/update-baselines.sh
   ```

4. **Add baseline update script**:
   ```bash
   #!/bin/bash
   # scripts/visual/update-baselines.sh
   
   set -e
   
   echo "🖼️  Updating visual test baselines..."
   
   # Parse command line arguments
   TEST_PATTERN=""
   BROWSER="chromium"
   
   while [[ $# -gt 0 ]]; do
     case $1 in
       --pattern)
         TEST_PATTERN="$2"
         shift 2
         ;;
       --browser)
         BROWSER="$2"
         shift 2
         ;;
       --help)
         echo "Usage: $0 [--pattern <test-pattern>] [--browser <browser>]"
         echo "  --pattern: Test file pattern (e.g., '**/dashboard/*.visual.spec.ts')"
         echo "  --browser: Browser to use (chromium, firefox, webkit)"
         exit 0
         ;;
       *)
         echo "Unknown option: $1"
         exit 1
         ;;
     esac
   done
   
   # Set default pattern if not provided
   if [ -z "$TEST_PATTERN" ]; then
     TEST_PATTERN="**/*.visual.spec.ts"
   fi
   
   echo "📋 Pattern: $TEST_PATTERN"
   echo "🌐 Browser: $BROWSER"
   
   # Ensure test database is running
   echo "🚀 Setting up test environment..."
   ./scripts/test/setup-test-db.sh
   
   # Update snapshots
   echo "📸 Updating screenshots..."
   npx playwright test "$TEST_PATTERN" --project="$BROWSER-visual" --update-snapshots
   
   # Show results
   echo "✅ Visual baselines updated successfully!"
   echo "📊 Review changes with: git diff"
   echo "🎭 Open test report with: npx playwright show-report"
   ```

5. **Create visual test validation script**:
   ```bash
   touch scripts/visual/validate-setup.sh
   chmod +x scripts/visual/validate-setup.sh
   ```

6. **Add validation script**:
   ```bash
   #!/bin/bash
   # scripts/visual/validate-setup.sh
   
   set -e
   
   echo "🔍 Validating visual test setup..."
   
   # Check Playwright installation
   if ! command -v npx &> /dev/null; then
     echo "❌ npx not found - please install Node.js"
     exit 1
   fi
   
   # Check Playwright
   if ! npx playwright --version &> /dev/null; then
     echo "❌ Playwright not installed"
     echo "💡 Run: npx playwright install"
     exit 1
   fi
   
   # Check browsers
   echo "🌐 Checking browser installations..."
   npx playwright install --with-deps
   
   # Check configuration
   if [ ! -f "playwright.config.ts" ]; then
     echo "❌ Playwright configuration not found"
     exit 1
   fi
   
   # Check visual test utilities
   if [ ! -d "tests/e2e/utils/visual" ]; then
     echo "❌ Visual test utilities not found"
     exit 1
   fi
   
   # Check test database
   echo "📊 Checking test database..."
   ./scripts/test/setup-test-db.sh
   
   # Run a simple visual test
   echo "🧪 Running validation test..."
   npx playwright test tests/e2e/smoke.spec.ts --project=chromium-visual || echo "⚠️  Basic test failed"
   
   echo "✅ Visual test setup validation complete!"
   ```

7. **Update package.json scripts**:
   ```json
   {
     "scripts": {
       "test:visual": "playwright test **/*.visual.spec.ts",
       "test:visual:update": "./scripts/visual/update-baselines.sh",
       "test:visual:validate": "./scripts/visual/validate-setup.sh",
       "test:visual:chromium": "playwright test **/*.visual.spec.ts --project=chromium-visual",
       "test:visual:firefox": "playwright test **/*.visual.spec.ts --project=firefox-visual",
       "test:visual:mobile": "playwright test **/*.mobile-visual.spec.ts --project=mobile-visual",
       "test:visual:report": "playwright show-report"
     }
   }
   ```

**Verification**: Run the validation script to ensure visual test setup is correct.

## Phase 4 Completion Checklist

- [ ] Playwright configuration optimized for visual testing
- [ ] Visual testing utilities and helpers created
- [ ] Visual test fixtures with proper setup/teardown
- [ ] Comprehensive dashboard visual tests covering all routes
- [ ] Setup/onboarding visual tests
- [ ] Component-specific visual tests (tables, modals, forms, navigation)
- [ ] Visual test management utilities
- [ ] Scripts for updating baselines and validation
- [ ] Cross-browser visual testing configuration
- [ ] Mobile visual testing support
- [ ] Visual test artifacts properly managed
- [ ] All visual tests passing with clean baselines

## Next Steps

After completing Phase 4, you should have:
- Comprehensive visual regression testing coverage
- Reliable screenshot comparison across browsers
- Automated baseline management
- Foundation for catching UI regressions automatically

Proceed to **PHASE-5.md** for detailed dashboard route testing implementation.