import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const SCHEMA_PATH = path.resolve(__dirname, '../schema.prisma');

// Parse schema.prisma to get all model names and cascade-deleted models
function parseSchema(): {
  allModels: string[];
  cascadeDeletedModels: string[];
} {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  // Extract all model names
  const modelRegex = /^model\s+(\w+)\s*\{/gm;
  const allModels: string[] = [];
  let match;
  while ((match = modelRegex.exec(schema)) !== null) {
    if (match[1]) allModels.push(match[1]);
  }

  // Find models that have onDelete: Cascade in their relations
  // These models are automatically deleted when their parent is deleted
  const cascadeDeletedModels: string[] = [];
  const modelBlockRegex = /^model\s+(\w+)\s*\{([^}]+)\}/gm;

  while ((match = modelBlockRegex.exec(schema)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];
    if (modelName && modelBody && /onDelete:\s*Cascade/i.test(modelBody)) {
      cascadeDeletedModels.push(modelName);
    }
  }

  return { allModels, cascadeDeletedModels };
}

const mockPrisma = {
  user: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
  participant: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
  protocol: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
  appSettings: {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    create: vi.fn().mockResolvedValue({ key: 'initializedAt', value: '' }),
  },
  events: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
  asset: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
  apiToken: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
  loginAttempt: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
};

vi.mock('~/lib/db', () => ({
  prisma: mockPrisma,
}));

describe('resetDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete all models defined in the schema (except cascade-deleted ones)', async () => {
    const { resetDatabase } = await import('~/lib/db/resetDatabase');
    const { allModels, cascadeDeletedModels } = parseSchema();

    // Models that need explicit deletion (not cascade-deleted)
    const modelsRequiringDeletion = allModels.filter(
      (model) => !cascadeDeletedModels.includes(model),
    );

    await resetDatabase();

    // Verify each model that requires deletion has deleteMany called
    for (const model of modelsRequiringDeletion) {
      const prismaKey = model.charAt(0).toLowerCase() + model.slice(1);
      const mockModel = mockPrisma[prismaKey as keyof typeof mockPrisma];

      expect(
        mockModel,
        `Missing mock for model "${model}" - add it to mockPrisma and resetDatabase()`,
      ).toBeDefined();

      expect(
        'deleteMany' in mockModel ? mockModel.deleteMany : undefined,
        `Model "${model}" should have deleteMany called in resetDatabase()`,
      ).toHaveBeenCalled();
    }
  });

  it('should create only initializedAt setting after clearing data', async () => {
    const { resetDatabase } = await import('~/lib/db/resetDatabase');

    await resetDatabase();

    expect(mockPrisma.appSettings.create).toHaveBeenCalledOnce();

    const callArg: unknown = mockPrisma.appSettings.create.mock.lastCall?.[0];
    expect(callArg).toHaveProperty('data.key', 'initializedAt');
    expect(callArg).toHaveProperty(
      'data.value',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    );
  });
});
