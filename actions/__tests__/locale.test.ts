import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getServerSession, update, setCookie, deleteCookie } = vi.hoisted(
  () => ({
    getServerSession: vi.fn(),
    update: vi.fn(),
    setCookie: vi.fn(),
    deleteCookie: vi.fn(),
  }),
);
vi.mock('~/lib/auth/guards', () => ({ getServerSession }));
vi.mock('~/lib/db', () => ({ prisma: { user: { update } } }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ set: setCookie, delete: deleteCookie }),
}));
import { updateLocale } from '~/actions/locale';

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ user: { userId: 'alice' } });
  update.mockResolvedValue({ locale: 'es' });
});

describe('locale preference persistence', () => {
  it('writes only the authenticated user, with a canonical supported tag', async () => {
    expect(await updateLocale('es', 'alice')).toEqual({ success: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'alice' },
      data: { locale: 'es' },
    });
    expect(setCookie).toHaveBeenCalledWith(
      'fresco.locale',
      'es',
      expect.objectContaining({ path: '/', sameSite: 'lax' }),
    );
  });
  it('stores null and removes the explicit device mirror for Automatic', async () => {
    await updateLocale(null, 'alice');
    expect(update).toHaveBeenCalledWith({
      where: { id: 'alice' },
      data: { locale: null },
    });
    expect(deleteCookie).toHaveBeenCalledWith('fresco.locale');
  });
  it.each(['ES', 'es-MX', 'ja', 'en_XA', '', 'en-XA'])(
    'rejects unsupported or noncanonical input %s before persistence',
    async (locale) => {
      expect(await updateLocale(locale, 'alice')).toEqual({ success: false });
      expect(update).not.toHaveBeenCalled();
      expect(setCookie).not.toHaveBeenCalled();
    },
  );
  it('rejects a queued choice after the signed-in identity changed', async () => {
    getServerSession.mockResolvedValue({ user: { userId: 'bob' } });
    expect(await updateLocale('es', 'alice')).toEqual({ success: false });
    expect(update).not.toHaveBeenCalled();
    expect(setCookie).not.toHaveBeenCalled();
  });
  it('allows a signed-out device choice without creating or modifying an account', async () => {
    getServerSession.mockResolvedValue(null);
    expect(await updateLocale('es', null)).toEqual({ success: true });
    expect(update).not.toHaveBeenCalled();
    expect(setCookie).toHaveBeenCalled();
  });
  it('does not mirror an account write that failed', async () => {
    update.mockRejectedValue(new Error('database unavailable'));
    await expect(updateLocale('es', 'alice')).rejects.toThrow(
      'database unavailable',
    );
    expect(setCookie).not.toHaveBeenCalled();
  });
});
