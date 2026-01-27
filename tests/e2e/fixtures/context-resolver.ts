import type { TestInfo } from '@playwright/test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '~/lib/db/generated/client';
import { CONTEXT_MAPPINGS } from '../config/test-config';
import {
  loadContextData,
  type InterviewTestData,
  type SerializedContext,
} from './context-storage';

export type WorkerContext = {
  suiteId: string;
  appUrl: string;
  databaseUrl: string;
  snapshotServerUrl: string;
  prisma: PrismaClient;
  testData?: InterviewTestData;
  cleanup: () => Promise<void>;
};

// Cache Prisma clients per database URL to avoid creating multiple connections
const prismaCache = new Map<string, PrismaClient>();

/**
 * Create a worker context from serialized data.
 * This creates a new Prisma client that connects to the database container.
 */
function createWorkerContext(
  serialized: SerializedContext,
  snapshotServerUrl: string,
): WorkerContext {
  // Reuse cached Prisma client for the same database URL
  let prisma = prismaCache.get(serialized.databaseUrl);

  if (!prisma) {
    const adapter = new PrismaPg({
      connectionString: serialized.databaseUrl,
    });
    prisma = new PrismaClient({ adapter });
    prismaCache.set(serialized.databaseUrl, prisma);
  }

  return {
    suiteId: serialized.suiteId,
    appUrl: serialized.appUrl,
    databaseUrl: serialized.databaseUrl,
    snapshotServerUrl,
    prisma,
    testData: serialized.testData,
    cleanup: async () => {
      // Don't disconnect here - let the process handle it on exit
      // This avoids issues with shared Prisma clients
    },
  };
}

/**
 * Resolve the appropriate worker context for the current test.
 * Loads context data from file and creates Prisma connections as needed.
 */
export async function resolveWorkerContext(
  testInfo: TestInfo,
): Promise<WorkerContext | null> {
  const contextData = await loadContextData();

  if (!contextData) {
    return null;
  }

  const { snapshotServerUrl } = contextData;

  // Method 1: Try to infer from test file path
  const contextFromPath = inferContextFromTestPath(
    testInfo,
    contextData.contexts,
  );
  if (contextFromPath) {
    return createWorkerContext(contextFromPath, snapshotServerUrl);
  }

  // Method 2: Try to infer from Playwright project name
  const contextFromProject = inferContextFromProject(
    testInfo,
    contextData.contexts,
  );
  if (contextFromProject) {
    return createWorkerContext(contextFromProject, snapshotServerUrl);
  }

  // Method 3: Try to infer from base URL
  const contextFromBaseURL = inferContextFromBaseURL(
    testInfo,
    contextData.contexts,
  );
  if (contextFromBaseURL) {
    return createWorkerContext(contextFromBaseURL, snapshotServerUrl);
  }

  // Method 4: Fall back to interview context (most feature-rich)
  if (contextData.contexts.interview) {
    return createWorkerContext(
      contextData.contexts.interview,
      snapshotServerUrl,
    );
  }

  return null;
}

/**
 * Infer context from test file path
 */
function inferContextFromTestPath(
  testInfo: TestInfo,
  contexts: Record<string, SerializedContext>,
): SerializedContext | null {
  if (!testInfo.file) {
    return null;
  }

  const pathParts = testInfo.file.split('/');
  const suitesIndex = pathParts.findIndex((part) => part === 'suites');

  if (suitesIndex >= 0 && pathParts.length > suitesIndex + 1) {
    const suiteName = pathParts[suitesIndex + 1] as
      | keyof typeof CONTEXT_MAPPINGS.suiteToContext
      | undefined;

    if (suiteName && suiteName in CONTEXT_MAPPINGS.suiteToContext) {
      const contextKey = CONTEXT_MAPPINGS.suiteToContext[suiteName];
      if (contexts[contextKey]) {
        return contexts[contextKey];
      }
    }
  }

  return null;
}

/**
 * Infer context from Playwright project name
 */
function inferContextFromProject(
  testInfo: TestInfo,
  contexts: Record<string, SerializedContext>,
): SerializedContext | null {
  if (!testInfo.project?.name) {
    return null;
  }

  const projectName = testInfo.project
    .name as keyof typeof CONTEXT_MAPPINGS.projectToContext;

  if (projectName in CONTEXT_MAPPINGS.projectToContext) {
    const contextKey = CONTEXT_MAPPINGS.projectToContext[projectName];
    if (contexts[contextKey]) {
      return contexts[contextKey];
    }
  }

  return null;
}

/**
 * Infer context from base URL
 */
function inferContextFromBaseURL(
  testInfo: TestInfo,
  contexts: Record<string, SerializedContext>,
): SerializedContext | null {
  const baseURL = testInfo.project?.use?.baseURL;
  if (!baseURL) {
    return null;
  }

  for (const context of Object.values(contexts)) {
    if (context.appUrl === baseURL) {
      return context;
    }
  }

  return null;
}

/**
 * Get context info for debugging
 */
export async function getWorkerContextInfo(testInfo: TestInfo): Promise<{
  resolvedContext: string | null;
  availableContexts: string[];
  detectionMethod: string;
  testFile?: string;
  projectName?: string;
  baseURL?: string;
}> {
  const contextData = await loadContextData();

  if (!contextData) {
    return {
      resolvedContext: null,
      availableContexts: [],
      detectionMethod:
        'No context data file found - global setup may not have run',
      testFile: testInfo.file,
      projectName: testInfo.project?.name,
      baseURL: testInfo.project?.use?.baseURL,
    };
  }

  const availableContexts = Object.keys(contextData.contexts);

  // Check each detection method
  const pathContext = inferContextFromTestPath(testInfo, contextData.contexts);
  if (pathContext) {
    return {
      resolvedContext: pathContext.suiteId,
      availableContexts,
      detectionMethod: 'test file path',
      testFile: testInfo.file,
      projectName: testInfo.project?.name,
      baseURL: testInfo.project?.use?.baseURL,
    };
  }

  const projectContext = inferContextFromProject(
    testInfo,
    contextData.contexts,
  );
  if (projectContext) {
    return {
      resolvedContext: projectContext.suiteId,
      availableContexts,
      detectionMethod: 'Playwright project name',
      testFile: testInfo.file,
      projectName: testInfo.project?.name,
      baseURL: testInfo.project?.use?.baseURL,
    };
  }

  const urlContext = inferContextFromBaseURL(testInfo, contextData.contexts);
  if (urlContext) {
    return {
      resolvedContext: urlContext.suiteId,
      availableContexts,
      detectionMethod: 'base URL matching',
      testFile: testInfo.file,
      projectName: testInfo.project?.name,
      baseURL: testInfo.project?.use?.baseURL,
    };
  }

  return {
    resolvedContext: contextData.contexts.interview ? 'interview' : null,
    availableContexts,
    detectionMethod: 'fallback to interview',
    testFile: testInfo.file,
    projectName: testInfo.project?.name,
    baseURL: testInfo.project?.use?.baseURL,
  };
}

// Cleanup all cached Prisma clients on process exit
process.on('beforeExit', async () => {
  for (const prisma of prismaCache.values()) {
    await prisma.$disconnect();
  }
  prismaCache.clear();
});
