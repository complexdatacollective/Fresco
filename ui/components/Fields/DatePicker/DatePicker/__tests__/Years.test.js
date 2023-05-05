/* eslint-env jest */

import React from 'react';
import { mount } from 'enzyme';
import DatePicker from '../DatePicker';
import Years from '../Years';

const getSubject = (props) => {
  const mockFunctionalComponent = jest.fn(() => null);

  mount((
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DatePicker {...props}>
      <Years>{mockFunctionalComponent}</Years>
    </DatePicker>
  ));

  return mockFunctionalComponent;
};

describe('<Years>', () => {
  it('provides years from min to max', () => {
    const subject = getSubject({
      min: '1977-07-07',
      max: '1989-09-09',
    });

    expect(subject.mock.calls[0][0])
      .toMatchSnapshot();
  });
});
