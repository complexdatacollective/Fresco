import React from 'react';
import ProgressCircle from '../src/components/ProgressCircle';

import '../src/styles/_all.scss';

export default {
  title: 'Components/Progress Circle',
  args: {
    percentProgress: 50,
  },
  argTypes: {
    percentProgress: {
      options: { min: 0, max: 100, step: 1 },
      control: { type: 'range' },
    },
  },
};

const Template = (props) => (
  <div style={{ height: '7rem' }}>
    <ProgressCircle {...props} />
  </div>
);

export const normal = Template.bind({});
