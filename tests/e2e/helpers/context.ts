import fs from 'node:fs/promises';
import path from 'node:path';

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
