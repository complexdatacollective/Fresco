/* eslint-env jest */

import React from 'react';
import { mount } from 'enzyme';
import DatePicker from '../DatePicker';
import Months from '../Months';

const getSubject = (props) => {
  const mockFunctionalComponent = jest.fn(() => null);

  mount((
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DatePicker {...props}>
      <Months>{mockFunctionalComponent}</Months>
    </DatePicker>
  ));

  return mockFunctionalComponent;
};

describe('<Months>', () => {
  it('provides months', () => {
    const subject = getSubject();

    expect(subject.mock.calls[0][0])
      .toMatchSnapshot();
  });

  it('for empty date, marks all months as out of range', () => {
    const shortMonth = getSubject({ min: '2019-05-01', max: '2019-08-01' });

    expect(shortMonth.mock.calls[0][0])
      .toMatchSnapshot();
  });

  it('marks months as out of range', () => {
    const shortMonth = getSubject({ date: '2019-06-01', min: '2019-05-01', max: '2019-08-01' });

    expect(shortMonth.mock.calls[0][0])
      .toMatchSnapshot();
  });
});
