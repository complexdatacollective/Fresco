import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { mockCreate, mockDelete, mockDeleteMany } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockDelete: vi.fn(),
  mockDeleteMany: vi.fn(),
}));

vi.mock('~/lib/db', () => ({
  prisma: {
    exportTicket: {
      create: mockCreate,
      delete: mockDelete,
      deleteMany: mockDeleteMany,
    },
  },
}));

import { Prisma } from '~/lib/db/generated/client';
import { createExportTicket, consumeExportTicket } from '~/lib/export/tickets';

const validParams = {
  interviewIds: ['clxinterview000000000001'],
  exportOptions: {
    exportGraphML: true,
    exportCSV: false,
    globalOptions: {
      useScreenLayoutCoordinates: false,
      screenLayoutHeight: 1080,
      screenLayoutWidth: 1920,
    },
  },
};

const recordNotFoundError = () =>
  new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: 'test',
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createExportTicket', () => {
  it('purges expired tickets and creates a new one', async () => {
    mockDeleteMany.mockResolvedValue({ count: 0 });
    mockCreate.mockResolvedValue({ id: 'ticket-1' });

    const id = await createExportTicket('user-1', validParams);

    expect(id).toBe('ticket-1');
    expect(mockDeleteMany.mock.calls[0]?.[0]).toHaveProperty(
      'where.expiresAt.lt',
      expect.any(Date),
    );
    expect(mockCreate.mock.calls[0]?.[0]).toHaveProperty(
      'data.userId',
      'user-1',
    );
    expect(mockCreate.mock.calls[0]?.[0]).toHaveProperty(
      'data.params',
      validParams,
    );
    expect(mockCreate.mock.calls[0]?.[0]).toHaveProperty(
      'data.expiresAt',
      expect.any(Date),
    );
  });
});

describe('consumeExportTicket', () => {
  it('returns params and deletes the ticket', async () => {
    mockDelete.mockResolvedValue({
      id: 'ticket-1',
      userId: 'user-1',
      params: validParams,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await consumeExportTicket('ticket-1', 'user-1');

    expect(result).toEqual(validParams);
    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: 'ticket-1', userId: 'user-1' },
    });
  });

  it('returns null when the delete reports record not found (P2025)', async () => {
    mockDelete.mockRejectedValue(recordNotFoundError());

    expect(await consumeExportTicket('nope', 'user-1')).toBeNull();
  });

  it('rethrows non-P2025 errors from the delete', async () => {
    mockDelete.mockRejectedValue(new Error('connection refused'));

    await expect(consumeExportTicket('ticket-1', 'user-1')).rejects.toThrow(
      'connection refused',
    );
  });

  it('returns null without consuming the ticket when it belongs to a different user', async () => {
    // The user-bound where means a wrong-user attempt matches no row: the
    // delete reports P2025 and the ticket survives for its rightful owner.
    mockDelete.mockRejectedValue(recordNotFoundError());

    expect(await consumeExportTicket('ticket-1', 'user-1')).toBeNull();
    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: 'ticket-1', userId: 'user-1' },
    });
  });

  it('returns null (but still deletes) for an expired ticket', async () => {
    mockDelete.mockResolvedValue({
      id: 'ticket-1',
      userId: 'user-1',
      params: validParams,
      expiresAt: new Date(Date.now() - 1),
    });

    expect(await consumeExportTicket('ticket-1', 'user-1')).toBeNull();
    expect(mockDelete).toHaveBeenCalled();
  });

  it('returns null for a ticket whose params fail schema validation', async () => {
    mockDelete.mockResolvedValue({
      id: 'ticket-1',
      userId: 'user-1',
      params: { interviewIds: 'not-an-array' },
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect(await consumeExportTicket('ticket-1', 'user-1')).toBeNull();
    expect(mockDelete).toHaveBeenCalled();
  });
});
