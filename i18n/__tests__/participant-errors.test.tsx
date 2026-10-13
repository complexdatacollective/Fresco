import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createMessageError, defineMessage } from '@codaco/app-i18n/messages';
import { AppI18nProvider } from '@codaco/app-i18n/react';
import ParticipantModal from '~/app/dashboard/participants/_components/ParticipantModal';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { createParticipant, updateParticipant, refresh, setOpen } = vi.hoisted(
  () => ({
    createParticipant: vi.fn(),
    updateParticipant: vi.fn(),
    refresh: vi.fn(),
    setOpen: vi.fn(),
  }),
);
vi.mock('~/actions/participants', () => ({
  createParticipant,
  updateParticipant,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const failedUpdate = defineMessage({
  id: 'fresco.actions.participants.copyFailedToUpdateParticipant',
  defaultMessage: 'Failed to update participant',
  description: 'Participant update failure returned by the action.',
});
const participant = {
  id: 'participant-one',
  identifier: 'p-one',
  label: 'Original',
  isSynthetic: false,
  createdAt: new Date('2026-09-05T10:00:00Z'),
};
// Loaded up front, so every render and formatter below has Spanish
// synchronously.
await frescoCatalogSource.load('es');

const view = (locale: string, editing = false) => (
  <AppI18nProvider
    locale={locale}
    locales={frescoLocales}
    messages={frescoCatalogSource.peek(locale)}
  >
    <ParticipantModal
      open
      setOpen={setOpen}
      existingParticipants={[participant]}
      editingParticipant={editing ? participant : null}
    />
  </AppI18nProvider>
);

describe('participant form localized errors', () => {
  it('renders a translated field error for the initial undefined identifier', async () => {
    render(view('es'));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(
      await screen.findByText('El identificador no puede estar vacío'),
    ).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Identificador del participante' }),
    ).toHaveAttribute('aria-invalid', 'true');
    expect(createParticipant).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Identificadores de participantes' }),
    ).toBeVisible();
  });

  it('keeps an unsuccessful edit open and retranslates its action error', async () => {
    updateParticipant.mockResolvedValue({
      error: createMessageError(failedUpdate),
      data: null,
    });
    const { rerender } = render(view('en', true));
    fireEvent.change(screen.getByRole('textbox', { name: 'Label' }), {
      target: { value: 'Edited' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    expect(
      await screen.findByText('Failed to update participant'),
    ).toBeVisible();
    expect(setOpen).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    rerender(view('es', true));
    expect(
      screen.getByText('No se pudo actualizar el participante'),
    ).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Etiqueta' })).toHaveValue(
      'Edited',
    );
    expect(updateParticipant).toHaveBeenCalledTimes(1);
  });
});
