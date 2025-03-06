/* eslint-disable no-console */
import { expect as baseExpect, test as baseTest } from '@playwright/test';

export const test = baseTest.extend({
  page: async ({ page }, runTest) => {
    await page.route('**/*uploadthing**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      console.log(`[MOCK] Intercepting ${method} ${url}`);

      if (method === 'POST' && route.request().postData()?.includes('"files":')) {
        try {
          const postData = JSON.parse(route.request().postData() ?? '{}') as { files: { name: string, size: number }[] };
          
          if (postData.files && Array.isArray(postData.files)) {
            console.log(`[MOCK] Processing ${postData.files.length} files`);
            
            // Create responses with complete uploads
            const responses = postData.files.map(file => ({
              name: file.name,
              key: `mock-key-${file.name}`,
              url: `https://utfs.io/f/mock-${file.name}`,
              size: file.size,
            }));
            
            // Respond with successful upload
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(responses)
            });
            
            for (const file of postData.files) {
              // TODO: figure out how to mock the progress events
              console.log(`[MOCK] Simulating 100% completion for ${file.name}`);
            }
            return;
          }
        } catch (e) {
          console.log(`[MOCK] Error processing files`, e);
        }
      }
      
      await route.continue();
    });

    await runTest(page);
  }
});

export const expect = baseExpect;