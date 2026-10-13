'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { CatalogMessages } from '@codaco/app-i18n/locales';
import { resolveAppLocale } from '@codaco/app-i18n/negotiate';
import { AppI18nProvider, useLocaleCatalog } from '@codaco/app-i18n/react';
import { updateLocale } from '~/actions/locale';
import {
  frescoLocales,
  frescoTimeZone,
  isFrescoLocale,
  localeMirrorCookie,
} from '~/i18n/locales';
import type { FrescoI18nInitialization } from '~/i18n/resolve';
import { frescoCatalogSource } from '~/src/locales/catalogs';

type FrescoLocaleSaveState = 'idle' | 'saving' | 'saved' | 'failed';

type LocaleState = {
  // A host component can pass the resolved request through a nested content
  // provider without inheriting that content provider's formatter or registry.
  locale: string;
  preference: string | null;
  /** What the automatic entry resolves to for this browser right now. */
  automaticLocale: string;
  saveState: FrescoLocaleSaveState;
  /** A signed-in choice is stored on the account; otherwise on this device. */
  persistence: 'account' | 'device';
  setLocale: (locale: string | null) => void;
};

const resolveAutomaticLocale = (requested: readonly string[]) =>
  resolveAppLocale({
    requested,
    locales: frescoLocales,
    defaultLocale: 'en',
  }).locale;

const LocaleContext = createContext<LocaleState | null>(null);

type FrescoI18nProviderProps = {
  initial: FrescoI18nInitialization;
  /**
   * The merged catalog for `initial.locale`, loaded by the server. The
   * request's language therefore renders on the server and hydrates without
   * downloading anything, so the two always agree; English sends an empty
   * catalog. Only a switch to another language fetches one.
   */
  messages: CatalogMessages;
  children: ReactNode;
};

export function FrescoI18nProvider({
  initial,
  messages,
  children,
}: FrescoI18nProviderProps) {
  // Remount on identity changes; queued operations still carry expectedUserId
  // and are refused by the action if authentication changed meanwhile.
  return (
    <LocaleSession
      key={initial.userId ?? 'signed-out'}
      initial={initial}
      messages={messages}
    >
      {children}
    </LocaleSession>
  );
}

function LocaleSession({
  initial,
  messages,
  children,
}: FrescoI18nProviderProps) {
  const router = useRouter();
  const [state, setState] = useState({
    preference: initial.preference,
    locale: initial.locale,
  });
  // Every refresh re-renders the root layout, which sends the same catalog
  // again as a new object. Keeping the first copy for a locale stops each
  // refresh from rebuilding the formatter and re-rendering every message.
  const [preloaded, setPreloaded] = useState({
    locale: initial.locale,
    messages,
  });
  if (preloaded.locale !== initial.locale) {
    setPreloaded({ locale: initial.locale, messages });
  }
  // A switch keeps the current language on screen until the new one is ready:
  // its chunk has loaded, or the refresh that follows a saved choice has
  // delivered it as props, whichever comes first.
  const catalog = useLocaleCatalog(
    frescoCatalogSource,
    state.locale,
    preloaded,
  );
  // Seeded from the request so the server and hydrating client agree.
  const [automaticLocale, setAutomaticLocale] = useState(() =>
    resolveAutomaticLocale(initial.requested),
  );
  const [saveState, setSaveState] = useState<FrescoLocaleSaveState>('idle');
  const sequence = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      sequence.current += 1;
    };
  }, []);

  useEffect(() => {
    if (pending.current) return;
    setState({ preference: initial.preference, locale: initial.locale });
    // A request's account is authoritative, including Automatic. Keep the
    // mirror agreeing after sign-in without a client-side renegotiation flash.
    try {
      document.cookie = `${localeMirrorCookie}=${initial.preference ?? ''}; Path=/; SameSite=Lax; Max-Age=${initial.preference === null ? 0 : 31536000}`;
    } catch {
      /* Cookie policy can disable the convenience mirror. */
    }
  }, [initial.locale, initial.preference]);

  const setLocale = useCallback(
    (preference: string | null) => {
      if (preference !== null && !isFrescoLocale(preference)) return;
      const automatic = resolveAutomaticLocale(navigator.languages);
      const locale = preference ?? automatic;

      setAutomaticLocale(automatic);
      setState({ preference, locale });
      setSaveState('saving');
      pending.current = true;
      const generation = ++sequence.current;
      queue.current = queue.current
        .catch(() => undefined)
        .then(async () => {
          if (!mounted.current || generation !== sequence.current) return;
          try {
            const result = await updateLocale(preference, initial.userId);
            if (!mounted.current || generation !== sequence.current) return;
            if (!result.success)
              throw new Error('Locale preference was not saved');
            pending.current = false;
            setSaveState('saved');
            router.refresh();
          } catch {
            if (!mounted.current || generation !== sequence.current) return;
            // The choice stays applied for this visit; the switcher offers a
            // retry that sends it again.
            pending.current = false;
            setSaveState('failed');
          }
        });
    },
    [initial.userId, router],
  );

  useEffect(() => {
    const followBrowser = () => {
      const locale = resolveAutomaticLocale(navigator.languages);
      setAutomaticLocale(locale);
      if (state.preference !== null) return;
      setState({ preference: null, locale });
      router.refresh();
    };
    window.addEventListener('languagechange', followBrowser);
    return () => window.removeEventListener('languagechange', followBrowser);
  }, [router, state.preference]);

  return (
    <LocaleContext.Provider
      value={{
        locale: state.locale,
        preference: state.preference,
        automaticLocale,
        saveState,
        persistence: initial.userId === null ? 'device' : 'account',
        setLocale,
      }}
    >
      <AppI18nProvider
        locale={catalog.locale}
        locales={frescoLocales}
        messages={catalog.messages}
        loadFailure={catalog.failure}
        timeZone={frescoTimeZone}
        onLocaleChange={setLocale}
      >
        {children}
      </AppI18nProvider>
    </LocaleContext.Provider>
  );
}

export function useFrescoLocale() {
  const context = useContext(LocaleContext);
  if (!context)
    throw new Error('Fresco locale controls need FrescoI18nProvider');
  return context;
}
