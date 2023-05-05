/* eslint-env jest */

import React from 'react';
import { mount } from 'enzyme';
import Field from '../Field';
import Slider from '../Slider';
import Tick from '../Tick';
import Handle from '../Handle';

const getMockProps = (props) => ({
  input: { onChange: () => {} },
  meta: { error: null, invalid: null, touched: null },
  ...props,
});

describe('Slider/Field', () => {
  it('Correctly renders LIKERT slider (ordinal variable)', () => {
    const mockProps = getMockProps({
      type: 'ordinal',
      options: [
        { value: 'FOO', label: 'foo' },
        { value: 'BAR', label: 'bar' },
        { value: 'BAZZ', label: 'bazz' },
        { value: 'FIZZ', label: 'fizz' },
      ],
    });
    // eslint-disable-next-line react/jsx-props-no-spreading
    const subject = mount((<Field {...mockProps} />));
    expect(subject.html()).toMatchSnapshot();

    const slider = subject.find(Slider);
    expect(slider.prop('type')).toEqual('LIKERT');

    const ticks = subject.find(Tick);
    expect(ticks).toHaveLength(4);

    const handle = subject.find(Handle);
    handle.find('.form-field-slider__handle').simulate('mousedown');
    const tooltip = handle.find('.form-field-slider__tooltip');
    expect(tooltip.html()).toMatchSnapshot();
  });

  it('Correctly renders VISUAL ANALOG SCALE slider (scalar variable)', () => {
    const mockProps = getMockProps({
      type: 'scalar',
      options: {
        minLabel: 'Fizz',
        maxLabel: 'Bazz',
      },
    });
    // eslint-disable-next-line react/jsx-props-no-spreading
    const subject = mount((<Field {...mockProps} />));
    expect(subject.html()).toMatchSnapshot();

    const slider = subject.find(Slider);
    expect(slider.prop('type')).toEqual('VAS');

    const ticks = subject.find(Tick);
    expect(ticks).toHaveLength(2);

    const handle = subject.find(Handle);
    handle.find('.form-field-slider__handle').simulate('mousedown');

    expect(handle.exists('.form-field-slider__tooltip')).toBe(false);
  });

  it('Correctly renders slider (number variable)', () => {
    const mockProps = getMockProps({
      type: 'number',
    });
    // eslint-disable-next-line react/jsx-props-no-spreading
    const subject = mount((<Field {...mockProps} />));
    expect(subject.html()).toMatchSnapshot();

    const slider = subject.find(Slider);
    expect(slider.prop('type')).toEqual(null);

    const ticks = subject.find(Tick);
    expect(ticks).toHaveLength(0);

    const handle = subject.find(Handle);
    handle.find('.form-field-slider__handle').simulate('mousedown');
    const tooltip = handle.find('.form-field-slider__tooltip');
    expect(tooltip.html()).toMatchSnapshot();
  });
});
