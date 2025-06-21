# PHASE 7: File Upload & UploadThing Integration

This phase implements comprehensive testing for file upload functionality and UploadThing service integration, including mocking strategies, protocol import testing, and asset management.

## Prerequisites

- Phase 1-6 completed successfully
- Understanding of UploadThing service integration
- Knowledge of Fresco's file handling and protocol import system

## Task 7.1: UploadThing Service Mocking

**Objective**: Create robust mocking strategies for UploadThing service to enable reliable testing without external dependencies.

**Steps**:

1. **Create UploadThing mocking utilities directory**:

   ```bash
   mkdir -p tests/e2e/utils/mocks
   touch tests/e2e/utils/mocks/uploadthing.ts
   ```

2. **Add UploadThing mock implementation**:

   ```typescript
   // tests/e2e/utils/mocks/uploadthing.ts
   import { Page } from '@playwright/test';

   export interface MockUploadThingOptions {
     shouldFail?: boolean;
     delayMs?: number;
     fileSize?: number;
     errorType?: 'network' | 'auth' | 'quota' | 'invalid-file';
     customResponse?: any;
   }

   export class UploadThingMocker {
     private page: Page;
     private mockResponses: Map<string, any> = new Map();

     constructor(page: Page) {
       this.page = page;
     }

     /**
      * Mock UploadThing file upload endpoint
      */
     async mockFileUpload(options: MockUploadThingOptions = {}) {
       const {
         shouldFail = false,
         delayMs = 100,
         fileSize = 1024,
         errorType = 'network',
         customResponse = null,
       } = options;

       await this.page.route('**/api/uploadthing/**', async (route) => {
         const url = route.request().url();

         // Simulate network delay
         if (delayMs > 0) {
           await new Promise((resolve) => setTimeout(resolve, delayMs));
         }

         if (shouldFail) {
           const errorResponses = {
             'network': { status: 500, body: { error: 'Network error' } },
             'auth': { status: 401, body: { error: 'Invalid API key' } },
             'quota': {
               status: 507,
               body: { error: 'Storage quota exceeded' },
             },
             'invalid-file': {
               status: 400,
               body: { error: 'Invalid file type' },
             },
           };

           const errorResponse = errorResponses[errorType];
           route.fulfill({
             status: errorResponse.status,
             contentType: 'application/json',
             body: JSON.stringify(errorResponse.body),
           });
           return;
         }

         if (customResponse) {
           route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify(customResponse),
           });
           return;
         }

         // Default successful response
         if (url.includes('/uploadthing')) {
           const mockFileResponse = {
             key: `mock-file-${Date.now()}`,
             name: 'test-file.netcanvas',
             size: fileSize,
             url: `https://utfs.io/f/mock-file-${Date.now()}`,
             customId: null,
             type: 'application/octet-stream',
           };

           route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify([mockFileResponse]),
           });
         } else {
           route.continue();
         }
       });
     }

     /**
      * Mock UploadThing connection test
      */
     async mockConnectionTest(
       isValid: boolean = true,
       appId: string = 'test-app-123',
     ) {
       await this.page.route('**/api/uploadthing/test-connection', (route) => {
         if (isValid) {
           route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify({
               success: true,
               message: 'Connection successful',
               appId,
             }),
           });
         } else {
           route.fulfill({
             status: 401,
             contentType: 'application/json',
             body: JSON.stringify({
               success: false,
               error: 'Invalid API key',
             }),
           });
         }
       });
     }

     /**
      * Mock UploadThing file deletion
      */
     async mockFileDeletion(shouldSucceed: boolean = true) {
       await this.page.route('**/api/uploadthing/delete', (route) => {
         if (shouldSucceed) {
           route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify({ success: true }),
           });
         } else {
           route.fulfill({
             status: 404,
             contentType: 'application/json',
             body: JSON.stringify({ error: 'File not found' }),
           });
         }
       });
     }

     /**
      * Mock UploadThing presigned URL generation
      */
     async mockPresignedUrl() {
       await this.page.route('**/api/uploadthing/presigned-url', (route) => {
         const mockPresignedResponse = {
           presignedUrl: 'https://mock-presigned-url.com/upload',
           fileKey: `mock-key-${Date.now()}`,
           fields: {
             'key': `mock-key-${Date.now()}`,
             'Content-Type': 'application/octet-stream',
           },
         };

         route.fulfill({
           status: 200,
           contentType: 'application/json',
           body: JSON.stringify(mockPresignedResponse),
         });
       });
     }

     /**
      * Simulate upload progress events
      */
     async simulateUploadProgress(
       page: Page,
       steps: number[] = [25, 50, 75, 100],
     ) {
       for (const progress of steps) {
         await page.evaluate((progress) => {
           const event = new CustomEvent('uploadProgress', {
             detail: { progress, loaded: progress, total: 100 },
           });
           window.dispatchEvent(event);
         }, progress);

         await page.waitForTimeout(200);
       }
     }

     /**
      * Mock file type validation
      */
     async mockFileTypeValidation(
       allowedTypes: string[] = ['.netcanvas', '.json'],
     ) {
       await this.page.addInitScript((allowedTypes) => {
         // Override file input validation
         const originalAccept = Object.getOwnPropertyDescriptor(
           HTMLInputElement.prototype,
           'accept',
         );
         Object.defineProperty(HTMLInputElement.prototype, 'accept', {
           get: function () {
             return allowedTypes.join(',');
           },
           set: function (value) {
             if (originalAccept?.set) {
               originalAccept.set.call(this, value);
             }
           },
         });
       }, allowedTypes);
     }

     /**
      * Reset all mocks
      */
     async resetMocks() {
       await this.page.unrouteAll();
       this.mockResponses.clear();
     }

     /**
      * Get upload statistics for testing
      */
     getUploadStats() {
       return {
         totalUploads: this.mockResponses.size,
         responses: Array.from(this.mockResponses.entries()),
       };
     }
   }
   ```

3. **Create UploadThing test fixtures**:

   ```bash
   touch tests/e2e/fixtures/uploadthing.ts
   ```

4. **Add UploadThing fixtures**:

   ```typescript
   // tests/e2e/fixtures/uploadthing.ts
   import { test as base } from '@playwright/test';
   import { test as pageTest } from './pages';
   import { UploadThingMocker } from '../utils/mocks/uploadthing';

   export interface UploadThingFixtures {
     uploadThingMocker: UploadThingMocker;
     mockUploadSuccess: () => Promise<void>;
     mockUploadFailure: (
       errorType?: 'network' | 'auth' | 'quota' | 'invalid-file',
     ) => Promise<void>;
     mockConnectionTest: (isValid?: boolean) => Promise<void>;
   }

   export const test = pageTest.extend<UploadThingFixtures>({
     uploadThingMocker: async ({ page }, use) => {
       const mocker = new UploadThingMocker(page);
       await use(mocker);
       await mocker.resetMocks();
     },

     mockUploadSuccess: async ({ uploadThingMocker }, use) => {
       const mockSuccess = async () => {
         await uploadThingMocker.mockFileUpload({
           shouldFail: false,
           delayMs: 500,
           fileSize: 2048,
         });
       };
       await use(mockSuccess);
     },

     mockUploadFailure: async ({ uploadThingMocker }, use) => {
       const mockFailure = async (errorType = 'network') => {
         await uploadThingMocker.mockFileUpload({
           shouldFail: true,
           errorType,
         });
       };
       await use(mockFailure);
     },

     mockConnectionTest: async ({ uploadThingMocker }, use) => {
       const mockConnection = async (isValid = true) => {
         await uploadThingMocker.mockConnectionTest(isValid);
       };
       await use(mockConnection);
     },
   });

   export { expect } from '@playwright/test';
   ```

**Verification**: Create a simple test to verify UploadThing mocking works correctly.

## Task 7.2: Protocol File Upload Testing

**Objective**: Test the complete protocol import workflow, including .netcanvas file handling, validation, and import process.

**Steps**:

1. **Create protocol upload tests directory**:

   ```bash
   mkdir -p tests/e2e/uploads
   touch tests/e2e/uploads/protocol-import.spec.ts
   ```

2. **Add comprehensive protocol import tests**:

   ```typescript
   // tests/e2e/uploads/protocol-import.spec.ts
   import { test, expect } from '../fixtures/uploadthing';
   import JSZip from 'jszip';
   import path from 'path';
   import fs from 'fs';

   test.describe('Protocol Import via UploadThing', () => {
     test.beforeEach(async ({ dashboardData, mockUploadSuccess }) => {
       await mockUploadSuccess();
     });

     /**
      * Helper function to create a valid .netcanvas file
      */
     async function createNetCanvasFile(protocolData: any): Promise<string> {
       const zip = new JSZip();

       // Add protocol.json
       zip.file('protocol.json', JSON.stringify(protocolData, null, 2));

       // Add empty assets folder
       zip.folder('assets');

       // Generate zip file
       const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
       const tempPath = path.join(
         process.cwd(),
         'tests/e2e/test-data/files',
         `protocol-${Date.now()}.netcanvas`,
       );

       // Ensure directory exists
       const dir = path.dirname(tempPath);
       if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir, { recursive: true });
       }

       fs.writeFileSync(tempPath, zipBuffer);
       return tempPath;
     }

     test('should upload and import valid .netcanvas file', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
       db,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Create valid protocol data
       const protocolData = {
         name: 'Test UploadThing Protocol',
         description: 'Protocol uploaded via UploadThing in E2E test',
         schemaVersion: 6,
         lastModified: new Date().toISOString(),
         stages: [
           {
             id: 'name-generator-1',
             type: 'NameGenerator',
             label: 'Name Generator',
             prompts: [
               {
                 id: 'prompt-1',
                 text: 'Please name people you know',
                 variable: 'name',
                 nodeType: 'person',
               },
             ],
           },
         ],
         codebook: {
           node: {
             person: {
               name: 'Person',
               color: '#16a085',
               variables: {
                 name: {
                   name: 'Name',
                   type: 'text',
                 },
               },
             },
           },
           edge: {},
           ego: {
             variables: {},
           },
         },
         assetManifest: {},
       };

       const netCanvasFile = await createNetCanvasFile(protocolData);

       // Mock successful UploadThing response
       await uploadThingMocker.mockFileUpload({
         shouldFail: false,
         customResponse: [
           {
             key: 'test-protocol-key',
             name: 'test-protocol.netcanvas',
             size: 2048,
             url: 'https://utfs.io/f/test-protocol-key',
           },
         ],
       });

       // Click upload protocol button
       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       // Verify upload modal
       await expect(
         authenticatedPage.locator('[data-testid="upload-modal"]'),
       ).toBeVisible();

       // Upload file
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         netCanvasFile,
       );

       // Verify file is selected
       await expect(
         authenticatedPage.locator('[data-testid="selected-file"]'),
       ).toContainText('test-protocol');

       // Submit upload
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify upload progress
       await expect(
         authenticatedPage.locator('[data-testid="upload-progress"]'),
       ).toBeVisible();

       // Verify success
       await expect(
         authenticatedPage.locator('[data-testid="upload-success"]'),
       ).toBeVisible({ timeout: 10000 });
       await expect(
         authenticatedPage.locator('[data-testid="import-success"]'),
       ).toContainText('Protocol imported successfully');

       // Close modal
       await authenticatedPage.click('[data-testid="close-modal"]');

       // Verify protocol appears in table
       await expect(
         authenticatedPage.locator('[data-testid="data-table"]'),
       ).toContainText('Test UploadThing Protocol');

       // Verify protocol was saved in database
       const protocol = await db.protocol.findFirst({
         where: { name: 'Test UploadThing Protocol' },
       });
       expect(protocol).toBeTruthy();
       expect(protocol?.description).toBe(
         'Protocol uploaded via UploadThing in E2E test',
       );

       // Cleanup
       fs.unlinkSync(netCanvasFile);
     });

     test('should handle .netcanvas file with assets', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Create protocol with assets
       const protocolData = {
         name: 'Protocol with Assets',
         description: 'Protocol containing image and audio assets',
         schemaVersion: 6,
         lastModified: new Date().toISOString(),
         stages: [],
         codebook: { node: {}, edge: {}, ego: { variables: {} } },
         assetManifest: {
           'asset-1': {
             id: 'asset-1',
             name: 'test-image.png',
             source: 'test-image.png',
             type: 'image',
           },
           'asset-2': {
             id: 'asset-2',
             name: 'background-audio.mp3',
             source: 'background-audio.mp3',
             type: 'audio',
           },
         },
       };

       // Create zip with assets
       const zip = new JSZip();
       zip.file('protocol.json', JSON.stringify(protocolData, null, 2));

       // Add mock assets
       const assetsFolder = zip.folder('assets');
       const mockImageData = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header
       const mockAudioData = Buffer.from([0x49, 0x44, 0x33]); // MP3 header

       assetsFolder?.file('test-image.png', mockImageData);
       assetsFolder?.file('background-audio.mp3', mockAudioData);

       const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
       const netCanvasFile = path.join(
         process.cwd(),
         'tests/e2e/test-data/files',
         `protocol-with-assets-${Date.now()}.netcanvas`,
       );
       fs.writeFileSync(netCanvasFile, zipBuffer);

       // Mock UploadThing responses for multiple files
       await uploadThingMocker.mockFileUpload({
         customResponse: [
           {
             key: 'protocol-key',
             name: 'protocol-with-assets.netcanvas',
             size: zipBuffer.length,
             url: 'https://utfs.io/f/protocol-key',
           },
           {
             key: 'asset-1-key',
             name: 'test-image.png',
             size: mockImageData.length,
             url: 'https://utfs.io/f/asset-1-key',
           },
           {
             key: 'asset-2-key',
             name: 'background-audio.mp3',
             size: mockAudioData.length,
             url: 'https://utfs.io/f/asset-2-key',
           },
         ],
       });

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         netCanvasFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify asset upload progress
       await expect(
         authenticatedPage.locator('[data-testid="asset-upload-progress"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="uploading-assets"]'),
       ).toContainText('2 assets');

       // Verify success
       await expect(
         authenticatedPage.locator('[data-testid="upload-success"]'),
       ).toBeVisible({ timeout: 15000 });

       // Cleanup
       fs.unlinkSync(netCanvasFile);
     });

     test('should validate .netcanvas file structure', async ({
       authenticatedPage,
       dashboardPage,
       mockUploadFailure,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Create invalid .netcanvas file (missing protocol.json)
       const zip = new JSZip();
       zip.file('invalid.txt', 'This is not a protocol file');

       const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
       const invalidFile = path.join(
         process.cwd(),
         'tests/e2e/test-data/files',
         `invalid-${Date.now()}.netcanvas`,
       );
       fs.writeFileSync(invalidFile, zipBuffer);

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         invalidFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify validation error
       await expect(
         authenticatedPage.locator('[data-testid="validation-error"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="validation-error"]'),
       ).toContainText('protocol.json not found');

       // Cleanup
       fs.unlinkSync(invalidFile);
     });

     test('should handle UploadThing upload failures', async ({
       authenticatedPage,
       dashboardPage,
       mockUploadFailure,
     }) => {
       await dashboardPage.navigateToProtocols();

       await mockUploadFailure('quota');

       const protocolData = {
         name: 'Test Protocol',
         schemaVersion: 6,
         stages: [],
         codebook: { node: {}, edge: {}, ego: { variables: {} } },
       };

       const netCanvasFile = await createNetCanvasFile(protocolData);

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         netCanvasFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify error handling
       await expect(
         authenticatedPage.locator('[data-testid="upload-error"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="upload-error"]'),
       ).toContainText('quota exceeded');

       // Verify retry option
       await expect(
         authenticatedPage.locator('[data-testid="retry-upload"]'),
       ).toBeVisible();

       // Cleanup
       fs.unlinkSync(netCanvasFile);
     });

     test('should show upload progress for large files', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Mock slow upload with progress updates
       await uploadThingMocker.mockFileUpload({
         shouldFail: false,
         delayMs: 2000,
         fileSize: 5 * 1024 * 1024, // 5MB
       });

       const protocolData = {
         name: 'Large Protocol',
         schemaVersion: 6,
         stages: Array.from({ length: 100 }, (_, i) => ({
           id: `stage-${i}`,
           type: 'NameGenerator',
           label: `Stage ${i}`,
         })),
         codebook: { node: {}, edge: {}, ego: { variables: {} } },
       };

       const netCanvasFile = await createNetCanvasFile(protocolData);

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         netCanvasFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify progress indicators
       await expect(
         authenticatedPage.locator('[data-testid="upload-progress-bar"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="upload-percentage"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="upload-speed"]'),
       ).toBeVisible();

       // Simulate progress updates
       await uploadThingMocker.simulateUploadProgress(
         authenticatedPage,
         [10, 30, 60, 90, 100],
       );

       // Verify completion
       await expect(
         authenticatedPage.locator('[data-testid="upload-success"]'),
       ).toBeVisible({ timeout: 5000 });

       // Cleanup
       fs.unlinkSync(netCanvasFile);
     });

     test('should handle protocol import with validation warnings', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Create protocol with potential validation issues
       const protocolData = {
         name: 'Protocol with Warnings',
         description: 'Protocol that may have validation warnings',
         schemaVersion: 5, // Older schema version
         lastModified: new Date().toISOString(),
         stages: [
           {
             id: 'stage-1',
             type: 'NameGenerator',
             // Missing some recommended fields
           },
         ],
         codebook: { node: {}, edge: {}, ego: { variables: {} } },
       };

       const netCanvasFile = await createNetCanvasFile(protocolData);

       await uploadThingMocker.mockFileUpload({
         customResponse: [
           {
             key: 'warning-protocol-key',
             name: 'protocol-with-warnings.netcanvas',
             size: 1024,
             url: 'https://utfs.io/f/warning-protocol-key',
           },
         ],
       });

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         netCanvasFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify warning modal
       await expect(
         authenticatedPage.locator('[data-testid="validation-warnings"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="schema-version-warning"]'),
       ).toContainText('older schema version');

       // Choose to proceed despite warnings
       await authenticatedPage.click('[data-testid="proceed-with-warnings"]');

       // Verify successful import
       await expect(
         authenticatedPage.locator('[data-testid="upload-success"]'),
       ).toBeVisible();

       // Cleanup
       fs.unlinkSync(netCanvasFile);
     });

     test('should support cancelling upload', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Mock slow upload
       await uploadThingMocker.mockFileUpload({
         delayMs: 5000,
       });

       const protocolData = {
         name: 'Cancellable Upload',
         schemaVersion: 6,
         stages: [],
         codebook: { node: {}, edge: {}, ego: { variables: {} } },
       };

       const netCanvasFile = await createNetCanvasFile(protocolData);

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         netCanvasFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Wait for upload to start
       await expect(
         authenticatedPage.locator('[data-testid="upload-progress"]'),
       ).toBeVisible();

       // Cancel upload
       await authenticatedPage.click('[data-testid="cancel-upload"]');

       // Verify cancellation
       await expect(
         authenticatedPage.locator('[data-testid="upload-cancelled"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="upload-progress"]'),
       ).not.toBeVisible();

       // Cleanup
       fs.unlinkSync(netCanvasFile);
     });
   });
   ```

**Verification**: Run protocol import tests to ensure .netcanvas file handling works correctly.

## Task 7.3: Asset Management Testing

**Objective**: Test asset upload, storage, and management functionality within protocols.

**Steps**:

1. **Create asset management tests**:

   ```bash
   touch tests/e2e/uploads/asset-management.spec.ts
   ```

2. **Add comprehensive asset management tests**:

   ```typescript
   // tests/e2e/uploads/asset-management.spec.ts
   import { test, expect } from '../fixtures/uploadthing';
   import JSZip from 'jszip';
   import path from 'path';
   import fs from 'fs';

   test.describe('Asset Management via UploadThing', () => {
     test.beforeEach(async ({ dashboardData, mockUploadSuccess }) => {
       await mockUploadSuccess();
     });

     /**
      * Create mock asset files for testing
      */
     function createMockAssets() {
       return {
         image: {
           data: Buffer.from([
             0x89,
             0x50,
             0x4e,
             0x47,
             0x0d,
             0x0a,
             0x1a,
             0x0a, // PNG signature
             0x00,
             0x00,
             0x00,
             0x0d,
             0x49,
             0x48,
             0x44,
             0x52, // IHDR chunk
             0x00,
             0x00,
             0x00,
             0x01,
             0x00,
             0x00,
             0x00,
             0x01, // 1x1 image
             0x08,
             0x02,
             0x00,
             0x00,
             0x00,
             0x90,
             0x77,
             0x53,
             0xde,
             0x00,
             0x00,
             0x00,
             0x0c,
             0x49,
             0x44,
             0x41,
             0x54,
             0x08,
             0xd7,
             0x63,
             0xf8,
             0x00,
             0x00,
             0x00,
             0x01,
             0x00,
             0x01,
             0x5c,
             0xcc,
             0x5e,
             0x27,
             0x00,
             0x00,
             0x00,
             0x00,
             0x49,
             0x45,
             0x4e,
             0x44,
             0xae,
             0x42,
             0x60,
             0x82,
           ]),
           name: 'test-image.png',
           type: 'image',
         },
         audio: {
           data: Buffer.from([
             0x49,
             0x44,
             0x33,
             0x03,
             0x00,
             0x00,
             0x00,
             0x00, // ID3 header
             0x00,
             0x00,
             0xff,
             0xfb,
             0x90,
             0x00, // MP3 frame header
           ]),
           name: 'test-audio.mp3',
           type: 'audio',
         },
         video: {
           data: Buffer.from([
             0x00,
             0x00,
             0x00,
             0x20,
             0x66,
             0x74,
             0x79,
             0x70, // MP4 header
             0x69,
             0x73,
             0x6f,
             0x6d,
             0x00,
             0x00,
             0x02,
             0x00,
           ]),
           name: 'test-video.mp4',
           type: 'video',
         },
       };
     }

     test('should upload protocol with image assets', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
       db,
     }) => {
       await dashboardPage.navigateToProtocols();

       const mockAssets = createMockAssets();

       const protocolData = {
         name: 'Protocol with Images',
         description: 'Testing image asset upload',
         schemaVersion: 6,
         lastModified: new Date().toISOString(),
         stages: [
           {
             id: 'info-stage',
             type: 'Information',
             label: 'Information Stage',
             items: [
               {
                 id: 'info-1',
                 content: 'Welcome! Here is an image:',
                 image: 'image-asset-1',
               },
             ],
           },
         ],
         codebook: { node: {}, edge: {}, ego: { variables: {} } },
         assetManifest: {
           'image-asset-1': {
             id: 'image-asset-1',
             name: mockAssets.image.name,
             source: mockAssets.image.name,
             type: mockAssets.image.type,
           },
         },
       };

       // Create .netcanvas file with assets
       const zip = new JSZip();
       zip.file('protocol.json', JSON.stringify(protocolData, null, 2));
       const assetsFolder = zip.folder('assets');
       assetsFolder?.file(mockAssets.image.name, mockAssets.image.data);

       const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
       const netCanvasFile = path.join(
         process.cwd(),
         'tests/e2e/test-data/files',
         `protocol-images-${Date.now()}.netcanvas`,
       );
       fs.writeFileSync(netCanvasFile, zipBuffer);

       // Mock UploadThing responses for protocol and assets
       await uploadThingMocker.mockFileUpload({
         customResponse: [
           {
             key: 'protocol-with-images-key',
             name: 'protocol-with-images.netcanvas',
             size: zipBuffer.length,
             url: 'https://utfs.io/f/protocol-with-images-key',
           },
           {
             key: 'image-asset-1-key',
             name: mockAssets.image.name,
             size: mockAssets.image.data.length,
             url: 'https://utfs.io/f/image-asset-1-key',
           },
         ],
       });

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         netCanvasFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify asset processing
       await expect(
         authenticatedPage.locator('[data-testid="processing-assets"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="asset-count"]'),
       ).toContainText('1 asset');

       // Verify successful upload
       await expect(
         authenticatedPage.locator('[data-testid="upload-success"]'),
       ).toBeVisible({ timeout: 10000 });

       // Verify assets were saved in database
       const assets = await db.asset.findMany({
         where: { name: mockAssets.image.name },
       });
       expect(assets).toHaveLength(1);
       expect(assets[0].type).toBe('image');
       expect(assets[0].url).toContain('utfs.io');

       // Cleanup
       fs.unlinkSync(netCanvasFile);
     });

     test('should handle multiple asset types in one protocol', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
     }) => {
       await dashboardPage.navigateToProtocols();

       const mockAssets = createMockAssets();

       const protocolData = {
         name: 'Multi-Asset Protocol',
         description: 'Protocol with multiple asset types',
         schemaVersion: 6,
         lastModified: new Date().toISOString(),
         stages: [],
         codebook: { node: {}, edge: {}, ego: { variables: {} } },
         assetManifest: {
           'asset-1': {
             id: 'asset-1',
             name: mockAssets.image.name,
             source: mockAssets.image.name,
             type: mockAssets.image.type,
           },
           'asset-2': {
             id: 'asset-2',
             name: mockAssets.audio.name,
             source: mockAssets.audio.name,
             type: mockAssets.audio.type,
           },
           'asset-3': {
             id: 'asset-3',
             name: mockAssets.video.name,
             source: mockAssets.video.name,
             type: mockAssets.video.type,
           },
         },
       };

       // Create .netcanvas with multiple assets
       const zip = new JSZip();
       zip.file('protocol.json', JSON.stringify(protocolData, null, 2));
       const assetsFolder = zip.folder('assets');

       Object.values(mockAssets).forEach((asset) => {
         assetsFolder?.file(asset.name, asset.data);
       });

       const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
       const netCanvasFile = path.join(
         process.cwd(),
         'tests/e2e/test-data/files',
         `multi-assets-${Date.now()}.netcanvas`,
       );
       fs.writeFileSync(netCanvasFile, zipBuffer);

       // Mock responses for all assets
       await uploadThingMocker.mockFileUpload({
         customResponse: [
           {
             key: 'protocol-key',
             name: 'multi-assets.netcanvas',
             size: zipBuffer.length,
             url: 'https://utfs.io/f/protocol-key',
           },
           {
             key: 'image-key',
             name: mockAssets.image.name,
             size: mockAssets.image.data.length,
             url: 'https://utfs.io/f/image-key',
           },
           {
             key: 'audio-key',
             name: mockAssets.audio.name,
             size: mockAssets.audio.data.length,
             url: 'https://utfs.io/f/audio-key',
           },
           {
             key: 'video-key',
             name: mockAssets.video.name,
             size: mockAssets.video.data.length,
             url: 'https://utfs.io/f/video-key',
           },
         ],
       });

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         netCanvasFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify multiple asset processing
       await expect(
         authenticatedPage.locator('[data-testid="asset-count"]'),
       ).toContainText('3 assets');
       await expect(
         authenticatedPage.locator('[data-testid="asset-types"]'),
       ).toContainText('image, audio, video');

       // Verify individual asset progress
       await expect(
         authenticatedPage.locator('[data-testid="asset-progress-image"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="asset-progress-audio"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="asset-progress-video"]'),
       ).toBeVisible();

       // Verify success
       await expect(
         authenticatedPage.locator('[data-testid="upload-success"]'),
       ).toBeVisible({ timeout: 15000 });

       // Cleanup
       fs.unlinkSync(netCanvasFile);
     });

     test('should handle asset upload failures gracefully', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
     }) => {
       await dashboardPage.navigateToProtocols();

       const mockAssets = createMockAssets();

       const protocolData = {
         name: 'Asset Failure Test',
         schemaVersion: 6,
         stages: [],
         codebook: { node: {}, edge: {}, ego: { variables: {} } },
         assetManifest: {
           'failing-asset': {
             id: 'failing-asset',
             name: mockAssets.image.name,
             source: mockAssets.image.name,
             type: mockAssets.image.type,
           },
         },
       };

       const zip = new JSZip();
       zip.file('protocol.json', JSON.stringify(protocolData, null, 2));
       const assetsFolder = zip.folder('assets');
       assetsFolder?.file(mockAssets.image.name, mockAssets.image.data);

       const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
       const netCanvasFile = path.join(
         process.cwd(),
         'tests/e2e/test-data/files',
         `asset-failure-${Date.now()}.netcanvas`,
       );
       fs.writeFileSync(netCanvasFile, zipBuffer);

       // Mock partial failure (protocol succeeds, asset fails)
       await page.route('**/api/uploadthing/**', (route) => {
         const url = route.request().url();
         if (url.includes('protocol')) {
           route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify([
               {
                 key: 'protocol-key',
                 name: 'asset-failure-test.netcanvas',
                 size: zipBuffer.length,
                 url: 'https://utfs.io/f/protocol-key',
               },
             ]),
           });
         } else {
           // Fail asset upload
           route.fulfill({
             status: 500,
             contentType: 'application/json',
             body: JSON.stringify({ error: 'Asset upload failed' }),
           });
         }
       });

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         netCanvasFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify partial failure handling
       await expect(
         authenticatedPage.locator('[data-testid="partial-failure"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="failed-assets"]'),
       ).toContainText('1 asset failed');

       // Verify retry option for failed assets
       await expect(
         authenticatedPage.locator('[data-testid="retry-failed-assets"]'),
       ).toBeVisible();

       // Cleanup
       fs.unlinkSync(netCanvasFile);
     });

     test('should validate asset file types', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToProtocols();

       const protocolData = {
         name: 'Invalid Asset Test',
         schemaVersion: 6,
         stages: [],
         codebook: { node: {}, edge: {}, ego: { variables: {} } },
         assetManifest: {
           'invalid-asset': {
             id: 'invalid-asset',
             name: 'malicious-script.js',
             source: 'malicious-script.js',
             type: 'script',
           },
         },
       };

       const zip = new JSZip();
       zip.file('protocol.json', JSON.stringify(protocolData, null, 2));
       const assetsFolder = zip.folder('assets');
       assetsFolder?.file('malicious-script.js', 'alert("malicious code");');

       const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
       const netCanvasFile = path.join(
         process.cwd(),
         'tests/e2e/test-data/files',
         `invalid-asset-${Date.now()}.netcanvas`,
       );
       fs.writeFileSync(netCanvasFile, zipBuffer);

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         netCanvasFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify asset validation error
       await expect(
         authenticatedPage.locator('[data-testid="asset-validation-error"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="invalid-asset-types"]'),
       ).toContainText('script');

       // Cleanup
       fs.unlinkSync(netCanvasFile);
     });

     test('should show asset preview during upload', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
     }) => {
       await dashboardPage.navigateToProtocols();

       const mockAssets = createMockAssets();

       const protocolData = {
         name: 'Asset Preview Test',
         schemaVersion: 6,
         stages: [],
         codebook: { node: {}, edge: {}, ego: { variables: {} } },
         assetManifest: {
           'preview-asset': {
             id: 'preview-asset',
             name: mockAssets.image.name,
             source: mockAssets.image.name,
             type: mockAssets.image.type,
           },
         },
       };

       const zip = new JSZip();
       zip.file('protocol.json', JSON.stringify(protocolData, null, 2));
       const assetsFolder = zip.folder('assets');
       assetsFolder?.file(mockAssets.image.name, mockAssets.image.data);

       const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
       const netCanvasFile = path.join(
         process.cwd(),
         'tests/e2e/test-data/files',
         `asset-preview-${Date.now()}.netcanvas`,
       );
       fs.writeFileSync(netCanvasFile, zipBuffer);

       await uploadThingMocker.mockFileUpload({ delayMs: 1000 });

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         netCanvasFile,
       );

       // Verify asset preview in modal
       await expect(
         authenticatedPage.locator('[data-testid="asset-preview"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="asset-thumbnail"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="asset-filename"]'),
       ).toContainText(mockAssets.image.name);
       await expect(
         authenticatedPage.locator('[data-testid="asset-type"]'),
       ).toContainText('image');

       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify upload progress with asset details
       await expect(
         authenticatedPage.locator('[data-testid="uploading-asset-name"]'),
       ).toContainText(mockAssets.image.name);

       // Cleanup
       fs.unlinkSync(netCanvasFile);
     });

     test('should handle asset size limits', async ({
       authenticatedPage,
       dashboardPage,
       mockUploadFailure,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Create large asset (simulate)
       const largeAssetData = Buffer.alloc(50 * 1024 * 1024); // 50MB

       const protocolData = {
         name: 'Large Asset Test',
         schemaVersion: 6,
         stages: [],
         codebook: { node: {}, edge: {}, ego: { variables: {} } },
         assetManifest: {
           'large-asset': {
             id: 'large-asset',
             name: 'large-video.mp4',
             source: 'large-video.mp4',
             type: 'video',
           },
         },
       };

       const zip = new JSZip();
       zip.file('protocol.json', JSON.stringify(protocolData, null, 2));
       const assetsFolder = zip.folder('assets');
       assetsFolder?.file('large-video.mp4', largeAssetData);

       const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
       const netCanvasFile = path.join(
         process.cwd(),
         'tests/e2e/test-data/files',
         `large-asset-${Date.now()}.netcanvas`,
       );
       fs.writeFileSync(netCanvasFile, zipBuffer);

       // Mock size limit error
       await mockUploadFailure('quota');

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         netCanvasFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify size limit error
       await expect(
         authenticatedPage.locator('[data-testid="size-limit-error"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="size-limit-error"]'),
       ).toContainText('too large');

       // Cleanup
       fs.unlinkSync(netCanvasFile);
     });
   });
   ```

**Verification**: Run asset management tests to ensure file handling works across different asset types.

## Task 7.4: File Upload UI/UX Testing

**Objective**: Test the user interface and experience aspects of file upload functionality.

**Steps**:

1. **Create file upload UI tests**:

   ```bash
   touch tests/e2e/uploads/upload-ui.spec.ts
   ```

2. **Add comprehensive UI/UX tests**:

   ```typescript
   // tests/e2e/uploads/upload-ui.spec.ts
   import { test, expect } from '../fixtures/uploadthing';

   test.describe('File Upload UI/UX', () => {
     test.beforeEach(async ({ dashboardData, mockUploadSuccess }) => {
       await mockUploadSuccess();
     });

     test('should display upload modal with correct elements', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Open upload modal
       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       // Verify modal structure
       await expect(
         authenticatedPage.locator('[data-testid="upload-modal"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="modal-title"]'),
       ).toContainText('Upload Protocol');

       // Verify upload area elements
       await expect(
         authenticatedPage.locator('[data-testid="dropzone"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="dropzone-text"]'),
       ).toContainText('Drag and drop');
       await expect(
         authenticatedPage.locator('[data-testid="file-input-button"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="supported-formats"]'),
       ).toContainText('.netcanvas');

       // Verify action buttons
       await expect(
         authenticatedPage.locator('[data-testid="upload-submit"]'),
       ).toBeDisabled();
       await expect(
         authenticatedPage.locator('[data-testid="modal-cancel"]'),
       ).toBeEnabled();
     });

     test('should handle drag and drop interactions', async ({
       authenticatedPage,
       dashboardPage,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       const dropzone = authenticatedPage.locator('[data-testid="dropzone"]');

       // Test drag enter
       await dropzone.dispatchEvent('dragenter', {
         dataTransfer: {
           files: [],
         },
       });

       // Verify dropzone becomes active
       await expect(dropzone).toHaveClass(/drag-active/);
       await expect(
         authenticatedPage.locator('[data-testid="drop-indicator"]'),
       ).toBeVisible();

       // Test drag leave
       await dropzone.dispatchEvent('dragleave');
       await expect(dropzone).not.toHaveClass(/drag-active/);

       // Test valid file drop
       const protocolFile = fileHelper.createTestProtocolFile();
       await dropzone.setInputFiles(protocolFile);

       // Verify file selection
       await expect(
         authenticatedPage.locator('[data-testid="selected-file"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="upload-submit"]'),
       ).toBeEnabled();
     });

     test('should show file selection feedback', async ({
       authenticatedPage,
       dashboardPage,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       const protocolFile = fileHelper.createTestProtocolFile({
         name: 'UI Test Protocol',
         description: 'Testing file selection UI',
       });

       // Select file via input
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         protocolFile,
       );

       // Verify file info display
       await expect(
         authenticatedPage.locator('[data-testid="selected-file"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="file-name"]'),
       ).toContainText('protocol');
       await expect(
         authenticatedPage.locator('[data-testid="file-size"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="file-type"]'),
       ).toContainText('netcanvas');

       // Verify remove file option
       await expect(
         authenticatedPage.locator('[data-testid="remove-file"]'),
       ).toBeVisible();

       // Test file removal
       await authenticatedPage.click('[data-testid="remove-file"]');
       await expect(
         authenticatedPage.locator('[data-testid="selected-file"]'),
       ).not.toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="upload-submit"]'),
       ).toBeDisabled();
     });

     test('should display upload progress indicators', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Mock slow upload for progress testing
       await uploadThingMocker.mockFileUpload({
         delayMs: 3000,
         fileSize: 2 * 1024 * 1024, // 2MB
       });

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       const protocolFile = fileHelper.createTestProtocolFile();
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         protocolFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify progress indicators appear
       await expect(
         authenticatedPage.locator('[data-testid="upload-progress"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="progress-bar"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="progress-percentage"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="upload-speed"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="time-remaining"]'),
       ).toBeVisible();

       // Verify cancel button during upload
       await expect(
         authenticatedPage.locator('[data-testid="cancel-upload"]'),
       ).toBeVisible();

       // Verify modal can't be closed during upload
       await expect(
         authenticatedPage.locator('[data-testid="modal-cancel"]'),
       ).toBeDisabled();
     });

     test('should handle file validation errors with clear messages', async ({
       authenticatedPage,
       dashboardPage,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       // Test with wrong file type
       const invalidFile = fileHelper.createTestImageFile();
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         invalidFile,
       );

       // Verify immediate validation error
       await expect(
         authenticatedPage.locator('[data-testid="file-validation-error"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="file-validation-error"]'),
       ).toContainText('Invalid file type');
       await expect(
         authenticatedPage.locator(
           '[data-testid="supported-formats-reminder"]',
         ),
       ).toBeVisible();

       // Verify upload button remains disabled
       await expect(
         authenticatedPage.locator('[data-testid="upload-submit"]'),
       ).toBeDisabled();

       // Test file size error
       await page.evaluate(() => {
         // Mock large file size
         const fileInput = document.querySelector(
           '[data-testid="protocol-file-input"]',
         ) as HTMLInputElement;
         if (fileInput && fileInput.files && fileInput.files[0]) {
           Object.defineProperty(fileInput.files[0], 'size', {
             value: 100 * 1024 * 1024,
           }); // 100MB
         }
       });

       await expect(
         authenticatedPage.locator('[data-testid="file-size-error"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="file-size-error"]'),
       ).toContainText('too large');
     });

     test('should show success and error states clearly', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       const protocolFile = fileHelper.createTestProtocolFile({
         name: 'Success Test Protocol',
       });

       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         protocolFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify success state
       await expect(
         authenticatedPage.locator('[data-testid="upload-success"]'),
       ).toBeVisible({ timeout: 5000 });
       await expect(
         authenticatedPage.locator('[data-testid="success-message"]'),
       ).toContainText('successfully');
       await expect(
         authenticatedPage.locator('[data-testid="success-icon"]'),
       ).toBeVisible();

       // Verify action buttons in success state
       await expect(
         authenticatedPage.locator('[data-testid="view-protocol"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="upload-another"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="close-modal"]'),
       ).toBeVisible();

       // Test upload another
       await authenticatedPage.click('[data-testid="upload-another"]');
       await expect(
         authenticatedPage.locator('[data-testid="dropzone"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="upload-success"]'),
       ).not.toBeVisible();
     });

     test('should provide helpful error recovery options', async ({
       authenticatedPage,
       dashboardPage,
       mockUploadFailure,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       await mockUploadFailure('network');

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       const protocolFile = fileHelper.createTestProtocolFile();
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         protocolFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify error state
       await expect(
         authenticatedPage.locator('[data-testid="upload-error"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="error-message"]'),
       ).toContainText('Network error');
       await expect(
         authenticatedPage.locator('[data-testid="error-icon"]'),
       ).toBeVisible();

       // Verify recovery options
       await expect(
         authenticatedPage.locator('[data-testid="retry-upload"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="choose-different-file"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="error-details"]'),
       ).toBeVisible();

       // Test retry functionality
       await uploadThingMocker.mockFileUpload({ shouldFail: false });
       await authenticatedPage.click('[data-testid="retry-upload"]');

       // Should attempt upload again
       await expect(
         authenticatedPage.locator('[data-testid="upload-progress"]'),
       ).toBeVisible();
     });

     test('should be accessible and keyboard navigable', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Test keyboard navigation to upload button
       await authenticatedPage.keyboard.press('Tab');
       await authenticatedPage.keyboard.press('Tab');
       await authenticatedPage.keyboard.press('Enter');

       // Verify modal opened
       await expect(
         authenticatedPage.locator('[data-testid="upload-modal"]'),
       ).toBeVisible();

       // Test focus management in modal
       await expect(
         authenticatedPage.locator('[data-testid="file-input-button"]'),
       ).toBeFocused();

       // Test escape to close
       await authenticatedPage.keyboard.press('Escape');
       await expect(
         authenticatedPage.locator('[data-testid="upload-modal"]'),
       ).not.toBeVisible();

       // Verify focus returns to trigger
       await expect(
         authenticatedPage.locator('[data-testid="upload-protocol-button"]'),
       ).toBeFocused();
     });

     test('should handle browser compatibility gracefully', async ({
       authenticatedPage,
       dashboardPage,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Mock missing File API
       await authenticatedPage.addInitScript(() => {
         delete (window as any).File;
         delete (window as any).FileReader;
       });

       await authenticatedPage.reload();
       await dashboardPage.navigateToProtocols();

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       // Verify fallback UI
       const compatibilityWarning = authenticatedPage.locator(
         '[data-testid="compatibility-warning"]',
       );
       if (await compatibilityWarning.isVisible()) {
         await expect(compatibilityWarning).toContainText('browser');
         await expect(
           authenticatedPage.locator('[data-testid="basic-file-input"]'),
         ).toBeVisible();
       }
     });

     test('should show appropriate loading states', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       // Test validation loading
       await uploadThingMocker.mockFileUpload({ delayMs: 1000 });

       const protocolFile = fileHelper.createTestProtocolFile();
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         protocolFile,
       );

       // Verify file analysis loading
       await expect(
         authenticatedPage.locator('[data-testid="analyzing-file"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="file-analysis-spinner"]'),
       ).toBeVisible();

       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify upload loading states
       await expect(
         authenticatedPage.locator('[data-testid="preparing-upload"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="upload-progress"]'),
       ).toBeVisible();

       // Verify completion loading
       await expect(
         authenticatedPage.locator('[data-testid="processing-protocol"]'),
       ).toBeVisible();
     });
   });
   ```

**Verification**: Run file upload UI tests to ensure user experience is smooth and intuitive.

## Task 7.5: Integration Testing with UploadThing

**Objective**: Test the complete integration between Fresco and UploadThing service, including error scenarios and edge cases.

**Steps**:

1. **Create UploadThing integration tests**:

   ```bash
   touch tests/e2e/uploads/uploadthing-integration.spec.ts
   ```

2. **Add comprehensive integration tests**:

   ```typescript
   // tests/e2e/uploads/uploadthing-integration.spec.ts
   import { test, expect } from '../fixtures/uploadthing';

   test.describe('UploadThing Integration', () => {
     test.beforeEach(async ({ dashboardData, mockConnectionTest }) => {
       await mockConnectionTest(true);
     });

     test('should test UploadThing connection during setup', async ({
       page,
       setupPage,
       uploadThingMocker,
     }) => {
       // Start fresh setup
       await page.goto('/setup');

       // Complete account creation
       await setupPage.createAccount('testuser', 'testPassword123!');
       await setupPage.clickNext();

       // Test invalid token
       await uploadThingMocker.mockConnectionTest(false);

       await setupPage.fillUploadThingToken('sk_live_invalidtoken');
       await page.click('[data-testid="test-connection-button"]');

       // Verify error handling
       await expect(
         page.locator('[data-testid="connection-error"]'),
       ).toBeVisible();
       await expect(
         page.locator('[data-testid="connection-error"]'),
       ).toContainText('Invalid API key');

       // Test valid token
       await uploadThingMocker.mockConnectionTest(true, 'test-app-valid');

       await setupPage.fillUploadThingToken('sk_live_validtoken123');
       await page.click('[data-testid="test-connection-button"]');

       // Verify success
       await expect(
         page.locator('[data-testid="connection-success"]'),
       ).toBeVisible();
       await expect(
         page.locator('[data-testid="app-id-display"]'),
       ).toContainText('test-app-valid');
     });

     test('should handle UploadThing rate limiting', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Mock rate limiting response
       await uploadThingMocker.mockFileUpload({
         shouldFail: true,
         errorType: 'network',
         customResponse: null,
       });

       await page.route('**/api/uploadthing/**', (route) => {
         route.fulfill({
           status: 429,
           contentType: 'application/json',
           body: JSON.stringify({
             error: 'Rate limit exceeded',
             retryAfter: 60,
           }),
           headers: {
             'Retry-After': '60',
           },
         });
       });

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       const protocolFile = fileHelper.createTestProtocolFile();
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         protocolFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify rate limit handling
       await expect(
         authenticatedPage.locator('[data-testid="rate-limit-error"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="retry-after"]'),
       ).toContainText('60 seconds');

       // Verify automatic retry countdown
       await expect(
         authenticatedPage.locator('[data-testid="retry-countdown"]'),
       ).toBeVisible();
     });

     test('should handle UploadThing quota exceeded', async ({
       authenticatedPage,
       dashboardPage,
       mockUploadFailure,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       await mockUploadFailure('quota');

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       const protocolFile = fileHelper.createTestProtocolFile();
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         protocolFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify quota error handling
       await expect(
         authenticatedPage.locator('[data-testid="quota-exceeded-error"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="quota-exceeded-error"]'),
       ).toContainText('storage quota');

       // Verify helpful guidance
       await expect(
         authenticatedPage.locator('[data-testid="quota-help"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="upgrade-suggestion"]'),
       ).toBeVisible();
     });

     test('should handle UploadThing authentication errors', async ({
       authenticatedPage,
       dashboardPage,
       mockUploadFailure,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       await mockUploadFailure('auth');

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       const protocolFile = fileHelper.createTestProtocolFile();
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         protocolFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify auth error handling
       await expect(
         authenticatedPage.locator('[data-testid="auth-error"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="auth-error"]'),
       ).toContainText('API key');

       // Verify suggestion to reconfigure
       await expect(
         authenticatedPage.locator('[data-testid="reconfigure-uploadthing"]'),
       ).toBeVisible();
     });

     test('should handle network failures gracefully', async ({
       authenticatedPage,
       dashboardPage,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Mock network failure
       await page.route('**/api/uploadthing/**', (route) => {
         route.abort();
       });

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       const protocolFile = fileHelper.createTestProtocolFile();
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         protocolFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify network error handling
       await expect(
         authenticatedPage.locator('[data-testid="network-error"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="network-error"]'),
       ).toContainText('network');

       // Verify offline detection
       const offlineIndicator = authenticatedPage.locator(
         '[data-testid="offline-indicator"]',
       );
       if (await offlineIndicator.isVisible()) {
         await expect(offlineIndicator).toContainText('offline');
       }

       // Verify retry when back online
       await page.unroute('**/api/uploadthing/**');
       await authenticatedPage.click('[data-testid="retry-when-online"]');

       // Should attempt upload again
       await expect(
         authenticatedPage.locator('[data-testid="upload-progress"]'),
       ).toBeVisible();
     });

     test('should validate UploadThing configuration in settings', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
     }) => {
       await dashboardPage.navigateToSettings();

       // Test current configuration
       await authenticatedPage.click(
         '[data-testid="test-uploadthing-connection"]',
       );

       // Mock successful test
       await uploadThingMocker.mockConnectionTest(true, 'current-app-id');

       await expect(
         authenticatedPage.locator('[data-testid="connection-status"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="connection-success"]'),
       ).toContainText('successful');

       // Update token and test again
       await authenticatedPage.fill(
         '[name="uploadThingToken"]',
         'sk_live_newtoken456',
       );
       await authenticatedPage.click('[data-testid="test-connection-button"]');

       // Mock new token test
       await uploadThingMocker.mockConnectionTest(true, 'new-app-id');

       await expect(
         authenticatedPage.locator('[data-testid="new-connection-success"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="app-id-changed"]'),
       ).toContainText('new-app-id');
     });

     test('should handle concurrent uploads to UploadThing', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Mock successful uploads with delays
       await uploadThingMocker.mockFileUpload({
         delayMs: 2000,
         fileSize: 1024 * 1024,
       });

       // Start first upload
       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       const protocolFile1 = fileHelper.createTestProtocolFile({
         name: 'Protocol 1',
       });
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         protocolFile1,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify first upload started
       await expect(
         authenticatedPage.locator('[data-testid="upload-progress"]'),
       ).toBeVisible();

       // Try to start second upload (should be queued or prevented)
       await authenticatedPage.keyboard.press('Escape');
       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       // Should show queue status or prevent concurrent upload
       const queueStatus = authenticatedPage.locator(
         '[data-testid="upload-queue-status"]',
       );
       const concurrentPrevented = authenticatedPage.locator(
         '[data-testid="concurrent-upload-prevented"]',
       );

       const hasQueue = await queueStatus.isVisible();
       const isPrevented = await concurrentPrevented.isVisible();

       expect(hasQueue || isPrevented).toBe(true);
     });

     test('should handle UploadThing service maintenance', async ({
       authenticatedPage,
       dashboardPage,
       fileHelper,
     }) => {
       await dashboardPage.navigateToProtocols();

       // Mock service maintenance response
       await page.route('**/api/uploadthing/**', (route) => {
         route.fulfill({
           status: 503,
           contentType: 'application/json',
           body: JSON.stringify({
             error: 'Service temporarily unavailable',
             maintenanceUntil: new Date(Date.now() + 3600000).toISOString(), // 1 hour
           }),
         });
       });

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');

       const protocolFile = fileHelper.createTestProtocolFile();
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         protocolFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify maintenance message
       await expect(
         authenticatedPage.locator('[data-testid="service-maintenance"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="maintenance-message"]'),
       ).toContainText('temporarily unavailable');
       await expect(
         authenticatedPage.locator('[data-testid="maintenance-until"]'),
       ).toBeVisible();

       // Verify suggestion to try later
       await expect(
         authenticatedPage.locator('[data-testid="try-later-suggestion"]'),
       ).toBeVisible();
     });

     test('should validate file integrity after UploadThing upload', async ({
       authenticatedPage,
       dashboardPage,
       uploadThingMocker,
       fileHelper,
       db,
     }) => {
       await dashboardPage.navigateToProtocols();

       const protocolData = {
         name: 'Integrity Test Protocol',
         description: 'Testing file integrity validation',
         schemaVersion: 6,
         stages: [],
         codebook: { node: {}, edge: {}, ego: { variables: {} } },
       };

       const protocolFile = fileHelper.createTestProtocolFile(protocolData);

       // Mock successful upload with file validation
       await uploadThingMocker.mockFileUpload({
         customResponse: [
           {
             key: 'integrity-test-key',
             name: 'integrity-test.netcanvas',
             size: 2048,
             url: 'https://utfs.io/f/integrity-test-key',
             checksum: 'sha256:abcd1234...', // Mock checksum
           },
         ],
       });

       await authenticatedPage.click('[data-testid="upload-protocol-button"]');
       await authenticatedPage.setInputFiles(
         '[data-testid="protocol-file-input"]',
         protocolFile,
       );
       await authenticatedPage.click('[data-testid="upload-submit"]');

       // Verify integrity check process
       await expect(
         authenticatedPage.locator('[data-testid="verifying-integrity"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="integrity-check-progress"]'),
       ).toBeVisible();

       // Verify successful validation
       await expect(
         authenticatedPage.locator('[data-testid="integrity-verified"]'),
       ).toBeVisible();
       await expect(
         authenticatedPage.locator('[data-testid="upload-success"]'),
       ).toBeVisible();

       // Verify protocol was saved with correct metadata
       const protocol = await db.protocol.findFirst({
         where: { name: 'Integrity Test Protocol' },
       });
       expect(protocol).toBeTruthy();
     });
   });
   ```

**Verification**: Run UploadThing integration tests to ensure robust service integration.

## Phase 7 Completion Checklist

- [ ] UploadThing service mocking utilities implemented with various failure scenarios
- [ ] Comprehensive protocol import testing including .netcanvas file handling
- [ ] Asset management testing covering multiple file types and error handling
- [ ] File upload UI/UX testing ensuring smooth user experience
- [ ] Integration testing with UploadThing service including error scenarios
- [ ] Network failure and retry mechanism testing
- [ ] File validation and integrity checking
- [ ] Progress indicators and loading states testing
- [ ] Accessibility and keyboard navigation testing
- [ ] Browser compatibility and fallback testing
- [ ] Rate limiting and quota handling
- [ ] Authentication and authorization testing
- [ ] Concurrent upload handling
- [ ] Service maintenance scenario testing

## Next Steps

After completing Phase 7, you should have:

- Comprehensive testing coverage for file upload functionality
- Robust mocking strategies for external service dependencies
- Reliable testing of protocol import and asset management
- Foundation for ensuring file handling works correctly across all scenarios

Proceed to **PHASE-8.md** for CI/CD integration and optimization implementation.
