import { test as base, expect, type Page, type TestInfo } from '@playwright/test';
import { InterviewPage } from './interview-page.js';
import { DatabaseIsolation } from './db-fixture.js';
import { getContextMappings } from '../config/test-config.js';
import { loadContext, type SuiteContext } from '../helpers/context.js';
import { createTestPrisma } from '../helpers/prisma.js';
import { createId } from '@paralleldrive/cuid2';
import { hash } from 'ohash';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Stage metadata extracted from the SILOS protocol
 */
type StageInfo = {
  index: number;
  id: string;
  label: string;
  type: string;
};

/**
 * The SILOS stage fixture provides:
 * - Shared interview that persists across serial tests
 * - Automatic screenshot capture with consistent naming
 * - Stage tracking and navigation helpers
 */
type SilosStageFixture = {
  /** The Playwright page */
  page: Page;

  /** InterviewPage helper for interactions */
  interview: InterviewPage;

  /** Current stage index (0-based) */
  stageIndex: number;

  /** Current stage metadata */
  stageInfo: StageInfo;

  /** All stages from the protocol */
  stages: StageInfo[];

  /** Capture screenshot at stage start (after load, before interaction) */
  captureStart: () => Promise<void>;

  /** Capture screenshot at stage complete (after interaction, before next) */
  captureComplete: () => Promise<void>;

  /** Navigate to next stage */
  next: () => Promise<void>;
};

type WorkerFixtures = {
  database: DatabaseIsolation;
  silosProtocol: {
    protocolId: string;
    stages: StageInfo[];
  };
  silosInterviewId: string;
};

// Cache for test context
let contextCache: Record<string, SuiteContext> | null = null;

async function getContext(suiteId: string): Promise<SuiteContext> {
  if (!contextCache) {
    const stored = await loadContext();
    if (!stored) {
      throw new Error(
        'Test context not found. Did global-setup.ts run successfully?',
      );
    }
    contextCache = stored.suites;
  }

  const suite = contextCache[suiteId];
  if (!suite) {
    throw new Error(
      `Suite "${suiteId}" not found in test context. Available: ${Object.keys(contextCache).join(', ')}`,
    );
  }
  return suite;
}

/**
 * Slugify a label for use in screenshot filenames
 */
function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Format stage index as zero-padded string (00, 01, 02, etc.)
 */
function formatStageIndex(index: number): string {
  return index.toString().padStart(2, '0');
}

export const silosTest = base.extend<
  { stage: SilosStageFixture },
  WorkerFixtures
>({
  // Worker-scoped: database connection
  database: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, workerInfo) => {
      const projectName = workerInfo.project.name;
      const mappings = getContextMappings();
      const suiteId = mappings[projectName];
      if (!suiteId) {
        throw new Error(
          `No context mapping for project "${projectName}". Available: ${Object.keys(mappings).join(', ')}`,
        );
      }
      const context = await getContext(suiteId);
      const db = new DatabaseIsolation(context.databaseUrl, suiteId);

      await use(db);
    },
    { scope: 'worker' },
  ],

  // Worker-scoped: load SILOS protocol once per worker
  silosProtocol: [
    async ({ database }, use) => {
      // Restore snapshot first to ensure clean state
      await database.restoreSnapshot();

      // Load protocol JSON
      const protocolPath = path.join(
        import.meta.dirname,
        '../data/SILOS-protocol.json',
      );
      const json = await fs.readFile(protocolPath, 'utf-8');
      const protocolData = JSON.parse(json) as {
        stages: { id: string; label: string; type: string }[];
        schemaVersion: number;
        description?: string;
        lastModified: string;
        codebook: object;
      };
      const protocolHash = hash(protocolData);

      // Extract stage metadata
      const stages: StageInfo[] = protocolData.stages.map((stage, index) => ({
        index,
        id: stage.id,
        label: stage.label,
        type: stage.type,
      }));

      // Create protocol in database
      const prisma = createTestPrisma(database.getDatabaseUrl());

      try {
        const protocol = await prisma.protocol.upsert({
          where: { hash: protocolHash },
          update: {},
          create: {
            id: createId(),
            hash: protocolHash,
            name: 'SILOS',
            schemaVersion: protocolData.schemaVersion,
            description: protocolData.description ?? '',
            lastModified: new Date(protocolData.lastModified),
            stages: protocolData.stages as [],
            codebook: protocolData.codebook,
          },
        });

        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use({ protocolId: protocol.id, stages });
      } finally {
        await prisma.$disconnect();
      }
    },
    { scope: 'worker' },
  ],

  // Worker-scoped: create interview once per worker
  silosInterviewId: [
    async ({ database, silosProtocol }, use) => {
      const prisma = createTestPrisma(database.getDatabaseUrl());

      try {
        const participantId = createId();
        await prisma.participant.create({
          data: {
            id: participantId,
            identifier: `SILOS-TEST-${Date.now()}`,
          },
        });

        const interviewId = createId();
        await prisma.interview.create({
          data: {
            id: interviewId,
            participantId,
            protocolId: silosProtocol.protocolId,
            startTime: new Date(),
            lastUpdated: new Date(),
            currentStep: 0,
            network: {
              nodes: [],
              edges: [],
              ego: { _uid: createId(), attributes: {} },
            },
          },
        });

        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use(interviewId);
      } finally {
        await prisma.$disconnect();
      }
    },
    { scope: 'worker' },
  ],

  // Test-scoped: stage fixture
  stage: async (
    { page, silosProtocol, silosInterviewId },
    use,
    testInfo: TestInfo,
  ) => {
    const interview = new InterviewPage(page, 'interview', silosInterviewId);

    // Parse stage index from test title (e.g., "Stage 0: Welcome" -> 0)
    const stageMatch = /Stage\s+(\d+)/i.exec(testInfo.title);
    const stageIndex = stageMatch?.[1] ? parseInt(stageMatch[1], 10) : 0;

    const stageInfo = silosProtocol.stages[stageIndex];
    if (!stageInfo) {
      throw new Error(
        `Stage ${stageIndex} not found in protocol. Available: 0-${silosProtocol.stages.length - 1}`,
      );
    }

    // Navigate to interview - it resumes at currentStep persisted in database
    await interview.start();

    const fixture: SilosStageFixture = {
      page,
      interview,
      stageIndex,
      stageInfo,
      stages: silosProtocol.stages,

      async captureStart() {
        // Wait for stage content to stabilize
        await page.waitForTimeout(500);

        const filename = `stage-${formatStageIndex(stageIndex)}-${slugify(stageInfo.label)}-start.png`;
        await expect(page).toHaveScreenshot(filename, { fullPage: true });
      },

      async captureComplete() {
        // Wait for any animations
        await page.waitForTimeout(300);

        const filename = `stage-${formatStageIndex(stageIndex)}-${slugify(stageInfo.label)}-complete.png`;
        await expect(page).toHaveScreenshot(filename, { fullPage: true });
      },

      async next() {
        await interview.navigateNext();
      },
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(fixture);
  },
});

export { expect } from '@playwright/test';
