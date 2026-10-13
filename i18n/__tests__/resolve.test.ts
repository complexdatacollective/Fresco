import { describe, expect, it } from 'vitest';

import { resolveFrescoLocale } from '~/i18n/resolve';

const account = (locale: string | null) => ({ userId: 'alice', locale });

describe('Fresco request locale precedence', () => {
  it('honors an account before the mirror and browser, with canonical best fit', () => {
    expect(
      resolveFrescoLocale({
        account: account('ES-mx'),
        mirror: 'en-GB',
        requested: ['en-US'],
      }),
    ).toMatchObject({ locale: 'es', preference: 'es', userId: 'alice' });
  });
  it('treats an authenticated null as Automatic, ignoring another user’s mirror', () => {
    expect(
      resolveFrescoLocale({
        account: account(null),
        mirror: 'es',
        requested: ['en-GB'],
      }),
    ).toMatchObject({ locale: 'en-GB', preference: null });
  });
  it('uses the device mirror before browser negotiation while signed out', () => {
    expect(
      resolveFrescoLocale({
        account: null,
        mirror: 'es-AR',
        requested: ['en-GB'],
      }),
    ).toMatchObject({ locale: 'es', preference: 'es', userId: null });
  });
  it('ignores invalid or unsupported persisted values and negotiates regional Spanish', () => {
    for (const value of ['???', 'zz-ZZ', '']) {
      expect(
        resolveFrescoLocale({
          account: account(value),
          mirror: '???',
          requested: ['es-CO'],
        }),
      ).toMatchObject({ locale: 'es', preference: null });
    }
  });
  it('uses a valid mirror when an account has a withdrawn locale', () => {
    expect(
      resolveFrescoLocale({
        account: account('ja'),
        mirror: 'en-GB',
        requested: ['es'],
      }),
    ).toMatchObject({ locale: 'en-GB', preference: 'en-GB' });
  });
  it('falls back to English with no usable preference', () => {
    expect(
      resolveFrescoLocale({ account: null, mirror: null, requested: ['???'] }),
    ).toMatchObject({ locale: 'en', preference: null });
  });
});
