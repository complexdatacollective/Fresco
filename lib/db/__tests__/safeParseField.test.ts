import { beforeEach, describe, expect, it, vi } from 'vitest';

const { envMock, captureExceptionMock } = vi.hoisted(() => ({
  envMock: { NODE_ENV: 'production' },
  captureExceptionMock: vi.fn(),
}));

vi.mock('~/env', () => ({ env: envMock }));
vi.mock('~/lib/posthog-server', () => ({
  captureException: captureExceptionMock,
}));

import { safeParseField } from '~/lib/db/safeParseField';

// A minimal stand-in for a Zod schema — safeParseField only relies on the
// `safeParse` shape, so this avoids pulling zod into a non-server test file.
type Parsed = { n: number };
const schema = {
  safeParse: (data: unknown) => {
    if (typeof (data as { n?: unknown } | null)?.n === 'number') {
      return { success: true, data: data as Parsed };
    }
    return { success: false, error: new Error('invalid') };
  },
};
const fallback: Parsed = { n: -1 };

describe('safeParseField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.NODE_ENV = 'production';
  });

  it('returns the parsed value on success', () => {
    const result = safeParseField(
      schema,
      { n: 5 },
      'protocol.stages',
      fallback,
    );
    expect(result).toEqual({ n: 5 });
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it('in production, returns the fallback and captures instead of throwing', () => {
    expect(() =>
      safeParseField(
        schema,
        { n: 'not-a-number' },
        'protocol.stages',
        fallback,
      ),
    ).not.toThrow();

    const result = safeParseField(
      schema,
      { n: 'not-a-number' },
      'protocol.stages',
      fallback,
    );
    expect(result).toBe(fallback);
    expect(captureExceptionMock).toHaveBeenCalledWith(expect.anything(), {
      context: 'prisma.result.protocol.stages',
    });
  });

  it('in development, returns the fallback and warns without capturing', () => {
    envMock.NODE_ENV = 'development';
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    const result = safeParseField(
      schema,
      { n: 'not-a-number' },
      'protocol.stages',
      fallback,
    );

    expect(result).toBe(fallback);
    expect(warnSpy).toHaveBeenCalled();
    expect(captureExceptionMock).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
