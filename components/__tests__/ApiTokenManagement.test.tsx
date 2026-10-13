import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppI18nProvider } from '@codaco/app-i18n/react';
import ApiTokenManagement from '~/components/ApiTokenManagement';
import { frescoLocales } from '~/i18n/locales';
import { type GetApiTokensReturnType } from '~/queries/apiTokens';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { createApiToken, deleteApiToken } = vi.hoisted(() => ({
  createApiToken: vi.fn(),
  deleteApiToken: vi.fn(),
}));
vi.mock('~/actions/apiTokens', () => ({
  createApiToken,
  deleteApiToken,
  updateApiToken: vi.fn(),
}));
vi.mock('@codaco/fresco-ui/Toast', () => ({
  useToast: () => ({ add: vi.fn() }),
}));

const existingToken = {
  id: 'token-1',
  description: 'Existing token',
  createdAt: new Date(0),
  lastUsedAt: null,
  isActive: true,
};

// `use()` suspends on the token list, so the first render is awaited.
const renderManagement = (tokens: GetApiTokensReturnType) =>
  act(async () => {
    render(
      <AppI18nProvider
        locale="en"
        locales={frescoLocales}
        messages={frescoCatalogSource.peek('en')}
      >
        <NuqsTestingAdapter>
          <Suspense fallback={null}>
            <ApiTokenManagement tokensPromise={Promise.resolve(tokens)} />
          </Suspense>
        </NuqsTestingAdapter>
      </AppI18nProvider>,
    );
  });

const expectHeldOpen = (dialog: HTMLElement) => {
  expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(
    within(dialog).queryByRole('button', { name: 'Close' }),
  ).not.toBeInTheDocument();
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(dialog).toBeInTheDocument();
};

describe('ApiTokenManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('holds the create dialog open until the token is created', async () => {
    const creation = Promise.withResolvers<unknown>();
    createApiToken.mockReturnValue(creation.promise);
    await renderManagement([]);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Create New Token' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Create API Token',
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Create Token' }),
    );

    expect(
      await within(dialog).findByRole('button', { name: 'Creating...' }),
    ).toBeDisabled();
    expectHeldOpen(dialog);

    creation.resolve({
      error: null,
      data: { ...existingToken, id: 'token-2', token: 'secret-token' },
    });
    expect(
      await screen.findByRole('dialog', { name: 'API Token Created' }),
    ).toHaveTextContent('secret-token');
  });

  it('holds the delete dialog open until the token is deleted', async () => {
    const deletion = Promise.withResolvers<unknown>();
    deleteApiToken.mockReturnValue(deletion.promise);
    await renderManagement([existingToken]);

    fireEvent.click(await screen.findByTestId('delete-token-Existing token'));
    const dialog = await screen.findByRole('dialog', {
      name: 'Delete API Token',
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Delete Token' }),
    );

    expect(
      await within(dialog).findByRole('button', { name: 'Deleting...' }),
    ).toBeDisabled();
    expectHeldOpen(dialog);

    deletion.resolve({ error: null, data: { id: existingToken.id } });
    expect(
      await screen.findByText('No API tokens created yet.'),
    ).toBeInTheDocument();
  });
});
