/**
 * Interview test fixtures.
 *
 * Extends the base test with `interview` and `stage` fixtures for testing
 * interview flows with proper separation of concerns:
 *
 * - `interview` - Navigation and interview shell (goto, nextButton)
 * - `stage` - Stage-specific interactions (quickAdd, nodes, deleteNode)
 * - `page` - Raw Playwright page for assertions
 *
 * Usage:
 * ```typescript
 * import { test, expect } from '~/tests/e2e/fixtures/interview-test.js';
 *
 * test.describe('My Interview Test', () => {
 *   let interviewId: string;
 *
 *   test.beforeAll(async ({ database }) => {
 *     const { protocolId } = await database.installProtocolFromFile(PROTOCOL_PATH);
 *     interviewId = await database.createInterviewForProtocol(protocolId);
 *   });
 *
 *   test.beforeEach(({ interview }) => {
 *     interview.interviewId = interviewId;
 *   });
 *
 *   test('Stage 0', async ({ interview }) => {
 *     await interview.goto(0);
 *     await expect(interview.nextButton).toBeEnabled();
 *   });
 * });
 * ```
 */

import { test as baseTest, expect } from './test.js';
import { InterviewFixture } from './interview-fixture.js';
import { StageFixture } from './stage-fixture.js';

type InterviewTestFixtures = {
  interview: InterviewFixture;
  stage: StageFixture;
};

export const test = baseTest.extend<InterviewTestFixtures>({
  interview: async ({ page }, use) => {
    const interview = new InterviewFixture(page);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(interview);
  },

  stage: async ({ page }, use) => {
    const stage = new StageFixture(page);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(stage);
  },
});

export { expect };
