import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTEXT_FILE = path.join(__dirname, '../.context-data.json');

export type InterviewTestData = {
  admin: {
    user: { id: string; username: string };
    username: string;
    password: string;
  };
  protocol: { id: string; name: string };
  participants: { id: string; identifier: string; label: string | null }[];
};

export type SerializedContext = {
  suiteId: string;
  appUrl: string;
  databaseUrl: string;
  testData?: InterviewTestData;
};

export type StoredContextData = {
  contexts: Record<string, SerializedContext>;
  snapshotServerUrl: string;
  createdAt: string;
};

/**
 * Save context data to a file for test workers to access.
 * This is necessary because Playwright global setup runs in a separate process
 * from test workers, so globalThis values are not shared.
 */
export async function saveContextData(
  contexts: Record<string, SerializedContext>,
  snapshotServerUrl: string,
): Promise<void> {
  const data: StoredContextData = {
    contexts,
    snapshotServerUrl,
    createdAt: new Date().toISOString(),
  };
  await fs.writeFile(CONTEXT_FILE, JSON.stringify(data, null, 2));
}

/**
 * Load context data from file.
 * Returns null if the file doesn't exist (global setup hasn't run).
 */
export async function loadContextData(): Promise<StoredContextData | null> {
  try {
    const content = await fs.readFile(CONTEXT_FILE, 'utf-8');
    return JSON.parse(content) as StoredContextData;
  } catch {
    return null;
  }
}

/**
 * Delete context data file (called during teardown).
 */
export async function clearContextData(): Promise<void> {
  try {
    await fs.unlink(CONTEXT_FILE);
  } catch {
    // File may not exist, ignore
  }
}
