import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppI18nProvider } from '@codaco/app-i18n/react';
import { DeleteInterviewsDialog } from '~/app/dashboard/interviews/_components/DeleteInterviewsDialog';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const { deleteInterviews } = vi.hoisted(() => ({
  deleteInterviews: vi.fn<(ids: { id: string }[]) => Promise<void>>(),
}));
vi.mock('~/actions/interviews', () => ({ deleteInterviews }));

describe('DeleteInterviewsDialog', () => {
  it('cannot be cancelled or dismissed while the deletion runs', async () => {
    const deletion = Promise.withResolvers<void>();
    deleteInterviews.mockReturnValue(deletion.promise);
    const setOpen = vi.fn();
    render(
      <AppI18nProvider
        locale="en"
        locales={frescoLocales}
        messages={frescoCatalogSource.peek('en')}
      >
        <DeleteInterviewsDialog
          open
          setOpen={setOpen}
          interviewsToDelete={[{ id: 'interview-1', exportTime: new Date(0) }]}
        />
      </AppI18nProvider>,
    );

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Delete interview' }));

    expect(
      await screen.findByRole('button', { name: 'Deleting…' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(setOpen).not.toHaveBeenCalled();

    deletion.resolve();
    await waitFor(() => expect(setOpen).toHaveBeenCalledWith(false));
    expect(deleteInterviews).toHaveBeenCalledWith([{ id: 'interview-1' }]);
  });
});
