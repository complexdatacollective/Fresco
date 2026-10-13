'use client';

import { useDeferredValue, useSyncExternalStore, type ReactNode } from 'react';

import { resolveAppLocale } from '@codaco/app-i18n/negotiate';
import { AppI18nProvider, useLocaleCatalog } from '@codaco/app-i18n/react';
import {
  frescoLocales,
  frescoTimeZone,
  localeMirrorCookie,
} from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const subscribe = (onChange: () => void) => {
  window.addEventListener('languagechange', onChange);
  return () => window.removeEventListener('languagechange', onChange);
};
function recoveryLocale() {
  let stored: string | null = null;
  try {
    const value = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith(`${localeMirrorCookie}=`))
      ?.slice(localeMirrorCookie.length + 1);
    stored = value ? decodeURIComponent(value) : null;
  } catch {
    // A denied or malformed convenience mirror still permits browser fallback.
  }
  return resolveAppLocale({
    stored,
    requested: navigator.languages,
    locales: frescoLocales,
    defaultLocale: 'en',
  }).locale;
}

/**
 * Next replaces the entire root layout after a fatal root failure. There is
 * then no request provider to consume, and repeating its failed database read
 * would prevent recovery. Use the mirrored preference/browser after hydration;
 * the deterministic English server snapshot keeps the fallback hydratable.
 *
 * The page always opens in English, which needs no catalog, and changes to the
 * mirrored language once that language's chunk has loaded. A recovery screen
 * must never wait on a download — or fail on one, when a failed chunk load is
 * what broke the app — so if the load fails it simply stays in English.
 */
export default function RecoveryI18nProvider({
  children,
}: {
  children: ReactNode;
}) {
  const requested = useSyncExternalStore(subscribe, recoveryLocale, () => 'en');
  // Hydration starts from the English server snapshot, but a root failure on
  // the client renders this page without hydrating, and then even the first
  // render reads the mirror. The initial value holds that render to English
  // too, so the catalog hook never has a first render to suspend.
  const locale = useDeferredValue(requested, 'en');
  const catalog = useLocaleCatalog(frescoCatalogSource, locale);
  return (
    <html lang={catalog.locale} dir="ltr">
      <body>
        <AppI18nProvider
          locale={catalog.locale}
          locales={frescoLocales}
          messages={catalog.messages}
          timeZone={frescoTimeZone}
        >
          {children}
        </AppI18nProvider>
      </body>
    </html>
  );
}
