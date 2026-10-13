import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { captureExceptionMock, findUniqueMock } = vi.hoisted(() => ({
  captureExceptionMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    after: vi.fn((task: () => unknown) => {
      void task();
    }),
  };
});
vi.mock('~/lib/db', () => ({
  prisma: { interview: { findUnique: findUniqueMock } },
}));
vi.mock('~/queries/appSettings', () => ({
  getAppSetting: vi.fn(() => Promise.resolve(true)),
}));
vi.mock('~/app/api/_helpers/auth', () => ({
  createCorsHeaders: () => ({}),
  requireApiTokenAuth: () => Promise.resolve({ valid: true }),
}));
vi.mock('~/lib/posthog-server', () => ({
  captureException: captureExceptionMock,
  flushPostHog: vi.fn(),
}));

import { GET } from '../route';

const get = () =>
  GET(
    new NextRequest('http://localhost/api/v1/interview/interview-1', {
      headers: { authorization: 'Bearer token' },
    }),
    { params: Promise.resolve({ version: 'v1', interviewId: 'interview-1' }) },
  );

const readableNetwork = {
  nodes: [],
  edges: [],
  ego: { _uid: 'ego-1', attributes: {} },
};

const row = (
  network: unknown,
  stageMetadata: unknown = null,
  codebook: unknown = { node: {}, edge: {} },
) => ({
  id: 'interview-1',
  network,
  stageMetadata,
  participant: { id: 'participant-1', identifier: 'P001', label: null },
  protocol: {
    id: 'protocol-1',
    name: 'Study',
    schemaVersion: 8,
    description: null,
    codebook,
  },
});

describe('interview data API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the stored network it reads', async () => {
    const network = {
      nodes: [
        {
          _uid: 'node-1',
          type: 'person',
          attributes: { name: 'Ada', unanswered: null },
        },
      ],
      edges: [],
      ego: { _uid: 'ego-1', attributes: {} },
    };
    findUniqueMock.mockResolvedValue(row(network));

    const response = await get();

    expect(response.status).toBe(200);
    const { data } = (await response.json()) as {
      data: { network: unknown; stageMetadata: unknown };
    };
    expect(data.network).toEqual({
      ...network,
      nodes: [{ _uid: 'node-1', type: 'person', attributes: { name: 'Ada' } }],
    });
    expect(data.stageMetadata).toBeNull();
  });

  it('refuses to answer for a stored network it cannot read, rather than presenting an empty one', async () => {
    findUniqueMock.mockResolvedValue(
      row({
        nodes: [
          {
            _uid: 'node-1',
            type: 'person',
            attributes: { invalid: { nested: 'value' } },
          },
        ],
        edges: [],
        ego: { _uid: 'ego-1', attributes: {} },
      }),
    );

    const response = await get();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Stored interview data could not be read',
    });
    expect(captureExceptionMock).toHaveBeenCalledWith(expect.anything(), {
      context: 'api.interview.unreadable',
    });
  });

  it('returns the protocol codebook it reads', async () => {
    const codebook = { node: {}, edge: {}, ego: { variables: {} } };
    findUniqueMock.mockResolvedValue(row(readableNetwork, null, codebook));

    const response = await get();

    expect(response.status).toBe(200);
    const { data } = (await response.json()) as {
      data: { protocol: { codebook: unknown } };
    };
    expect(data.protocol.codebook).toEqual(codebook);
  });

  it('refuses to answer for a protocol codebook it cannot read, rather than presenting an empty one', async () => {
    findUniqueMock.mockResolvedValue(
      row(readableNetwork, null, { node: { person: 'not an entity type' } }),
    );

    const response = await get();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Stored interview data could not be read',
    });
    expect(captureExceptionMock).toHaveBeenCalledWith(expect.anything(), {
      context: 'api.interview.unreadable',
    });
  });
});
