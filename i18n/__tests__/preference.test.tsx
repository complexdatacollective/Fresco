import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CatalogMessages } from '@codaco/app-i18n/locales';
import { useAppIntl } from '@codaco/app-i18n/react';
import { FrescoI18nProvider, useFrescoLocale } from '~/i18n/FrescoI18nProvider';
import FrescoLocaleSwitcher from '~/i18n/FrescoLocaleSwitcher';
import type { FrescoI18nInitialization } from '~/i18n/resolve';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { updateLocale, refresh } = vi.hoisted(() => ({
  updateLocale: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('~/actions/locale', () => ({ updateLocale }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

// The catalogs the root layout would deliver with each request below, and the
// ones the tests switch to: loaded up front, so a switch changes immediately.
// German is left unloaded for the test that switches before its catalog has.
const en = await frescoCatalogSource.load('en');
const es = await frescoCatalogSource.load('es');
const enGb = await frescoCatalogSource.load('en-GB');

const initial: FrescoI18nInitialization = {
  locale: 'en',
  preference: null,
  userId: 'alice',
  requested: ['en'],
};
function Probe() {
  const intl = useAppIntl();
  const { preference, saveState } = useFrescoLocale();
  return (
    <div data-testid="state">
      {JSON.stringify({ locale: intl.locale, preference, saveState })}
    </div>
  );
}
function App({
  value = initial,
  messages = en,
}: {
  value?: FrescoI18nInitialization;
  messages?: CatalogMessages;
}) {
  return (
    <FrescoI18nProvider initial={value} messages={messages}>
      <FrescoLocaleSwitcher />
      <Probe />
      <div lang="en" dir="ltr" data-testid="interview">
        Participant content
      </div>
    </FrescoI18nProvider>
  );
}
const readState = () =>
  JSON.parse(screen.getByTestId('state').textContent ?? '{}') as {
    locale: string;
    preference: string | null;
    saveState: string;
  };
const trigger = () => screen.getByRole('combobox');
const open = async () => {
  fireEvent.click(trigger());
  return screen.findByRole('dialog', {
    name: /^(Interface language|Idioma de la interfaz)$/,
  });
};
const choose = async (name: RegExp) => {
  const popover = await open();
  fireEvent.click(screen.getByRole('option', { name }));
  await waitFor(() => expect(popover).not.toBeInTheDocument());
};
// The footer live region; Base UI's empty-state element is a status too.
const footer = () => {
  const region = screen.getAllByRole('status').at(-1);
  if (!region) throw new Error('no status region');
  return region;
};
function deferred() {
  let resolve!: (value: { success: boolean }) => void;
  const promise = new Promise<{ success: boolean }>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  updateLocale.mockResolvedValue({ success: true });
  Object.defineProperty(navigator, 'languages', {
    configurable: true,
    value: ['en-GB'],
  });
  document.documentElement.lang = 'fr';
  document.documentElement.dir = 'rtl';
});

describe('Fresco locale preference control', () => {
  it('hydrates the exact Spanish server markup despite a British browser preference', async () => {
    // Only the delivered catalog can supply Spanish: as far as the provider
    // can tell nothing has been downloaded, and nothing may be.
    const peek = vi
      .spyOn(frescoCatalogSource, 'peek')
      .mockReturnValue(undefined);
    const load = vi.spyOn(frescoCatalogSource, 'load');
    const value = { ...initial, locale: 'es', preference: 'es' };
    const markup = renderToString(<App value={value} messages={es} />);
    expect(markup).toContain('Idioma de la interfaz: Español');
    const container = document.createElement('div');
    container.innerHTML = markup;
    document.body.append(container);
    const recoverableError = vi.fn();
    const root = hydrateRoot(container, <App value={value} messages={es} />, {
      onRecoverableError: recoverableError,
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector('[role="combobox"]')).toHaveAccessibleName(
      'Idioma de la interfaz: Español',
    );
    expect(document.documentElement.lang).toBe('es');
    expect(recoverableError).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
    await act(async () => root.unmount());
    container.remove();
    peek.mockRestore();
    load.mockRestore();
  });
  it('starts from serialized server locale before reading a different browser preference', async () => {
    render(
      <App
        value={{ ...initial, locale: 'es', preference: 'es' }}
        messages={es}
      />,
    );
    expect(readState().locale).toBe('es');
    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    expect(trigger()).toHaveAccessibleName('Idioma de la interfaz: Español');
    await open();
    expect(screen.getByRole('option', { name: 'Español' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      screen.getByRole('option', { name: 'Español' }).querySelector('[lang]'),
    ).toHaveAttribute('lang', 'es');
  });
  it('names the language the automatic entry resolves to from the request', async () => {
    render(<App value={{ ...initial, requested: ['es-MX'] }} />);
    expect(trigger()).toHaveAccessibleName(
      'Interface language: Automatic (Español)',
    );
  });
  it('changes immediately, persists to the correct account, refreshes server fragments, and keeps interview lang', async () => {
    const write = deferred();
    updateLocale.mockReturnValue(write.promise);
    render(<App />);
    expect(document.documentElement.lang).toBe('en');
    await choose(/^Español$/);
    expect(document.documentElement.lang).toBe('es');
    expect(readState()).toMatchObject({ locale: 'es', saveState: 'saving' });
    expect(screen.getByTestId('interview')).toHaveAttribute('lang', 'en');
    await waitFor(() =>
      expect(updateLocale).toHaveBeenCalledWith('es', 'alice'),
    );
    await act(async () => write.resolve({ success: true }));
    expect(refresh).toHaveBeenCalled();
    expect(readState().saveState).toBe('saved');
    await open();
    expect(footer()).toHaveTextContent('Guardado en tu cuenta.');
  });
  it('keeps the current language on screen until a newly chosen one has loaded', async () => {
    const download = vi
      .spyOn(frescoCatalogSource, 'load')
      .mockReturnValue(new Promise(() => undefined));
    render(<App />);
    await choose(/^Deutsch$/);
    expect(download).toHaveBeenCalledWith('de');
    expect(readState()).toMatchObject({ locale: 'en', preference: 'de' });
    expect(document.documentElement.lang).toBe('en');
    download.mockRestore();
    await act(() => frescoCatalogSource.load('de'));
    expect(readState()).toMatchObject({ locale: 'de', preference: 'de' });
    expect(document.documentElement.lang).toBe('de');
  });
  it('reports a signed-out choice as saved on this device', async () => {
    render(<App value={{ ...initial, userId: null }} />);
    await choose(/^English \(UK\)$/);
    await waitFor(() => expect(readState().saveState).toBe('saved'));
    await open();
    expect(footer()).toHaveTextContent('Saved on this device.');
  });
  it('saves Automatic as null and uses current browser best fit', async () => {
    render(
      <App
        value={{ ...initial, locale: 'es', preference: 'es' }}
        messages={es}
      />,
    );
    await choose(/^Automático/);
    expect(document.documentElement.lang).toBe('en-GB');
    expect(trigger()).toHaveAccessibleName(
      'Interface language: Automatic (English (UK))',
    );
    await waitFor(() =>
      expect(updateLocale).toHaveBeenCalledWith(null, 'alice'),
    );
  });
  it('keeps a choice that failed to save applied and retries it from the footer', async () => {
    updateLocale.mockRejectedValueOnce(new Error('offline'));
    render(<App />);
    await choose(/^Español$/);
    await waitFor(() =>
      expect(readState()).toMatchObject({
        locale: 'es',
        preference: 'es',
        saveState: 'failed',
      }),
    );
    expect(document.documentElement.lang).toBe('es');
    expect(refresh).not.toHaveBeenCalled();
    await open();
    expect(footer()).toHaveTextContent(
      'No se pudo guardar. Por ahora, el idioma solo se aplicará en esta visita.',
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Volver a intentarlo' }),
    );
    await waitFor(() => expect(readState().saveState).toBe('saved'));
    expect(updateLocale).toHaveBeenLastCalledWith('es', 'alice');
    expect(updateLocale).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalled();
  });
  it('serializes writes and keeps a late response from replacing the latest choice', async () => {
    const first = deferred(),
      second = deferred();
    updateLocale
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    render(<App />);
    await choose(/^Español$/);
    await waitFor(() => expect(updateLocale).toHaveBeenCalledTimes(1));
    await choose(/^English \(UK\)$/);
    expect(document.documentElement.lang).toBe('en-GB');
    expect(updateLocale).toHaveBeenCalledTimes(1);
    await act(async () => first.resolve({ success: true }));
    await waitFor(() => expect(updateLocale).toHaveBeenCalledTimes(2));
    expect(readState()).toMatchObject({
      locale: 'en-GB',
      saveState: 'saving',
    });
    await act(async () => second.resolve({ success: true }));
    expect(readState()).toMatchObject({ locale: 'en-GB', saveState: 'saved' });
  });
  it('applies a new account’s automatic preference and ignores the former account’s in-flight response', async () => {
    const write = deferred();
    updateLocale.mockReturnValue(write.promise);
    const view = render(<App />);
    await choose(/^Español$/);
    await waitFor(() =>
      expect(updateLocale).toHaveBeenCalledWith('es', 'alice'),
    );
    view.rerender(
      <App
        value={{ ...initial, userId: 'bob', locale: 'en-GB' }}
        messages={enGb}
      />,
    );
    expect(readState()).toMatchObject({ locale: 'en-GB', preference: null });
    await act(async () => write.resolve({ success: true }));
    expect(readState()).toMatchObject({
      locale: 'en-GB',
      preference: null,
      saveState: 'idle',
    });
  });
  it('reports only the latest of two overlapping failed choices, keeping it applied', async () => {
    const first = deferred(),
      second = deferred();
    updateLocale
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    render(<App />);
    await choose(/^Español$/);
    await waitFor(() => expect(updateLocale).toHaveBeenCalledTimes(1));
    await choose(/^English \(UK\)$/);
    await act(async () => first.resolve({ success: false }));
    await waitFor(() => expect(updateLocale).toHaveBeenCalledTimes(2));
    expect(readState().saveState).toBe('saving');
    await act(async () => second.resolve({ success: false }));
    expect(readState()).toEqual({
      locale: 'en-GB',
      preference: 'en-GB',
      saveState: 'failed',
    });
  });
});
