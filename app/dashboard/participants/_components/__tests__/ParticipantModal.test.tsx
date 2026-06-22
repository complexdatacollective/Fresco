import { FormWithoutProvider } from '@codaco/fresco-ui/form/Form';
import { type FormSubmitHandler } from '@codaco/fresco-ui/form/store/types';
import FormStoreProvider from '@codaco/fresco-ui/form/store/formStoreProvider';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { IdentifierField } from '../ParticipantModal';

// ParticipantModal imports the participant server actions (which pull in
// `server-only`). The identifier field under test never calls them, so stub the
// module to keep the component importable in jsdom.
vi.mock('~/actions/participants', () => ({
  createParticipant: vi.fn(),
  updateParticipant: vi.fn(),
}));

const noopSubmit: FormSubmitHandler = () => ({ success: true });

function renderIdentifierField() {
  return render(
    <FormStoreProvider>
      <FormWithoutProvider onSubmit={noopSubmit} id="test-form">
        <IdentifierField existingParticipants={[]} />
      </FormWithoutProvider>
    </FormStoreProvider>,
  );
}

function getIdentifierInput() {
  const input = screen.getByRole('textbox');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected the identifier field to render an input element');
  }
  return input;
}

describe('ParticipantModal identifier generate button', () => {
  test('clicking Generate fills the field without leaving a stale empty-value error', async () => {
    renderIdentifierField();

    const input = getIdentifierInput();

    // Touch the field and leave it empty so its stored value is '' (the state
    // that yields the "Identifier cannot be empty" message).
    fireEvent.change(input, { target: { value: 'p' } });
    fireEvent.change(input, { target: { value: '' } });

    // Reproduce the browser behaviour: pressing the Generate button blurs the
    // focused (empty) input, which queues validation of the empty value.
    fireEvent.blur(input);

    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(getIdentifierInput().value).toMatch(/^p-/);
    });

    await waitFor(() => {
      expect(
        screen.queryByText('Identifier cannot be empty'),
      ).not.toBeInTheDocument();
    });
  });

  test('Generate cancels mousedown so the field keeps focus and is not blurred', () => {
    renderIdentifierField();

    const generateButton = screen.getByRole('button', { name: /generate/i });

    // fireEvent returns false when the event's default action was prevented.
    const notPrevented = fireEvent.mouseDown(generateButton);

    expect(notPrevented).toBe(false);
  });
});
