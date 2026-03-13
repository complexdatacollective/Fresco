import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVersionedHandler } from '../versioning';

describe('createVersionedHandler', () => {
  const mockV1Handler = vi.fn();
  const mockV2Handler = vi.fn();

  const handlers = {
    v1: { GET: mockV1Handler, POST: mockV1Handler },
    v2: { GET: mockV2Handler },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockV1Handler.mockResolvedValue(Response.json({ ok: true }));
    mockV2Handler.mockResolvedValue(Response.json({ ok: true }));
  });

  it('should route to the correct version handler', async () => {
    const handler = createVersionedHandler(handlers, 'GET');
    const request = new NextRequest('http://localhost:3000/api/v1/test');

    await handler(request, { params: Promise.resolve({ version: 'v1' }) });

    expect(mockV1Handler).toHaveBeenCalledWith(request);
  });

  it('should return 404 for unsupported versions', async () => {
    const handler = createVersionedHandler(handlers, 'GET');
    const request = new NextRequest('http://localhost:3000/api/v99/test');

    const response = await handler(request, {
      params: Promise.resolve({ version: 'v99' }),
    });

    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain('Unsupported API version');
  });

  it('should return 405 for unsupported methods', async () => {
    const handler = createVersionedHandler(handlers, 'DELETE');
    const request = new NextRequest('http://localhost:3000/api/v1/test');

    const response = await handler(request, {
      params: Promise.resolve({ version: 'v1' }),
    });

    expect(response.status).toBe(405);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain('DELETE not supported');
  });

  it('should support multiple versions', async () => {
    const handler = createVersionedHandler(handlers, 'GET');
    const request = new NextRequest('http://localhost:3000/api/v2/test');

    await handler(request, { params: Promise.resolve({ version: 'v2' }) });

    expect(mockV2Handler).toHaveBeenCalledWith(request);
    expect(mockV1Handler).not.toHaveBeenCalled();
  });
});
