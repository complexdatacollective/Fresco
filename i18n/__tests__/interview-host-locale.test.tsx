import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type * as Nuqs from 'nuqs';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { commonMessages } from '@codaco/app-i18n/common';
import type { CatalogMessages } from '@codaco/app-i18n/locales';
import { useAppIntl } from '@codaco/app-i18n/react';
import type { InterviewPayload } from '@codaco/interview';
import { loadInterviewCatalog } from '@codaco/interview/catalog';
import { COMPATIBLE_PROTOCOL_SCHEMA_VERSION } from '@codaco/interview/protocol-schema-version';
import InterviewClient from '~/app/(interview)/interview/[interviewId]/InterviewClient';
import InterviewCompleted from '~/app/(interview)/interview/_components/InterviewCompleted';
import ParticipantLayout from '~/app/(interview)/layout';
import { FrescoI18nProvider } from '~/i18n/FrescoI18nProvider';
import FrescoLocaleSwitcher from '~/i18n/FrescoLocaleSwitcher';
import type { FrescoI18nInitialization } from '~/i18n/resolve';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { shell, updateLocale, refresh } = vi.hoisted(() => ({
  shell: vi.fn(),
  updateLocale: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('~/actions/locale', () => ({ updateLocale }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, replace: vi.fn() }),
}));
vi.mock('nuqs', async (importOriginal) => ({
  ...(await importOriginal<typeof Nuqs>()),
  useQueryState: () => [0, vi.fn()],
}));
vi.mock('~/app/(interview)/_components/EndSessionRecording', () => ({
  default: () => null,
}));
// The layout's translated metadata reads the request on the server; these
// tests render the layout component only.
vi.mock('~/i18n/server', () => ({ getServerIntl: vi.fn() }));
// This test checks the real Fresco host seam. It does not assert the mocked
// Shell's runtime behavior: real package negotiation and temporary menu choices
// require the separate Shell tests and compiled Fresco browser workflow.
vi.mock('@codaco/interview', () => ({
  Shell: (props: {
    requestedLocale?: string;
    payload: InterviewPayload;
    onLocaleChange?: unknown;
  }) => {
    shell(props);
    return (
      <div
        data-testid="shell-request"
        data-requested-locale={props.requestedLocale}
      >
        <h2>{props.payload.protocol.name}</h2>
        <pre>{JSON.stringify(props.payload.session.network)}</pre>
      </div>
    );
  },
}));

const payload: InterviewPayload = {
  session: {
    id: 'locale-host-interview',
    startTime: '2026-09-06T00:00:00.000Z',
    finishTime: null,
    exportTime: null,
    lastUpdated: '2026-09-06T00:00:00.000Z',
    network: {
      ego: { _uid: 'ego', attributes: { original: 'Ana & <literal>' } },
      nodes: [],
      edges: [],
    },
  },
  protocol: {
    id: 'locale-host-protocol',
    hash: 'original-protocol-hash',
    importedAt: '2026-09-06T00:00:00.000Z',
    name: 'Protocol **authored** name',
    schemaVersion: COMPATIBLE_PROTOCOL_SCHEMA_VERSION,
    codebook: { ego: { variables: {} }, node: {}, edge: {} },
    assets: [],
    stages: [
      {
        id: 'authored',
        type: 'Information',
        label: 'Original stage label',
        title: 'Pregunta original',
        items: [],
      },
    ],
  },
};
const originalPayload = structuredClone(payload);
// The catalogs the root layout delivers with each request below, and British
// English loaded up front for the switch to Automatic.
const en = await frescoCatalogSource.load('en');
const es = await frescoCatalogSource.load('es');
await frescoCatalogSource.load('en-GB');
// What the interview page loads on the server for a Spanish request.
const interviewCatalog = await loadInterviewCatalog('es');

const spanish: FrescoI18nInitialization = {
  locale: 'es',
  preference: 'es',
  userId: 'alice',
  requested: ['en-GB'],
};

function ParticipantChrome() {
  const intl = useAppIntl();
  return (
    <button type="button">{intl.formatMessage(commonMessages.continue)}</button>
  );
}
function Host({
  initial = spanish,
  messages = es,
}: {
  initial?: FrescoI18nInitialization;
  messages?: CatalogMessages;
}) {
  return (
    <FrescoI18nProvider initial={initial} messages={messages}>
      <FrescoLocaleSwitcher />
      <ParticipantLayout>
        <ParticipantChrome />
        <InterviewClient
          payload={payload}
          assetUrls={{}}
          initialStep={0}
          initialSyncRevision={0}
          installationId="test-installation"
          disableAnalytics
          catalog={interviewCatalog}
        />
      </ParticipantLayout>
    </FrescoI18nProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  updateLocale.mockResolvedValue({ success: true });
  Object.defineProperty(navigator, 'languages', {
    configurable: true,
    value: ['en-GB'],
  });
});

describe('Fresco passes its resolved host request to the interview package', () => {
  it('crosses the participant content boundary and follows account or automatic changes without rewriting the payload', async () => {
    const view = render(<Host />);
    expect(screen.getByTestId('shell-request')).toHaveAttribute(
      'data-requested-locale',
      'es',
    );
    expect(
      screen.getByRole('button', { name: 'Continuar' }).closest('[lang]'),
    ).toBe(document.documentElement);
    expect(shell).toHaveBeenLastCalledWith(
      expect.objectContaining({
        requestedLocale: 'es',
        catalog: interviewCatalog,
        payload,
      }),
    );
    // A participant menu choice is held by the interview page for its
    // thank-you page and never reaches the researcher preference path.
    expect(shell.mock.lastCall?.[0]).toHaveProperty('localePreference', null);
    const onLocaleChange = shell.mock.lastCall?.[0].onLocaleChange as (
      locale: string | null,
    ) => void;
    act(() => onLocaleChange('fr'));
    expect(shell).toHaveBeenLastCalledWith(
      expect.objectContaining({
        localePreference: 'fr',
        requestedLocale: 'es',
      }),
    );
    act(() => onLocaleChange(null));
    expect(updateLocale).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('combobox', { name: /^Idioma de la interfaz/ }),
    );
    fireEvent.click(await screen.findByRole('option', { name: /^Automático/ }));
    expect(screen.getByTestId('shell-request')).toHaveAttribute(
      'data-requested-locale',
      'en-GB',
    );
    await waitFor(() =>
      expect(updateLocale).toHaveBeenCalledWith(null, 'alice'),
    );
    expect(
      screen.getByRole('heading', { name: 'Protocol **authored** name' }),
    ).toBeInTheDocument();
    expect(shell).toHaveBeenLastCalledWith(
      expect.objectContaining({ payload }),
    );

    view.rerender(
      <Host
        initial={{
          locale: 'en',
          preference: null,
          userId: 'bob',
          requested: ['en'],
        }}
        messages={en}
      />,
    );
    expect(screen.getByTestId('shell-request')).toHaveAttribute(
      'data-requested-locale',
      'en',
    );
    expect(shell).toHaveBeenLastCalledWith(
      expect.objectContaining({ requestedLocale: 'en', payload }),
    );
    expect(updateLocale).toHaveBeenCalledTimes(1);
    expect(payload).toEqual(originalPayload);
  });

  it('hydrates the serialized Spanish request despite a British browser preference', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Host />);
    document.body.append(container);
    expect(container.querySelector('[data-requested-locale]')).toHaveAttribute(
      'data-requested-locale',
      'es',
    );
    const onRecoverableError = vi.fn();
    const root = hydrateRoot(container, <Host />, { onRecoverableError });
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector('[data-requested-locale]')).toHaveAttribute(
      'data-requested-locale',
      'es',
    );
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(updateLocale).not.toHaveBeenCalled();
    await act(async () => root.unmount());
    container.remove();
  });
});

describe('the thank-you page after an interview', () => {
  it('speaks the language the participant chose inside the interview', async () => {
    await frescoCatalogSource.load('fr');
    render(
      <FrescoI18nProvider initial={spanish} messages={es}>
        <ParticipantLayout>
          <InterviewCompleted language="fr" />
        </ParticipantLayout>
      </FrescoI18nProvider>,
    );
    const heading = await screen.findByRole('heading', {
      name: /^Merci de votre participation/,
    });
    expect(heading.closest('[lang]')).toHaveAttribute('lang', 'fr');
    expect(document.documentElement).toHaveAttribute('lang', 'es');
  });

  it('falls back to the host language for a choice Fresco has no catalog for', () => {
    render(
      <FrescoI18nProvider initial={spanish} messages={es}>
        <ParticipantLayout>
          <InterviewCompleted language="ja" />
        </ParticipantLayout>
      </FrescoI18nProvider>,
    );
    const heading = screen.getByRole('heading', {
      name: '¡Gracias por participar!',
    });
    expect(heading.closest('[lang]')).toBe(document.documentElement);
  });
});
