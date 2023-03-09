import React from 'react';
import ProgressCircle from '@/components/ProgressCircle';

import '@/styles/_all.scss';

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

export const normal = {
  render: (props) => (
    <div style={{ height: '7rem' }}>
      <ProgressCircle {...props} />
    </div>
  ),
};
