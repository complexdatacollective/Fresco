import 'server-only';
import { cookies, headers } from 'next/headers';
import { cache } from 'react';

import { createAppIntl } from '@codaco/app-i18n/messages';
import { parseAcceptLanguage } from '@codaco/protocol-validation';
import { frescoTimeZone, localeMirrorCookie } from '~/i18n/locales';
import { resolveFrescoLocale } from '~/i18n/resolve';
import { getServerSession } from '~/lib/auth/guards';
import { frescoCatalogSource } from '~/src/locales/catalogs';

// React cache deduplicates within a server render only. Never use Next's
// shared `use cache` here: the result is private to this request and user.
export const getFrescoI18nInitialization = cache(async () => {
  const [session, cookieStore, requestHeaders] = await Promise.all([
    getServerSession(),
    cookies(),
    headers(),
  ]);
  return resolveFrescoLocale({
    account: session
      ? { userId: session.user.userId, locale: session.user.locale }
      : null,
    mirror: cookieStore.get(localeMirrorCookie)?.value ?? null,
    requested: parseAcceptLanguage(requestHeaders.get('accept-language')),
  });
});

export const getServerIntl = cache(async () => {
  const { locale } = await getFrescoI18nInitialization();
  return createAppIntl({
    locale,
    messages: await frescoCatalogSource.load(locale),
    timeZone: frescoTimeZone,
  });
});
