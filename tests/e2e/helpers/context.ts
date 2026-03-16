import fs from 'node:fs/promises';
import path from 'node:path';
import { getContextMappings } from '../config/test-config.js';

const CONTEXT_FILE = path.resolve(
  import.meta.dirname,
  '../.context/test-context.json',
);

export type SuiteContext = {
  suiteId: string;
  appUrl: string;
  databaseUrl: string;
};

type StoredContext = {
  suites: Record<string, SuiteContext>;
  createdAt: string;
};

export async function saveContext(
  suites: Record<string, SuiteContext>,
): Promise<void> {
  const dir = path.dirname(CONTEXT_FILE);
  await fs.mkdir(dir, { recursive: true });
  const context: StoredContext = {
    suites,
    createdAt: new Date().toISOString(),
  };
  await fs.writeFile(CONTEXT_FILE, JSON.stringify(context, null, 2));
}

export async function loadContext(): Promise<StoredContext | null> {
  try {
    const data = await fs.readFile(CONTEXT_FILE, 'utf-8');
    return JSON.parse(data) as StoredContext;
  } catch {
    return null;
  }
}

export async function clearContext(): Promise<void> {
  try {
    await fs.unlink(CONTEXT_FILE);
  } catch {
    // File may not exist
  }
}

let contextCache: Record<string, SuiteContext> | null = null;

export async function getContext(suiteId: string): Promise<SuiteContext> {
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

export function getSuiteId(projectName: string): string {
  const mappings = getContextMappings();
  const suiteId = mappings[projectName];
  if (!suiteId) {
    throw new Error(
      `No context mapping for project "${projectName}". Available: ${Object.keys(mappings).join(', ')}`,
    );
  }
  return suiteId;
}
