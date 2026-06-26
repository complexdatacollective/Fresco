import Field from '@codaco/fresco-ui/form/Field/Field';
import { FormWithoutProvider } from '@codaco/fresco-ui/form/Form';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import { type FormSubmitHandler } from '@codaco/fresco-ui/form/store/types';
import FormStoreProvider from '@codaco/fresco-ui/form/store/formStoreProvider';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { z } from 'zod/mini';
import { FieldGenerateButton } from '../FieldGenerateButton';

const noopSubmit: FormSubmitHandler = () => ({ success: true });

function renderField() {
  return render(
    <FormStoreProvider>
      <FormWithoutProvider onSubmit={noopSubmit} id="test-form">
        <Field
          name="token"
          label="Token"
          type="text"
          component={InputField}
          custom={{
            schema: z.string().check(z.minLength(1, 'Token cannot be empty')),
            hint: 'A token',
          }}
          suffixComponent={
            <FieldGenerateButton
              fieldName="token"
              generate={() => 'generated-token'}
            >
              Generate
            </FieldGenerateButton>
          }
        />
      </FormWithoutProvider>
    </FormStoreProvider>,
  );
}

function getInput() {
  const input = screen.getByRole('textbox');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected the field to render an input element');
  }
  return input;
}

describe('FieldGenerateButton', () => {
  test('writes the generated value and clears a stale validation error', async () => {
    renderField();
    const input = getInput();

    // Leave the field touched-but-empty (so it validates as invalid), then blur
    // as the browser does when the button is pressed.
    fireEvent.change(input, { target: { value: 'x' } });
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(getInput().value).toBe('generated-token');
    });
    await waitFor(() => {
      expect(
        screen.queryByText('Token cannot be empty'),
      ).not.toBeInTheDocument();
    });
  });

  test('cancels mousedown so it does not blur the field', () => {
    renderField();

    const notPrevented = fireEvent.mouseDown(
      screen.getByRole('button', { name: /generate/i }),
    );

    expect(notPrevented).toBe(false);
  });
});
