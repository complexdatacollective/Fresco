import { Toast } from '@base-ui/react/toast';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Suspense } from 'react';
import { SuperJSON } from 'superjson';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMessageError } from '@codaco/app-i18n/messages';
import { AppI18nProvider } from '@codaco/app-i18n/react';
import { Toaster } from '@codaco/fresco-ui/Toast';
import { SyntheticDataConstraintError } from '@codaco/protocol-utilities';
import SyntheticInterviewDataSection from '~/app/dashboard/settings/_components/SyntheticInterviewDataSection';
import { frescoLocales } from '~/i18n/locales';
import { syntheticGenerationMessages } from '~/i18n/syntheticGenerationMessages';
import { getSyntheticGenerationFailure } from '~/lib/syntheticGenerationFailure';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { deleteSyntheticData, revalidateSyntheticData, refresh } = vi.hoisted(
  () => ({
    deleteSyntheticData: vi.fn(),
    revalidateSyntheticData: vi.fn(),
    refresh: vi.fn(),
  }),
);
vi.mock('~/actions/synthetic-interviews', () => ({
  deleteSyntheticData,
  revalidateSyntheticData,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const protocolsPromise = Promise.resolve(
  SuperJSON.stringify([{ id: 'protocol-1', name: 'Protocol fixture' }]),
);
// Loaded up front, so every render and formatter below has Spanish
// synchronously.
await frescoCatalogSource.load('es');

const view = (locale: string) => (
  <AppI18nProvider
    locale={locale}
    locales={frescoLocales}
    messages={frescoCatalogSource.peek(locale)}
  >
    <Toast.Provider>
      <Suspense fallback={null}>
        <SyntheticInterviewDataSection
          protocolsPromise={protocolsPromise}
          initialCounts={{ interviewCount: 2, participantCount: 2 }}
        />
      </Suspense>
      <Toaster />
    </Toast.Provider>
  </AppI18nProvider>
);

const renderSection = (locale: string) => act(async () => render(view(locale)));

async function startGeneration() {
  fireEvent.change(
    await screen.findByRole('combobox', { name: 'Select a Protocol...' }),
    { target: { value: 'protocol-1' } },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
}

beforeEach(() => {
  revalidateSyntheticData.mockResolvedValue(undefined);
  deleteSyntheticData.mockResolvedValue({ error: null });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('synthetic generation failure presentation', () => {
  it('preserves the non-OK server refusal and updates it without resubmitting', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(
        {
          error: createMessageError(
            syntheticGenerationMessages.missingProtocol,
          ),
        },
        { status: 404 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { rerender } = await renderSection('en');
    await startGeneration();
    expect(
      await screen.findByText(
        'This protocol is no longer available. Select another protocol.',
      ),
    ).toBeVisible();
    rerender(view('es'));
    expect(
      screen.getByText(
        'Este protocolo ya no está disponible. Selecciona otro protocolo.',
      ),
    ).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows shared constraint reasons and affected names from the server stream in the current locale', async () => {
    const error = new SyntheticDataConstraintError([
      {
        entity: 'node',
        entityTypeName: 'Personas',
        variableIds: ['age'],
        variableNames: ['Age <img src=x onerror=alert(1)>'],
        rules: ['minValue', 'maxValue'],
        reason: 'original diagnostic',
        reasonCode: 'invertedBounds',
      },
    ]);
    const failure = getSyntheticGenerationFailure(error);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            `data: ${JSON.stringify({ type: 'error', ...failure })}\n\n`,
          ),
        ),
    );
    const { rerender } = await renderSection('en');
    await startGeneration();
    expect(
      await screen.findByText(
        'Attributes on node type Personas: Age <img src=x onerror=alert(1)>',
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        'The minimum exceeds the maximum, so no answer is allowed. Adjust these limits.',
      ),
    ).toBeVisible();
    rerender(view('es'));
    expect(
      screen.getByText(
        'Atributos del tipo de nodo Personas: Age <img src=x onerror=alert(1)>',
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        'El mínimo supera el máximo, por lo que no se permite ninguna respuesta. Ajusta estos límites.',
      ),
    ).toBeVisible();
    expect(document.querySelector('img[onerror]')).toBeNull();
    expect(screen.getByText('Detalles técnicos')).toBeVisible();
    expect(
      screen.getByText(error.message, { normalizer: (text) => text }),
    ).not.toBeVisible();
  });

  it.each([
    ['rejected fetch', () => Promise.reject(new Error('offline'))],
    [
      'rejected reader',
      () =>
        Promise.resolve(
          new Response(
            new ReadableStream({
              start(controller) {
                controller.error(new Error('stream failed'));
              },
            }),
          ),
        ),
    ],
    [
      'malformed event JSON',
      () => Promise.resolve(new Response('data: {bad json}\n\n')),
    ],
    [
      'truncated stream',
      () =>
        Promise.resolve(
          new Response('data: {"type":"progress","current":1,"total":2}\n\n'),
        ),
    ],
  ])(
    'handles %s with honest retry guidance and releases the busy state',
    async (_name, fetchResult) => {
      vi.stubGlobal('fetch', vi.fn(fetchResult));
      await renderSection('en');
      await startGeneration();
      expect(
        await screen.findByText(
          'Interview generation could not finish. Try again. Some interviews may already have been created.',
        ),
      ).toBeVisible();
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled(),
      );
      expect(revalidateSyntheticData).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['refusal', 'rejected request'])(
    'shows a synthetic deletion %s and keeps the existing counts',
    async (failure) => {
      if (failure === 'refusal') {
        deleteSyntheticData.mockResolvedValue({
          error: createMessageError(syntheticGenerationMessages.deleteFailed),
        });
      } else {
        deleteSyntheticData.mockRejectedValue(
          new Error('Network request failed'),
        );
      }
      const { rerender } = await renderSection('en');
      fireEvent.click(
        await screen.findByRole('button', { name: 'Delete All' }),
      );
      expect(
        await screen.findByText('Could not delete synthetic data. Try again.'),
      ).toBeVisible();
      expect(
        screen.getByText(
          'There are currently 2 synthetic interviews and 2 test participants.',
        ),
      ).toBeVisible();
      rerender(view('es'));
      expect(
        screen.getByText(
          'No se pudieron eliminar los datos sintéticos. Inténtalo de nuevo.',
        ),
      ).toBeVisible();
      expect(deleteSyntheticData).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Eliminar todo' }),
        ).toBeEnabled(),
      );
    },
  );

  it('preserves successful creation when refreshing the saved counts fails', async () => {
    revalidateSyntheticData.mockRejectedValue(
      new Error('Refresh request failed'),
    );
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('data: {"type":"complete","created":3}\n\n'),
        ),
    );
    await renderSection('en');
    await startGeneration();
    expect(
      await screen.findByText(
        'Could not refresh the latest data. Reload the page.',
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        'There are currently 5 synthetic interviews and 5 test participants.',
      ),
    ).toBeVisible();
    expect(
      screen.queryByText(
        'Interview generation could not finish. Try again. Some interviews may already have been created.',
      ),
    ).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalledOnce();
  });
});
