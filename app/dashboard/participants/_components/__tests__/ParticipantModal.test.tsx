import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppI18nProvider } from '@codaco/app-i18n/react';
import ParticipantModal from '~/app/dashboard/participants/_components/ParticipantModal';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { createParticipant, refresh } = vi.hoisted(() => ({
  createParticipant: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('~/actions/participants', () => ({
  createParticipant,
  updateParticipant: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

describe('ParticipantModal', () => {
  it('cannot be cancelled or dismissed while the participant is saved', async () => {
    const creation = Promise.withResolvers<unknown>();
    createParticipant.mockReturnValue(creation.promise);
    const setOpen = vi.fn();
    render(
      <AppI18nProvider
        locale="en"
        locales={frescoLocales}
        messages={frescoCatalogSource.peek('en')}
      >
        <ParticipantModal open setOpen={setOpen} existingParticipants={[]} />
      </AppI18nProvider>,
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Add Participant',
    });
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Participant Identifier' }),
      { target: { value: 'p-new' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(createParticipant).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(setOpen).not.toHaveBeenCalled();

    creation.resolve({ error: null, data: null });
    await waitFor(() => expect(setOpen).toHaveBeenCalledWith(false));
    expect(refresh).toHaveBeenCalled();
  });
});
