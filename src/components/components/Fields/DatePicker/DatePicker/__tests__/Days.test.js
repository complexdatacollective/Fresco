/* eslint-env jest */

import React from 'react';
import { mount } from 'enzyme';
import DatePicker from '../DatePicker';
import Days from '../Days';

const getSubject = (props) => {
  const mockFunctionalComponent = jest.fn(() => null);

  mount((
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DatePicker {...props}>
      <Days>{mockFunctionalComponent}</Days>
    </DatePicker>
  ));

  return mockFunctionalComponent;
};

describe('<Days>', () => {
  it('provides days in month for selected date', () => {
    const shortMonth = getSubject({ date: '2019-02-01' });

    expect(shortMonth.mock.calls[0][0])
      .toMatchSnapshot();
  });

  it('marks days as out of range', () => {
    const shortMonth = getSubject({ date: '2019-02-14', min: '2019-02-04', max: '2019-02-25' });

    expect(shortMonth.mock.calls[0][0])
      .toMatchSnapshot();
  });
});
