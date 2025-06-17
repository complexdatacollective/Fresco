# PHASE 6: Setup Route Testing

This phase implements comprehensive testing for the setup/onboarding flow, including account creation, configuration steps, protocol upload, and first-time user experience.

## Prerequisites
- Phase 1-5 completed successfully
- Understanding of Fresco's onboarding flow
- Knowledge of the setup wizard steps and requirements

## Task 6.1: Setup Flow Foundation Testing

**Objective**: Test the basic setup wizard functionality, navigation, and step progression.

**Steps**:

1. **Create setup test directory structure**:
   ```bash
   mkdir -p tests/e2e/setup
   touch tests/e2e/setup/onboarding-flow.spec.ts
   ```

2. **Add setup flow foundation tests**:
   ```typescript
   // tests/e2e/setup/onboarding-flow.spec.ts
   import { test, expect } from '../fixtures';
   
   test.describe('Setup Onboarding Flow', () => {
     test.beforeEach(async ({ setupData }) => {
       // Setup data provides clean initial state for onboarding
     });
   
     test('should display setup wizard on first visit', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       await setupPage.verifyOnSetupPage();
       
       // Verify setup wizard components are present
       await expect(page.locator('[data-testid="setup-wizard"]')).toBeVisible();
       await expect(page.locator('[data-testid="setup-steps"]')).toBeVisible();
       await expect(page.locator('[data-testid="step-indicator"]')).toBeVisible();
       
       // Verify we're on first step
       await setupPage.verifyCurrentStep(1);
       await expect(page.locator('[data-testid="current-step-title"]')).toContainText('Create Account');
     });
   
     test('should show correct step progression', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Verify step indicators
       const stepIndicators = page.locator('[data-testid="step-indicator"] [data-testid="step"]');
       const stepCount = await stepIndicators.count();
       expect(stepCount).toBeGreaterThan(2);
       
       // Verify first step is active
       await expect(stepIndicators.first()).toHaveClass(/active/);
       
       // Verify other steps are inactive
       for (let i = 1; i < stepCount; i++) {
         await expect(stepIndicators.nth(i)).toHaveClass(/inactive/);
       }
     });
   
     test('should navigate between steps correctly', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Complete first step (account creation)
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       
       // Verify moved to step 2
       await setupPage.verifyCurrentStep(2);
       await expect(page.locator('[data-testid="current-step-title"]')).toContainText('Configure');
       
       // Test back navigation
       await setupPage.clickBack();
       await setupPage.verifyCurrentStep(1);
       
       // Navigate forward again
       await setupPage.clickNext();
       await setupPage.verifyCurrentStep(2);
     });
   
     test('should prevent navigation to incomplete steps', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Try to click on step 2 without completing step 1
       await page.click('[data-testid="step-indicator"] [data-testid="step"]:nth-child(2)');
       
       // Should remain on step 1
       await setupPage.verifyCurrentStep(1);
       
       // Verify step 2 is still inactive
       await expect(page.locator('[data-testid="step-indicator"] [data-testid="step"]:nth-child(2)')).toHaveClass(/inactive/);
     });
   
     test('should persist progress between page refreshes', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Complete first step
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       await setupPage.verifyCurrentStep(2);
       
       // Refresh the page
       await page.reload();
       
       // Should remain on step 2
       await setupPage.verifyCurrentStep(2);
       await expect(page.locator('[data-testid="current-step-title"]')).toContainText('Configure');
     });
   
     test('should handle direct URL access to setup steps', async ({ 
       page, 
       setupPage 
     }) => {
       // Try to access step 2 directly without completing step 1
       await page.goto('/setup?step=2');
       
       // Should redirect to step 1
       await setupPage.verifyCurrentStep(1);
       await expect(page).toHaveURL(/.*\/setup/);
     });
   
     test('should display progress percentage correctly', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Check initial progress
       const progressBar = page.locator('[data-testid="setup-progress"]');
       await expect(progressBar).toBeVisible();
       
       let progressText = await progressBar.textContent();
       expect(progressText).toMatch(/\d+%/);
       
       // Complete first step and check progress increased
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       
       const newProgressText = await progressBar.textContent();
       const initialProgress = parseInt(progressText?.match(/(\d+)%/)?.[1] || '0');
       const newProgress = parseInt(newProgressText?.match(/(\d+)%/)?.[1] || '0');
       
       expect(newProgress).toBeGreaterThan(initialProgress);
     });
   
     test('should handle browser back/forward navigation', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Complete first step
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       await setupPage.verifyCurrentStep(2);
       
       // Use browser back button
       await page.goBack();
       await setupPage.verifyCurrentStep(1);
       
       // Use browser forward button
       await page.goForward();
       await setupPage.verifyCurrentStep(2);
     });
   
     test('should redirect to dashboard when setup is already complete', async ({ 
       completedSetupData,
       page,
       dashboardPage 
     }) => {
       // When setup is already complete, should redirect to dashboard
       await page.goto('/setup');
       
       // Should be redirected to dashboard
       await dashboardPage.verifyOnDashboard();
     });
   });
   ```

3. **Create step navigation tests**:
   ```bash
   touch tests/e2e/setup/step-navigation.spec.ts
   ```

4. **Add step navigation tests**:
   ```typescript
   // tests/e2e/setup/step-navigation.spec.ts
   import { test, expect } from '../fixtures';
   
   test.describe('Setup Step Navigation', () => {
     test.beforeEach(async ({ setupData }) => {
       // Clean setup state for testing navigation
     });
   
     test('should enable/disable navigation buttons correctly', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // On first step, back should be disabled
       await expect(page.locator('[data-testid="back-button"]')).toBeDisabled();
       await expect(page.locator('[data-testid="next-button"]')).toBeDisabled(); // Until form is valid
       
       // Fill form to enable next
       await setupPage.fillAccountDetails('testuser', 'testPassword123!');
       await expect(page.locator('[data-testid="next-button"]')).toBeEnabled();
       
       // Move to next step
       await setupPage.clickNext();
       
       // Back should now be enabled
       await expect(page.locator('[data-testid="back-button"]')).toBeEnabled();
     });
   
     test('should show skip button on optional steps', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Complete account creation
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       
       // On UploadThing configuration step, skip should be available
       await expect(page.locator('[data-testid="skip-button"]')).toBeVisible();
       
       // Test skip functionality
       await setupPage.clickSkip();
       
       // Should move to next step
       await setupPage.verifyCurrentStep(3);
     });
   
     test('should validate step completion before allowing navigation', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Try to navigate without completing required fields
       await expect(page.locator('[data-testid="next-button"]')).toBeDisabled();
       
       // Fill partial form
       await setupPage.fillAccountDetails('testuser', '');
       await expect(page.locator('[data-testid="next-button"]')).toBeDisabled();
       
       // Complete form
       await setupPage.fillAccountDetails('testuser', 'testPassword123!');
       await expect(page.locator('[data-testid="next-button"]')).toBeEnabled();
     });
   
     test('should handle keyboard navigation', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Fill form
       await setupPage.fillAccountDetails('testuser', 'testPassword123!');
       
       // Press Enter to submit/continue
       await page.keyboard.press('Enter');
       
       // Should move to next step
       await setupPage.verifyCurrentStep(2);
     });
   
     test('should display step summaries correctly', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Complete first step
       const username = 'testuser';
       await setupPage.createAccount(username, 'testPassword123!');
       await setupPage.clickNext();
       
       // Should show completed step summary
       const completedStep = page.locator('[data-testid="step-indicator"] [data-testid="step"]:nth-child(1)');
       await expect(completedStep).toHaveClass(/completed/);
       
       // Should show account creation summary
       await expect(page.locator('[data-testid="step-summary"]')).toContainText(username);
     });
   });
   ```

**Verification**: Run setup flow foundation tests to ensure basic wizard functionality works.

## Task 6.2: Account Creation Testing

**Objective**: Test the account creation step including validation, user registration, and error handling.

**Steps**:

1. **Create account creation tests**:
   ```bash
   touch tests/e2e/setup/account-creation.spec.ts
   ```

2. **Add comprehensive account creation tests**:
   ```typescript
   // tests/e2e/setup/account-creation.spec.ts
   import { test, expect } from '../fixtures';
   
   test.describe('Account Creation', () => {
     test.beforeEach(async ({ setupData }) => {
       // Clean state for account creation testing
     });
   
     test('should create account with valid credentials', async ({ 
       page, 
       setupPage,
       db 
     }) => {
       await setupPage.goto();
       
       const username = 'newuser';
       const password = 'testPassword123!';
       
       // Fill account creation form
       await setupPage.createAccount(username, password);
       await setupPage.clickNext();
       
       // Verify user was created in database
       const user = await db.user.findUnique({
         where: { username },
         include: { key: true }
       });
       
       expect(user).toBeTruthy();
       expect(user?.username).toBe(username);
       expect(user?.key).toHaveLength(1);
       
       // Verify moved to next step
       await setupPage.verifyCurrentStep(2);
     });
   
     test('should validate username requirements', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Test empty username
       await setupPage.fillAccountDetails('', 'testPassword123!');
       await expect(page.locator('[data-testid="error-username"]')).toBeVisible();
       await expect(page.locator('[data-testid="error-username"]')).toContainText('required');
       
       // Test username too short
       await setupPage.fillAccountDetails('ab', 'testPassword123!');
       await expect(page.locator('[data-testid="error-username"]')).toContainText('at least 3 characters');
       
       // Test invalid characters
       await setupPage.fillAccountDetails('user@name', 'testPassword123!');
       await expect(page.locator('[data-testid="error-username"]')).toContainText('alphanumeric characters');
       
       // Test valid username
       await setupPage.fillAccountDetails('validuser', 'testPassword123!');
       await expect(page.locator('[data-testid="error-username"]')).not.toBeVisible();
     });
   
     test('should validate password requirements', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Test empty password
       await setupPage.fillAccountDetails('testuser', '');
       await expect(page.locator('[data-testid="error-password"]')).toBeVisible();
       await expect(page.locator('[data-testid="error-password"]')).toContainText('required');
       
       // Test password too short
       await setupPage.fillAccountDetails('testuser', 'short');
       await expect(page.locator('[data-testid="error-password"]')).toContainText('at least 8 characters');
       
       // Test password without uppercase
       await setupPage.fillAccountDetails('testuser', 'password123!');
       await expect(page.locator('[data-testid="error-password"]')).toContainText('uppercase letter');
       
       // Test password without number
       await setupPage.fillAccountDetails('testuser', 'Password!');
       await expect(page.locator('[data-testid="error-password"]')).toContainText('number');
       
       // Test password without special character
       await setupPage.fillAccountDetails('testuser', 'Password123');
       await expect(page.locator('[data-testid="error-password"]')).toContainText('special character');
       
       // Test valid password
       await setupPage.fillAccountDetails('testuser', 'Password123!');
       await expect(page.locator('[data-testid="error-password"]')).not.toBeVisible();
     });
   
     test('should validate password confirmation', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       const password = 'testPassword123!';
       
       // Test mismatched password confirmation
       await setupPage.fillAccountDetails('testuser', password, 'differentPassword123!');
       await expect(page.locator('[data-testid="error-confirmPassword"]')).toBeVisible();
       await expect(page.locator('[data-testid="error-confirmPassword"]')).toContainText('match');
       
       // Test matching password confirmation
       await setupPage.fillAccountDetails('testuser', password, password);
       await expect(page.locator('[data-testid="error-confirmPassword"]')).not.toBeVisible();
     });
   
     test('should prevent duplicate usernames', async ({ 
       page, 
       setupPage,
       db 
     }) => {
       // Create existing user
       await db.user.create({
         data: {
           username: 'existinguser',
           key: {
             create: {
               id: 'username:existinguser',
               hashed_password: 'hashedpassword',
             }
           }
         }
       });
       
       await setupPage.goto();
       
       // Try to create account with existing username
       await setupPage.fillAccountDetails('existinguser', 'testPassword123!');
       await setupPage.submitAccountForm();
       
       // Verify error message
       await expect(page.locator('[data-testid="form-error"]')).toBeVisible();
       await expect(page.locator('[data-testid="form-error"]')).toContainText('already exists');
       
       // Verify still on same step
       await setupPage.verifyCurrentStep(1);
     });
   
     test('should show password strength indicator', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       await setupPage.fillAccountDetails('testuser', '');
       
       // Test weak password
       await page.fill('[name="password"]', 'weak');
       await expect(page.locator('[data-testid="password-strength"]')).toHaveClass(/weak/);
       await expect(page.locator('[data-testid="password-strength-text"]')).toContainText('Weak');
       
       // Test medium password  
       await page.fill('[name="password"]', 'Medium123');
       await expect(page.locator('[data-testid="password-strength"]')).toHaveClass(/medium/);
       
       // Test strong password
       await page.fill('[name="password"]', 'StrongPassword123!');
       await expect(page.locator('[data-testid="password-strength"]')).toHaveClass(/strong/);
       await expect(page.locator('[data-testid="password-strength-text"]')).toContainText('Strong');
     });
   
     test('should handle form submission errors gracefully', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Mock network error
       await page.route('**/api/auth/signup', route => {
         route.fulfill({
           status: 500,
           contentType: 'application/json',
           body: JSON.stringify({ error: 'Internal server error' })
         });
       });
       
       await setupPage.fillAccountDetails('testuser', 'testPassword123!');
       await setupPage.submitAccountForm();
       
       // Verify error handling
       await expect(page.locator('[data-testid="form-error"]')).toBeVisible();
       await expect(page.locator('[data-testid="form-error"]')).toContainText('server error');
       
       // Verify still on same step
       await setupPage.verifyCurrentStep(1);
     });
   
     test('should auto-generate secure username suggestion', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Click generate username button if available
       const generateButton = page.locator('[data-testid="generate-username"]');
       if (await generateButton.isVisible()) {
         await generateButton.click();
         
         // Verify username was generated
         const usernameValue = await page.locator('[name="username"]').inputValue();
         expect(usernameValue).toBeTruthy();
         expect(usernameValue.length).toBeGreaterThan(5);
       }
     });
   
     test('should show terms and conditions', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Check if terms checkbox/link exists
       const termsCheckbox = page.locator('[data-testid="accept-terms"]');
       const termsLink = page.locator('[data-testid="terms-link"]');
       
       if (await termsCheckbox.isVisible()) {
         // Verify terms must be accepted
         await setupPage.fillAccountDetails('testuser', 'testPassword123!');
         await expect(page.locator('[data-testid="next-button"]')).toBeDisabled();
         
         // Accept terms
         await termsCheckbox.check();
         await expect(page.locator('[data-testid="next-button"]')).toBeEnabled();
       }
       
       if (await termsLink.isVisible()) {
         // Verify terms link opens modal or new page
         await termsLink.click();
         await expect(page.locator('[data-testid="terms-modal"], [data-testid="terms-content"]')).toBeVisible();
       }
     });
   
     test('should handle special characters in username', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Test underscore and dash (usually allowed)
       await setupPage.fillAccountDetails('test_user-123', 'testPassword123!');
       
       // Should not show validation error for allowed special chars
       const usernameError = page.locator('[data-testid="error-username"]');
       if (await usernameError.isVisible()) {
         const errorText = await usernameError.textContent();
         expect(errorText).not.toContain('special characters');
       }
     });
   });
   ```

**Verification**: Run account creation tests to ensure user registration works correctly.

## Task 6.3: UploadThing Configuration Testing

**Objective**: Test the UploadThing API key configuration step, including validation and connection testing.

**Steps**:

1. **Create UploadThing configuration tests**:
   ```bash
   touch tests/e2e/setup/uploadthing-config.spec.ts
   ```

2. **Add UploadThing configuration tests**:
   ```typescript
   // tests/e2e/setup/uploadthing-config.spec.ts
   import { test, expect } from '../fixtures';
   
   test.describe('UploadThing Configuration', () => {
     test.beforeEach(async ({ setupData }) => {
       // Clean setup state for UploadThing testing
     });
   
     async function navigateToUploadThingStep(setupPage: any) {
       await setupPage.goto();
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       await setupPage.verifyCurrentStep(2);
     }
   
     test('should display UploadThing configuration form', async ({ 
       page, 
       setupPage 
     }) => {
       await navigateToUploadThingStep(setupPage);
       
       // Verify UploadThing configuration elements
       await expect(page.locator('[data-testid="uploadthing-form"]')).toBeVisible();
       await expect(page.locator('[data-testid="uploadthing-token-input"]')).toBeVisible();
       await expect(page.locator('[data-testid="test-connection-button"]')).toBeVisible();
       await expect(page.locator('[data-testid="skip-button"]')).toBeVisible();
       
       // Verify instructions are present
       await expect(page.locator('[data-testid="uploadthing-instructions"]')).toBeVisible();
       await expect(page.locator('[data-testid="uploadthing-help-link"]')).toBeVisible();
     });
   
     test('should validate UploadThing token format', async ({ 
       page, 
       setupPage 
     }) => {
       await navigateToUploadThingStep(setupPage);
       
       // Test empty token
       await setupPage.fillUploadThingToken('');
       await expect(page.locator('[data-testid="next-button"]')).toBeDisabled();
       
       // Test invalid token format
       await setupPage.fillUploadThingToken('invalid-token');
       await expect(page.locator('[data-testid="error-uploadThingToken"]')).toBeVisible();
       await expect(page.locator('[data-testid="error-uploadThingToken"]')).toContainText('Invalid token format');
       
       // Test valid token format
       await setupPage.fillUploadThingToken('sk_live_abcdefghijklmnopqrstuvwxyz1234567890');
       await expect(page.locator('[data-testid="error-uploadThingToken"]')).not.toBeVisible();
       await expect(page.locator('[data-testid="next-button"]')).toBeEnabled();
     });
   
     test('should test UploadThing connection', async ({ 
       page, 
       setupPage 
     }) => {
       await navigateToUploadThingStep(setupPage);
       
       // Mock successful UploadThing API response
       await page.route('**/api/uploadthing/test-connection', route => {
         route.fulfill({
           status: 200,
           contentType: 'application/json',
           body: JSON.stringify({ 
             success: true, 
             message: 'Connection successful',
             appId: 'test-app-123'
           })
         });
       });
       
       await setupPage.fillUploadThingToken('sk_live_validtoken123456789');
       await page.click('[data-testid="test-connection-button"]');
       
       // Verify connection test results
       await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();
       await expect(page.locator('[data-testid="connection-success"]')).toBeVisible();
       await expect(page.locator('[data-testid="connection-success"]')).toContainText('Connection successful');
       
       // Verify next button is enabled after successful test
       await expect(page.locator('[data-testid="next-button"]')).toBeEnabled();
     });
   
     test('should handle UploadThing connection failure', async ({ 
       page, 
       setupPage 
     }) => {
       await navigateToUploadThingStep(setupPage);
       
       // Mock failed UploadThing API response
       await page.route('**/api/uploadthing/test-connection', route => {
         route.fulfill({
           status: 401,
           contentType: 'application/json',
           body: JSON.stringify({ 
             success: false, 
             error: 'Invalid API key'
           })
         });
       });
       
       await setupPage.fillUploadThingToken('sk_live_invalidtoken');
       await page.click('[data-testid="test-connection-button"]');
       
       // Verify error handling
       await expect(page.locator('[data-testid="connection-error"]')).toBeVisible();
       await expect(page.locator('[data-testid="connection-error"]')).toContainText('Invalid API key');
       
       // Next button should remain disabled after failed test
       await expect(page.locator('[data-testid="next-button"]')).toBeDisabled();
     });
   
     test('should allow skipping UploadThing configuration', async ({ 
       page, 
       setupPage 
     }) => {
       await navigateToUploadThingStep(setupPage);
       
       // Skip UploadThing configuration
       await setupPage.clickSkip();
       
       // Should move to next step
       await setupPage.verifyCurrentStep(3);
       
       // Verify skip was recorded (could check database or UI state)
       await expect(page.locator('[data-testid="uploadthing-skipped-notice"]')).toBeVisible();
     });
   
     test('should save UploadThing configuration', async ({ 
       page, 
       setupPage,
       db 
     }) => {
       await navigateToUploadThingStep(setupPage);
       
       const testToken = 'sk_live_testtoken123456789';
       
       // Mock successful connection
       await page.route('**/api/uploadthing/test-connection', route => {
         route.fulfill({
           status: 200,
           contentType: 'application/json',
           body: JSON.stringify({ success: true })
         });
       });
       
       await setupPage.configureUploadThing(testToken);
       await setupPage.clickNext();
       
       // Verify token was saved in database
       const setting = await db.appSettings.findUnique({
         where: { key: 'uploadThingToken' }
       });
       expect(setting?.value).toBe(testToken);
       
       // Verify moved to next step
       await setupPage.verifyCurrentStep(3);
     });
   
     test('should show helpful error messages for different token issues', async ({ 
       page, 
       setupPage 
     }) => {
       await navigateToUploadThingStep(setupPage);
       
       const testCases = [
         {
           token: 'pk_live_invalidtype',
           expectedError: 'Please use a secret key'
         },
         {
           token: 'sk_test_validformat',
           mockStatus: 403,
           mockError: 'Token expired',
           expectedError: 'Token expired'
         },
         {
           token: 'sk_live_validformat',
           mockStatus: 429,
           mockError: 'Rate limit exceeded',
           expectedError: 'Rate limit exceeded'
         }
       ];
       
       for (const testCase of testCases) {
         // Mock API response if needed
         if (testCase.mockStatus) {
           await page.route('**/api/uploadthing/test-connection', route => {
             route.fulfill({
               status: testCase.mockStatus,
               contentType: 'application/json',
               body: JSON.stringify({ 
                 success: false, 
                 error: testCase.mockError 
               })
             });
           });
         }
         
         await setupPage.fillUploadThingToken(testCase.token);
         
         if (testCase.mockStatus) {
           await page.click('[data-testid="test-connection-button"]');
           await expect(page.locator('[data-testid="connection-error"]')).toContainText(testCase.expectedError);
         } else {
           await expect(page.locator('[data-testid="error-uploadThingToken"]')).toContainText(testCase.expectedError);
         }
         
         // Clear field for next test
         await page.fill('[name="uploadThingToken"]', '');
       }
     });
   
     test('should provide link to UploadThing documentation', async ({ 
       page, 
       setupPage 
     }) => {
       await navigateToUploadThingStep(setupPage);
       
       // Verify help link exists and opens correctly
       const helpLink = page.locator('[data-testid="uploadthing-help-link"]');
       await expect(helpLink).toBeVisible();
       
       // Test opening help (may open modal or new tab)
       await helpLink.click();
       
       // Check if modal opens or new tab (implementation dependent)
       const helpModal = page.locator('[data-testid="uploadthing-help-modal"]');
       if (await helpModal.isVisible()) {
         await expect(helpModal).toContainText('UploadThing');
         await expect(helpModal).toContainText('API key');
       }
     });
   
     test('should remember token after navigation', async ({ 
       page, 
       setupPage 
     }) => {
       await navigateToUploadThingStep(setupPage);
       
       const testToken = 'sk_live_rememberedtoken';
       await setupPage.fillUploadThingToken(testToken);
       
       // Navigate back and forward
       await setupPage.clickBack();
       await setupPage.verifyCurrentStep(1);
       await setupPage.clickNext();
       await setupPage.verifyCurrentStep(2);
       
       // Verify token is still there
       const tokenValue = await page.locator('[name="uploadThingToken"]').inputValue();
       expect(tokenValue).toBe(testToken);
     });
   
     test('should show loading state during connection test', async ({ 
       page, 
       setupPage 
     }) => {
       await navigateToUploadThingStep(setupPage);
       
       // Mock slow API response
       await page.route('**/api/uploadthing/test-connection', route => {
         setTimeout(() => {
           route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify({ success: true })
           });
         }, 2000);
       });
       
       await setupPage.fillUploadThingToken('sk_live_validtoken');
       await page.click('[data-testid="test-connection-button"]');
       
       // Verify loading state
       await expect(page.locator('[data-testid="testing-connection"]')).toBeVisible();
       await expect(page.locator('[data-testid="test-connection-button"]')).toBeDisabled();
       
       // Wait for completion
       await expect(page.locator('[data-testid="connection-success"]')).toBeVisible({ timeout: 3000 });
       await expect(page.locator('[data-testid="test-connection-button"]')).toBeEnabled();
     });
   });
   ```

**Verification**: Run UploadThing configuration tests to ensure API integration works correctly.

## Task 6.4: Protocol Upload Testing

**Objective**: Test the protocol file upload functionality, including file validation, import process, and error handling.

**Steps**:

1. **Create protocol upload tests**:
   ```bash
   touch tests/e2e/setup/protocol-upload.spec.ts
   ```

2. **Add comprehensive protocol upload tests**:
   ```typescript
   // tests/e2e/setup/protocol-upload.spec.ts
   import { test, expect } from '../fixtures';
   
   test.describe('Protocol Upload', () => {
     test.beforeEach(async ({ setupData }) => {
       // Clean setup state for protocol upload testing
     });
   
     async function navigateToProtocolUploadStep(setupPage: any) {
       await setupPage.goto();
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       
       // Skip UploadThing configuration for faster testing
       await setupPage.clickSkip();
       await setupPage.verifyCurrentStep(3);
     }
   
     test('should display protocol upload form', async ({ 
       page, 
       setupPage 
     }) => {
       await navigateToProtocolUploadStep(setupPage);
       
       // Verify protocol upload elements
       await expect(page.locator('[data-testid="protocol-upload-form"]')).toBeVisible();
       await expect(page.locator('[data-testid="protocol-file-input"]')).toBeVisible();
       await expect(page.locator('[data-testid="upload-instructions"]')).toBeVisible();
       await expect(page.locator('[data-testid="skip-button"]')).toBeVisible();
       
       // Verify drag and drop area
       await expect(page.locator('[data-testid="dropzone"]')).toBeVisible();
       await expect(page.locator('[data-testid="dropzone"]')).toContainText('drag');
     });
   
     test('should upload valid protocol file', async ({ 
       page, 
       setupPage,
       fileHelper,
       db 
     }) => {
       await navigateToProtocolUploadStep(setupPage);
       
       // Create test protocol file
       const protocolData = {
         name: 'Test Setup Protocol',
         description: 'Protocol uploaded during setup',
         schemaVersion: 6,
         stages: [
           {
             id: 'stage1',
             type: 'NameGenerator',
             label: 'Name Generator',
             prompts: [{
               id: 'prompt1',
               text: 'Please name people you know',
               variable: 'name',
             }],
           }
         ],
         codebook: {
           node: {
             person: {
               name: 'Person',
               variables: {
                 name: { name: 'Name', type: 'text' }
               }
             }
           },
           edge: {},
           ego: { variables: {} }
         }
       };
       
       const protocolFile = fileHelper.createTestProtocolFile(protocolData);
       
       // Upload protocol file
       await setupPage.uploadProtocol(protocolFile);
       
       // Verify upload success
       await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
       await expect(page.locator('[data-testid="protocol-name"]')).toContainText('Test Setup Protocol');
       
       // Verify next button is enabled
       await expect(page.locator('[data-testid="next-button"]')).toBeEnabled();
       
       // Continue to complete setup
       await setupPage.clickNext();
       
       // Verify protocol was saved in database
       const protocol = await db.protocol.findFirst({
         where: { name: 'Test Setup Protocol' }
       });
       expect(protocol).toBeTruthy();
       expect(protocol?.description).toBe('Protocol uploaded during setup');
     });
   
     test('should validate protocol file format', async ({ 
       page, 
       setupPage,
       fileHelper 
     }) => {
       await navigateToProtocolUploadStep(setupPage);
       
       // Test with invalid file type
       const invalidFile = fileHelper.createTestImageFile();
       
       await page.setInputFiles('[data-testid="protocol-file-input"]', invalidFile);
       
       // Verify error message
       await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
       await expect(page.locator('[data-testid="upload-error"]')).toContainText('Invalid file type');
       
       // Verify next button remains disabled
       await expect(page.locator('[data-testid="next-button"]')).toBeDisabled();
     });
   
     test('should validate protocol file content', async ({ 
       page, 
       setupPage,
       fileHelper 
     }) => {
       await navigateToProtocolUploadStep(setupPage);
       
       // Create invalid protocol file (missing required fields)
       const invalidProtocolData = {
         name: 'Invalid Protocol',
         // Missing required fields like schemaVersion, stages, codebook
       };
       
       const invalidProtocolFile = fileHelper.createTestProtocolFile(invalidProtocolData);
       
       await page.setInputFiles('[data-testid="protocol-file-input"]', invalidProtocolFile);
       
       // Verify validation error
       await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
       await expect(page.locator('[data-testid="upload-error"]')).toContainText('Invalid protocol structure');
       
       // Verify details about what's missing
       await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible();
       await expect(page.locator('[data-testid="validation-errors"]')).toContainText('schemaVersion');
     });
   
     test('should handle large protocol files', async ({ 
       page, 
       setupPage,
       fileHelper 
     }) => {
       await navigateToProtocolUploadStep(setupPage);
       
       // Create large protocol file
       const largeProtocolData = {
         name: 'Large Protocol',
         description: 'Protocol with many stages for size testing',
         schemaVersion: 6,
         stages: Array.from({ length: 50 }, (_, i) => ({
           id: `stage${i + 1}`,
           type: 'NameGenerator',
           label: `Name Generator ${i + 1}`,
           prompts: [{
             id: `prompt${i + 1}`,
             text: `Please name people for stage ${i + 1}`,
             variable: 'name',
           }],
         })),
         codebook: {
           node: {
             person: {
               name: 'Person',
               variables: {
                 name: { name: 'Name', type: 'text' }
               }
             }
           },
           edge: {},
           ego: { variables: {} }
         }
       };
       
       const largeProtocolFile = fileHelper.createTestProtocolFile(largeProtocolData);
       
       await page.setInputFiles('[data-testid="protocol-file-input"]', largeProtocolFile);
       
       // Verify upload progress is shown
       await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
       
       // Wait for upload completion
       await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
     });
   
     test('should allow skipping protocol upload', async ({ 
       page, 
       setupPage 
     }) => {
       await navigateToProtocolUploadStep(setupPage);
       
       // Skip protocol upload
       await setupPage.clickSkip();
       
       // Should move to completion step
       await setupPage.verifySetupComplete();
       
       // Verify skip was handled gracefully
       await expect(page.locator('[data-testid="protocol-skipped-notice"]')).toBeVisible();
     });
   
     test('should show protocol preview after upload', async ({ 
       page, 
       setupPage,
       fileHelper 
     }) => {
       await navigateToProtocolUploadStep(setupPage);
       
       const protocolData = {
         name: 'Preview Test Protocol',
         description: 'Testing protocol preview functionality',
         schemaVersion: 6,
         stages: [
           {
             id: 'stage1',
             type: 'NameGenerator',
             label: 'Name Generator',
           },
           {
             id: 'stage2',
             type: 'Sociogram',
             label: 'Sociogram',
           }
         ],
         codebook: {
           node: { person: { name: 'Person' } },
           edge: {},
           ego: { variables: {} }
         }
       };
       
       const protocolFile = fileHelper.createTestProtocolFile(protocolData);
       
       await page.setInputFiles('[data-testid="protocol-file-input"]', protocolFile);
       
       // Verify protocol preview is shown
       await expect(page.locator('[data-testid="protocol-preview"]')).toBeVisible();
       await expect(page.locator('[data-testid="protocol-name"]')).toContainText('Preview Test Protocol');
       await expect(page.locator('[data-testid="protocol-description"]')).toContainText('Testing protocol preview');
       
       // Verify stage count
       await expect(page.locator('[data-testid="stage-count"]')).toContainText('2 stages');
       
       // Verify stage types are listed
       await expect(page.locator('[data-testid="stage-types"]')).toContainText('NameGenerator');
       await expect(page.locator('[data-testid="stage-types"]')).toContainText('Sociogram');
     });
   
     test('should handle protocol upload errors gracefully', async ({ 
       page, 
       setupPage,
       fileHelper 
     }) => {
       await navigateToProtocolUploadStep(setupPage);
       
       // Mock server error
       await page.route('**/api/protocols/upload', route => {
         route.fulfill({
           status: 500,
           contentType: 'application/json',
           body: JSON.stringify({ error: 'Server error during upload' })
         });
       });
       
       const protocolFile = fileHelper.createTestProtocolFile({
         name: 'Test Protocol',
         schemaVersion: 6,
         stages: [],
         codebook: { node: {}, edge: {}, ego: { variables: {} } }
       });
       
       await page.setInputFiles('[data-testid="protocol-file-input"]', protocolFile);
       
       // Verify error handling
       await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
       await expect(page.locator('[data-testid="upload-error"]')).toContainText('Server error');
       
       // Verify retry option
       await expect(page.locator('[data-testid="retry-upload"]')).toBeVisible();
     });
   
     test('should support drag and drop upload', async ({ 
       page, 
       setupPage,
       fileHelper 
     }) => {
       await navigateToProtocolUploadStep(setupPage);
       
       const protocolFile = fileHelper.createTestProtocolFile({
         name: 'Drag Drop Protocol',
         schemaVersion: 6,
         stages: [],
         codebook: { node: {}, edge: {}, ego: { variables: {} } }
       });
       
       // Simulate drag and drop (implementation may vary)
       const dropzone = page.locator('[data-testid="dropzone"]');
       
       // Verify dropzone becomes active on dragover
       await dropzone.dispatchEvent('dragenter');
       await expect(dropzone).toHaveClass(/active/);
       
       // Simulate file drop
       await dropzone.setInputFiles(protocolFile);
       
       // Verify upload started
       await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
     });
   
     test('should validate protocol schema version compatibility', async ({ 
       page, 
       setupPage,
       fileHelper 
     }) => {
       await navigateToProtocolUploadStep(setupPage);
       
       // Test with unsupported schema version
       const oldProtocolData = {
         name: 'Old Protocol',
         schemaVersion: 3, // Older version
         stages: [],
         codebook: { node: {}, edge: {}, ego: { variables: {} } }
       };
       
       const oldProtocolFile = fileHelper.createTestProtocolFile(oldProtocolData);
       
       await page.setInputFiles('[data-testid="protocol-file-input"]', oldProtocolFile);
       
       // Verify version compatibility warning
       await expect(page.locator('[data-testid="version-warning"]')).toBeVisible();
       await expect(page.locator('[data-testid="version-warning"]')).toContainText('schema version');
       
       // Should still allow upload with warning
       await expect(page.locator('[data-testid="upload-anyway"]')).toBeVisible();
     });
   });
   ```

**Verification**: Run protocol upload tests to ensure file handling works correctly.

## Task 6.5: Setup Completion Testing

**Objective**: Test the setup completion process, including final configuration, success states, and redirection to dashboard.

**Steps**:

1. **Create setup completion tests**:
   ```bash
   touch tests/e2e/setup/setup-completion.spec.ts
   ```

2. **Add setup completion tests**:
   ```typescript
   // tests/e2e/setup/setup-completion.spec.ts
   import { test, expect } from '../fixtures';
   
   test.describe('Setup Completion', () => {
     test.beforeEach(async ({ setupData }) => {
       // Clean setup state for completion testing
     });
   
     async function completeSetupFlow(setupPage: any, fileHelper: any, options = {}) {
       const {
         skipUploadThing = true,
         skipProtocol = false,
         protocolData = null
       } = options;
       
       await setupPage.goto();
       
       // Step 1: Create account
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       
       // Step 2: UploadThing configuration
       if (skipUploadThing) {
         await setupPage.clickSkip();
       } else {
         await setupPage.configureUploadThing('sk_live_testtoken');
         await setupPage.clickNext();
       }
       
       // Step 3: Protocol upload
       if (skipProtocol) {
         await setupPage.clickSkip();
       } else {
         const protocolFile = fileHelper.createTestProtocolFile(protocolData || {
           name: 'Setup Test Protocol',
           schemaVersion: 6,
           stages: [],
           codebook: { node: {}, edge: {}, ego: { variables: {} } }
         });
         await setupPage.uploadProtocol(protocolFile);
         await setupPage.clickNext();
       }
     }
   
     test('should complete setup with all steps', async ({ 
       page, 
       setupPage,
       fileHelper,
       db 
     }) => {
       await completeSetupFlow(setupPage, fileHelper, { 
         skipUploadThing: false,
         skipProtocol: false 
       });
       
       // Verify setup completion page
       await expect(page.locator('[data-testid="setup-complete"]')).toBeVisible();
       await expect(page.locator('[data-testid="completion-title"]')).toContainText('Setup Complete');
       await expect(page.locator('[data-testid="completion-message"]')).toContainText('successfully configured');
       
       // Verify summary of what was configured
       await expect(page.locator('[data-testid="setup-summary"]')).toBeVisible();
       await expect(page.locator('[data-testid="account-created"]')).toBeVisible();
       await expect(page.locator('[data-testid="uploadthing-configured"]')).toBeVisible();
       await expect(page.locator('[data-testid="protocol-uploaded"]')).toBeVisible();
       
       // Verify continue to dashboard button
       await expect(page.locator('[data-testid="continue-to-dashboard"]')).toBeVisible();
       await expect(page.locator('[data-testid="continue-to-dashboard"]')).toBeEnabled();
       
       // Verify setup was marked as complete in database
       const configuredSetting = await db.appSettings.findUnique({
         where: { key: 'configured' }
       });
       expect(configuredSetting?.value).toBe('true');
     });
   
     test('should complete setup with minimal configuration', async ({ 
       page, 
       setupPage,
       fileHelper,
       db 
     }) => {
       await completeSetupFlow(setupPage, fileHelper, { 
         skipUploadThing: true,
         skipProtocol: true 
       });
       
       // Verify completion with skipped items
       await expect(page.locator('[data-testid="setup-complete"]')).toBeVisible();
       await expect(page.locator('[data-testid="uploadthing-skipped"]')).toBeVisible();
       await expect(page.locator('[data-testid="protocol-skipped"]')).toBeVisible();
       
       // Verify user was still created
       const user = await db.user.findUnique({
         where: { username: 'testuser' }
       });
       expect(user).toBeTruthy();
       
       // Verify setup marked as complete even with skipped steps
       const configuredSetting = await db.appSettings.findUnique({
         where: { key: 'configured' }
       });
       expect(configuredSetting?.value).toBe('true');
     });
   
     test('should redirect to dashboard after completion', async ({ 
       page, 
       setupPage,
       fileHelper,
       dashboardPage 
     }) => {
       await completeSetupFlow(setupPage, fileHelper);
       
       // Click continue to dashboard
       await page.click('[data-testid="continue-to-dashboard"]');
       
       // Verify redirected to dashboard
       await dashboardPage.verifyOnDashboard();
       await expect(page).toHaveURL(/.*\/dashboard/);
       
       // Verify welcome message for new user
       await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
       await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome');
     });
   
     test('should show next steps recommendations', async ({ 
       page, 
       setupPage,
       fileHelper 
     }) => {
       await completeSetupFlow(setupPage, fileHelper);
       
       // Verify next steps section
       await expect(page.locator('[data-testid="next-steps"]')).toBeVisible();
       
       // Check for recommended actions
       const recommendations = [
         'upload-additional-protocols',
         'create-participants',
         'configure-settings'
       ];
       
       for (const recommendation of recommendations) {
         await expect(page.locator(`[data-testid="${recommendation}"]`)).toBeVisible();
       }
       
       // Verify links to relevant sections
       await expect(page.locator('[data-testid="link-to-protocols"]')).toBeVisible();
       await expect(page.locator('[data-testid="link-to-participants"]')).toBeVisible();
     });
   
     test('should handle setup completion with warnings', async ({ 
       page, 
       setupPage,
       fileHelper 
     }) => {
       await completeSetupFlow(setupPage, fileHelper, { 
         skipUploadThing: true,
         skipProtocol: false 
       });
       
       // Verify warnings about skipped configuration
       await expect(page.locator('[data-testid="setup-warnings"]')).toBeVisible();
       await expect(page.locator('[data-testid="uploadthing-warning"]')).toBeVisible();
       await expect(page.locator('[data-testid="uploadthing-warning"]'))
         .toContainText('configure UploadThing later');
       
       // Verify links to complete skipped steps
       await expect(page.locator('[data-testid="configure-uploadthing-link"]')).toBeVisible();
     });
   
     test('should generate installation ID during completion', async ({ 
       page, 
       setupPage,
       fileHelper,
       db 
     }) => {
       await completeSetupFlow(setupPage, fileHelper);
       
       // Verify installation ID was generated
       const installationIdSetting = await db.appSettings.findUnique({
         where: { key: 'installationId' }
       });
       expect(installationIdSetting).toBeTruthy();
       expect(installationIdSetting?.value).toBeTruthy();
       expect(installationIdSetting?.value.length).toBeGreaterThan(10);
       
       // Verify installation ID is displayed on completion page
       await expect(page.locator('[data-testid="installation-id"]')).toBeVisible();
       const displayedId = await page.locator('[data-testid="installation-id"]').textContent();
       expect(displayedId).toContain(installationIdSetting?.value);
     });
   
     test('should set initialization timestamp', async ({ 
       page, 
       setupPage,
       fileHelper,
       db 
     }) => {
       const beforeSetup = new Date();
       
       await completeSetupFlow(setupPage, fileHelper);
       
       const afterSetup = new Date();
       
       // Verify initialization timestamp was set
       const initializedAtSetting = await db.appSettings.findUnique({
         where: { key: 'initializedAt' }
       });
       expect(initializedAtSetting).toBeTruthy();
       
       const initializedAt = new Date(initializedAtSetting?.value || '');
       expect(initializedAt.getTime()).toBeGreaterThanOrEqual(beforeSetup.getTime());
       expect(initializedAt.getTime()).toBeLessThanOrEqual(afterSetup.getTime());
     });
   
     test('should allow downloading setup summary', async ({ 
       page, 
       setupPage,
       fileHelper 
     }) => {
       await completeSetupFlow(setupPage, fileHelper, { 
         skipUploadThing: false,
         skipProtocol: false 
       });
       
       // Verify download summary option
       const downloadButton = page.locator('[data-testid="download-setup-summary"]');
       if (await downloadButton.isVisible()) {
         await downloadButton.click();
         
         // Verify download initiated (implementation dependent)
         await expect(page.locator('[data-testid="download-started"]')).toBeVisible();
       }
     });
   
     test('should handle analytics opt-in during completion', async ({ 
       page, 
       setupPage,
       fileHelper,
       db 
     }) => {
       await completeSetupFlow(setupPage, fileHelper);
       
       // Check if analytics opt-in is presented
       const analyticsOptIn = page.locator('[data-testid="analytics-opt-in"]');
       
       if (await analyticsOptIn.isVisible()) {
         // Test opting in
         await page.click('[data-testid="enable-analytics"]');
         await page.click('[data-testid="continue-to-dashboard"]');
         
         // Verify analytics setting was saved
         const analyticsSetting = await db.appSettings.findUnique({
           where: { key: 'disableAnalytics' }
         });
         expect(analyticsSetting?.value).toBe('false');
       }
     });
   
     test('should prevent going back after completion', async ({ 
       page, 
       setupPage,
       fileHelper 
     }) => {
       await completeSetupFlow(setupPage, fileHelper);
       
       // Try to use browser back button
       await page.goBack();
       
       // Should remain on completion page or redirect to dashboard
       const currentUrl = page.url();
       expect(currentUrl).toMatch(/\/(setup\/complete|dashboard)/);
       
       // Back button should not be visible on completion page
       const backButton = page.locator('[data-testid="back-button"]');
       if (await backButton.isVisible()) {
         await expect(backButton).toBeDisabled();
       }
     });
   
     test('should handle setup timeout/session expiry gracefully', async ({ 
       page, 
       setupPage,
       fileHelper 
     }) => {
       await setupPage.goto();
       
       // Simulate session expiry by clearing cookies
       await page.context().clearCookies();
       
       // Try to complete setup
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       
       // Should handle session expiry gracefully
       // (Implementation dependent - might redirect to login or restart setup)
       await expect(page.locator('[data-testid="session-expired"], [data-testid="setup-restart"]')).toBeVisible();
     });
   });
   ```

**Verification**: Run setup completion tests to ensure the entire onboarding flow works correctly.

## Task 6.6: Setup Error Handling Testing

**Objective**: Test error scenarios, edge cases, and recovery mechanisms in the setup flow.

**Steps**:

1. **Create setup error handling tests**:
   ```bash
   touch tests/e2e/setup/error-handling.spec.ts
   ```

2. **Add comprehensive error handling tests**:
   ```typescript
   // tests/e2e/setup/error-handling.spec.ts
   import { test, expect } from '../fixtures';
   
   test.describe('Setup Error Handling', () => {
     test.beforeEach(async ({ setupData }) => {
       // Clean state for error testing
     });
   
     test('should handle database connection errors during account creation', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Mock database error
       await page.route('**/api/auth/signup', route => {
         route.fulfill({
           status: 503,
           contentType: 'application/json',
           body: JSON.stringify({ error: 'Database connection failed' })
         });
       });
       
       await setupPage.fillAccountDetails('testuser', 'testPassword123!');
       await setupPage.submitAccountForm();
       
       // Verify error handling
       await expect(page.locator('[data-testid="form-error"]')).toBeVisible();
       await expect(page.locator('[data-testid="form-error"]')).toContainText('connection failed');
       
       // Verify retry mechanism
       await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
       
       // Test retry functionality
       await page.unroute('**/api/auth/signup');
       await page.click('[data-testid="retry-button"]');
       
       // Should attempt request again
       await setupPage.verifyCurrentStep(2); // Should proceed after successful retry
     });
   
     test('should handle network errors gracefully', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Simulate network failure
       await page.route('**/api/**', route => {
         route.abort();
       });
       
       await setupPage.fillAccountDetails('testuser', 'testPassword123!');
       await setupPage.submitAccountForm();
       
       // Verify network error handling
       await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
       await expect(page.locator('[data-testid="network-error"]')).toContainText('network');
       
       // Verify offline indicator if available
       const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
       if (await offlineIndicator.isVisible()) {
         await expect(offlineIndicator).toContainText('offline');
       }
     });
   
     test('should handle invalid server responses', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Mock invalid JSON response
       await page.route('**/api/auth/signup', route => {
         route.fulfill({
           status: 200,
           contentType: 'application/json',
           body: 'invalid json response'
         });
       });
       
       await setupPage.fillAccountDetails('testuser', 'testPassword123!');
       await setupPage.submitAccountForm();
       
       // Verify error handling for invalid response
       await expect(page.locator('[data-testid="form-error"]')).toBeVisible();
       await expect(page.locator('[data-testid="form-error"]')).toContainText('unexpected response');
     });
   
     test('should handle file upload errors', async ({ 
       page, 
       setupPage,
       fileHelper 
     }) => {
       await setupPage.goto();
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       await setupPage.clickSkip(); // Skip UploadThing
       
       // Mock file upload failure
       await page.route('**/api/protocols/upload', route => {
         route.fulfill({
           status: 413,
           contentType: 'application/json',
           body: JSON.stringify({ error: 'File too large' })
         });
       });
       
       const protocolFile = fileHelper.createTestProtocolFile({
         name: 'Test Protocol',
         schemaVersion: 6,
         stages: [],
         codebook: { node: {}, edge: {}, ego: { variables: {} } }
       });
       
       await page.setInputFiles('[data-testid="protocol-file-input"]', protocolFile);
       
       // Verify file upload error handling
       await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
       await expect(page.locator('[data-testid="upload-error"]')).toContainText('too large');
       
       // Verify retry option
       await expect(page.locator('[data-testid="retry-upload"]')).toBeVisible();
     });
   
     test('should handle browser compatibility issues', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Mock missing browser APIs
       await page.addInitScript(() => {
         // Remove File API to simulate older browser
         delete (window as any).File;
         delete (window as any).FileReader;
       });
       
       await page.reload();
       
       // Verify fallback handling
       const compatibilityWarning = page.locator('[data-testid="compatibility-warning"]');
       if (await compatibilityWarning.isVisible()) {
         await expect(compatibilityWarning).toContainText('browser');
         await expect(compatibilityWarning).toContainText('upgrade');
       }
     });
   
     test('should handle form state corruption', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Fill form partially
       await setupPage.fillAccountDetails('testuser', 'testPassword123!');
       
       // Corrupt form state via script injection
       await page.evaluate(() => {
         const form = document.querySelector('[data-testid="create-account-form"]');
         if (form) {
           (form as HTMLFormElement).reset();
         }
       });
       
       // Try to proceed
       await setupPage.clickNext();
       
       // Should handle corrupted state gracefully
       await expect(page.locator('[data-testid="form-error"]')).toBeVisible();
       await setupPage.verifyCurrentStep(1); // Should remain on current step
     });
   
     test('should handle quota/storage errors', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Mock storage quota exceeded
       await page.route('**/api/protocols/upload', route => {
         route.fulfill({
           status: 507,
           contentType: 'application/json',
           body: JSON.stringify({ error: 'Storage quota exceeded' })
         });
       });
       
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();
       await setupPage.clickSkip();
       
       const fileHelper = await import('../utils/helpers/data');
       const protocolFile = fileHelper.TestFileHelper.createTestProtocolFile();
       
       await page.setInputFiles('[data-testid="protocol-file-input"]', protocolFile);
       
       // Verify quota error handling
       await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
       await expect(page.locator('[data-testid="upload-error"]')).toContainText('quota exceeded');
       
       // Verify guidance for resolution
       await expect(page.locator('[data-testid="quota-help"]')).toBeVisible();
     });
   
     test('should recover from JavaScript errors', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Inject script error
       await page.addInitScript(() => {
         // Override a critical function to throw error
         const originalFetch = window.fetch;
         window.fetch = () => {
           throw new Error('Simulated JavaScript error');
         };
       });
       
       await setupPage.fillAccountDetails('testuser', 'testPassword123!');
       
       // Monitor for error boundary or error handling
       const errorBoundary = page.locator('[data-testid="error-boundary"]');
       const errorFallback = page.locator('[data-testid="error-fallback"]');
       
       await setupPage.submitAccountForm();
       
       // Should show error boundary or fallback
       if (await errorBoundary.isVisible()) {
         await expect(errorBoundary).toContainText('error');
         await expect(page.locator('[data-testid="reload-page"]')).toBeVisible();
       } else if (await errorFallback.isVisible()) {
         await expect(errorFallback).toContainText('something went wrong');
       }
     });
   
     test('should handle concurrent setup attempts', async ({ 
       page, 
       setupPage,
       context 
     }) => {
       // Open second tab to simulate concurrent setup
       const secondPage = await context.newPage();
       
       await setupPage.goto();
       await secondPage.goto('/setup');
       
       // Try to complete setup in both tabs
       await Promise.all([
         setupPage.fillAccountDetails('testuser', 'testPassword123!'),
         secondPage.fill('[name="username"]', 'testuser'),
         secondPage.fill('[name="password"]', 'testPassword123!'),
       ]);
       
       await setupPage.submitAccountForm();
       await secondPage.click('[type="submit"]');
       
       // One should succeed, other should show error
       const firstError = page.locator('[data-testid="form-error"]');
       const secondError = secondPage.locator('[data-testid="form-error"]');
       
       // At least one should show error about existing user
       const hasError = await firstError.isVisible() || await secondError.isVisible();
       expect(hasError).toBe(true);
     });
   
     test('should provide helpful error messages', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       const errorScenarios = [
         {
           route: '**/api/auth/signup',
           status: 400,
           error: 'Username contains invalid characters',
           expectedMessage: 'invalid characters'
         },
         {
           route: '**/api/auth/signup',
           status: 429,
           error: 'Too many attempts',
           expectedMessage: 'try again later'
         },
         {
           route: '**/api/auth/signup',
           status: 500,
           error: 'Internal server error',
           expectedMessage: 'temporary issue'
         }
       ];
       
       for (const scenario of errorScenarios) {
         await page.route(scenario.route, route => {
           route.fulfill({
             status: scenario.status,
             contentType: 'application/json',
             body: JSON.stringify({ error: scenario.error })
           });
         });
         
         await setupPage.fillAccountDetails('testuser', 'testPassword123!');
         await setupPage.submitAccountForm();
         
         await expect(page.locator('[data-testid="form-error"]')).toContainText(scenario.expectedMessage);
         
         // Clear route for next test
         await page.unroute(scenario.route);
         
         // Reset form
         await page.reload();
       }
     });
   
     test('should handle timeout errors', async ({ 
       page, 
       setupPage 
     }) => {
       await setupPage.goto();
       
       // Mock slow response that times out
       await page.route('**/api/auth/signup', route => {
         // Never respond to simulate timeout
         // Don't call route.fulfill() or route.continue()
       });
       
       await setupPage.fillAccountDetails('testuser', 'testPassword123!');
       await setupPage.submitAccountForm();
       
       // Verify timeout handling
       await expect(page.locator('[data-testid="request-timeout"]')).toBeVisible({ timeout: 30000 });
       await expect(page.locator('[data-testid="request-timeout"]')).toContainText('timeout');
       
       // Verify retry option
       await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
     });
   });
   ```

**Verification**: Run error handling tests to ensure robust error recovery mechanisms.

## Phase 6 Completion Checklist

- [ ] Setup wizard foundation tests covering navigation and step progression
- [ ] Account creation tests with comprehensive validation and error handling
- [ ] UploadThing configuration tests including token validation and connection testing
- [ ] Protocol upload tests covering file validation, import process, and drag-and-drop
- [ ] Setup completion tests ensuring proper finalization and database updates
- [ ] Error handling tests for network failures, server errors, and edge cases
- [ ] Browser compatibility and fallback mechanism tests
- [ ] Session management and concurrent access tests
- [ ] File upload error recovery and retry mechanisms
- [ ] Form validation and user experience tests
- [ ] Database integrity tests ensuring proper data persistence
- [ ] Redirect and navigation behavior tests

## Next Steps

After completing Phase 6, you should have:
- Comprehensive testing coverage for the entire setup/onboarding flow
- Robust error handling and recovery mechanisms
- Proper validation of all user inputs and file uploads
- Foundation for ensuring a smooth first-time user experience

Proceed to **PHASE-7.md** for file upload and UploadThing integration testing.