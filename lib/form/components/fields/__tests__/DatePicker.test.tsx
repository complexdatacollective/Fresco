import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Field from '~/lib/form/components/Field/Field';
import Form from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import DatePickerField from '~/lib/form/components/fields/DatePicker';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';

function optionValues(select: HTMLElement): string[] {
  return Array.from(select.querySelectorAll('option'))
    .map((option) => option.value)
    .filter((value) => value !== '');
}

describe('DatePickerField month mode', () => {
  it('derives year range from YYYY-MM-DD min/max without timezone drift', () => {
    render(
      <DatePickerField
        type="month"
        name="date"
        min="2000-01-01"
        max="2020-12-31"
      />,
    );
    const [yearSelect] = screen.getAllByRole('combobox');
    if (!yearSelect) throw new Error('year select not rendered');

    const years = optionValues(yearSelect);
    expect(years[0]).toBe('2020');
    expect(years[years.length - 1]).toBe('2000');
    expect(years).not.toContain('1999');
    expect(years).not.toContain('2021');
  });

  it('omits months before min.month when min year is selected', () => {
    render(
      <DatePickerField
        type="month"
        name="date"
        min="2000-03-15"
        max="2020-12-31"
      />,
    );
    const [yearSelect, monthSelect] = screen.getAllByRole('combobox');
    if (!yearSelect || !monthSelect) {
      throw new Error('selects not rendered');
    }

    fireEvent.change(yearSelect, { target: { value: '2000' } });

    expect(optionValues(monthSelect)).toEqual([
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12',
    ]);
  });

  it('omits months after max.month when max year is selected', () => {
    render(
      <DatePickerField
        type="month"
        name="date"
        min="2000-01-01"
        max="2020-05-15"
      />,
    );
    const [yearSelect, monthSelect] = screen.getAllByRole('combobox');
    if (!yearSelect || !monthSelect) {
      throw new Error('selects not rendered');
    }

    fireEvent.change(yearSelect, { target: { value: '2020' } });

    expect(optionValues(monthSelect)).toEqual(['01', '02', '03', '04', '05']);
  });

  it('shows all twelve months for a year strictly between min and max', () => {
    render(
      <DatePickerField
        type="month"
        name="date"
        min="2000-03-01"
        max="2020-05-31"
      />,
    );
    const [yearSelect, monthSelect] = screen.getAllByRole('combobox');
    if (!yearSelect || !monthSelect) {
      throw new Error('selects not rendered');
    }

    fireEvent.change(yearSelect, { target: { value: '2010' } });

    expect(optionValues(monthSelect)).toHaveLength(12);
  });
});

describe('DatePickerField within Field — min/max validation', () => {
  async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
  }

  function renderField() {
    const { container } = render(
      <FormStoreProvider>
        <Field
          name="dob"
          label="Date of birth"
          component={DatePickerField}
          type="full"
          min="2000-01-01"
          max="2020-12-31"
        />
      </FormStoreProvider>,
    );
    const input = container.querySelector('input[name="dob"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('date input not rendered');
    }
    return input;
  }

  it('shows an error on blur when the typed full-date value is before min', async () => {
    const input = renderField();
    fireEvent.change(input, { target: { value: '1999-12-31' } });
    fireEvent.blur(input);

    await flushMicrotasks();

    const error = await screen.findByTestId('dob-field-error');
    expect(error).toHaveTextContent('Must be on or after January 1, 2000.');
  });

  it('shows an error on blur when the typed full-date value is after max', async () => {
    const input = renderField();
    fireEvent.change(input, { target: { value: '2021-01-01' } });
    fireEvent.blur(input);

    await flushMicrotasks();

    const error = await screen.findByTestId('dob-field-error');
    expect(error).toHaveTextContent('Must be on or before December 31, 2020.');
  });

  it('does not show an error for an in-range value', async () => {
    const input = renderField();
    fireEvent.change(input, { target: { value: '2010-06-15' } });
    fireEvent.blur(input);

    await flushMicrotasks();

    expect(screen.queryByTestId('dob-field-error')).not.toBeInTheDocument();
  });

  it('still forwards min/max to the native date input so the picker UI is constrained', () => {
    const input = renderField();
    expect(input).toHaveAttribute('min', '2000-01-01');
    expect(input).toHaveAttribute('max', '2020-12-31');
  });
});

describe('DatePickerField year mode', () => {
  it('derives year range from YYYY-MM-DD min/max without timezone drift', () => {
    render(
      <DatePickerField
        type="year"
        name="date"
        min="2000-01-01"
        max="2020-12-31"
      />,
    );
    const yearSelect = screen.getByRole('combobox');
    const years = optionValues(yearSelect);
    expect(years[0]).toBe('2020');
    expect(years[years.length - 1]).toBe('2000');
    expect(years).not.toContain('1999');
    expect(years).not.toContain('2021');
  });
});

describe('DatePickerField within Form — submit path', () => {
  it('shows validation error on submit for an out-of-range typed value (mirrors useProtocolForm story)', async () => {
    const onSubmit = vi.fn(() => Promise.resolve({ success: true as const }));
    const { container } = render(
      <Form onSubmit={onSubmit}>
        <Field
          name="birthDate"
          label="Birth Date"
          component={DatePickerField}
          type="full"
          min="1920-01-01"
          max="2010-12-31"
        />
        <SubmitButton>Submit</SubmitButton>
      </Form>,
    );

    const input = container.querySelector('input[name="birthDate"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('date input not rendered');
    }

    fireEvent.change(input, { target: { value: '2020-01-01' } });

    const submit = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByTestId('birthDate-field-error')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
