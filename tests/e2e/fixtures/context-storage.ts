import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTEXT_FILE = path.join(__dirname, '../.context-data.json');

export type InterviewTestData = {
  protocol: { id: string };
  participants: { identifier: string }[];
};

export type SerializedContext = {
  suiteId: string;
  appUrl: string;
  databaseUrl: string;
  testData?: InterviewTestData;
};

type StoredContextData = {
  contexts: Record<string, SerializedContext>;
  createdAt: string;
};

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
