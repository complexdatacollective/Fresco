/* eslint-env jest */

import React from 'react';
import { mount } from 'enzyme';
import { DateTime } from 'luxon';
import DatePicker from '../DatePicker';
import DatePickerContext from '../DatePickerContext';

const getSubject = (props = {}) => {
  const mockFunctionalComponent = jest.fn(() => null);

  mount((
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DatePicker {...props}>
      <DatePickerContext.Consumer>
        {mockFunctionalComponent}
      </DatePickerContext.Consumer>
    </DatePicker>
  ));

  return mockFunctionalComponent;
};

describe('<DatePicker>', () => {
  it('onChange (context) does not call onChange (prop) when date is incomplete', () => {
    const mockOnChange = jest.fn();
    const subject = getSubject({ onChange: mockOnChange });

    const context = subject.mock.calls[0][0];

    context.onChange({ year: 2020 });

    expect(mockOnChange.mock.calls).toHaveLength(0);
  });

  it('onChange (context) calls onChange (prop) with formatted date when date is complete', () => {
    const mockOnChange = jest.fn();
    const subject = getSubject({ onChange: mockOnChange });

    const context = subject.mock.calls[0][0];

    context.onChange({ year: 2020, month: 1, day: 2 });

    expect(mockOnChange.mock.calls[0][0]).toEqual('2020-01-02');
  });

  it('correctly formats month type', () => {
    const mockOnChange = jest.fn();
    const subject = getSubject({ onChange: mockOnChange, type: 'month' });

    const context = subject.mock.calls[0][0];

    context.onChange({ year: 2020, month: 1 });

    expect(mockOnChange.mock.calls[0][0]).toEqual('2020-01');
  });

  it('correctly formats year type', () => {
    const mockOnChange = jest.fn();
    const subject = getSubject({ onChange: mockOnChange, type: 'year' });

    const context = subject.mock.calls[0][0];

    context.onChange({ year: 2020 });

    expect(mockOnChange.mock.calls[0][0]).toEqual('2020');
  });

  it('default min is 100 years ago', () => {
    const { year, month, day } = DateTime.local().minus({ years: 100 }).toObject();
    const subject = getSubject();
    const context = subject.mock.calls[0][0];
    expect(context.range.start.toObject())
      .toMatchObject({ year, month, day });
  });

  it('default max is now', () => {
    const { year, month, day } = DateTime.local().toObject();
    const subject = getSubject();
    const context = subject.mock.calls[0][0];
    expect(context.range.end.toObject())
      .toMatchObject({ year, month, day });
  });
});
