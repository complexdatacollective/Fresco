/* eslint-env jest */

import React from 'react';
import { mount } from 'enzyme';
import DatePicker from '../DatePicker';
import Date from '../Date';

const getSubject = (props) => {
  const mockFunctionalComponent = jest.fn(() => null);

  mount((
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DatePicker {...props}>
      <Date>{mockFunctionalComponent}</Date>
    </DatePicker>
  ));

  return mockFunctionalComponent;
};

describe('<Date>', () => {
  it('calls child component with correct arguments', () => {
    const subject = getSubject({ date: '2019-12-09' });

    expect(subject.mock.calls[0][0]).toMatchObject({
      date: { year: 2019, month: 12, day: 9 },
      isComplete: true,
      isEmpty: false,
      type: 'full',
    });
    expect(subject.mock.calls[0][0]).toHaveProperty('onChange');
  });

  it('onChange updates date', () => {
    const subject = getSubject({
      date: '2019-12-09',
    });

    const context = subject.mock.calls[0][0];

    context.onChange({ year: 2020, month: 1, day: 2 });

    expect(subject.mock.calls[1][0].date)
      .toMatchObject({ year: 2020, month: 1, day: 2 });
  });

  it('has null date when date is empty string <DatePicker />', () => {
    const subject = getSubject({ date: '' });

    expect(subject.mock.calls[0][0]).toMatchObject({
      date: { year: null, month: null, day: null },
      isEmpty: true,
      isComplete: false,
    });
  });

  it('when type is "month", date is complete without day <DatePicker />', () => {
    const subject = getSubject({ date: '2019-12', type: 'month' });

    expect(subject.mock.calls[0][0]).toMatchObject({
      date: { year: 2019, month: 12 },
      isComplete: true,
      isEmpty: false,
    });
  });

  it('when type is "year", date is complete without day or month <DatePicker />', () => {
    const subject = getSubject({ date: '2019', type: 'year' });

    expect(subject.mock.calls[0][0]).toMatchObject({
      date: { year: 2019 },
      isComplete: true,
      isEmpty: false,
    });
  });
});
