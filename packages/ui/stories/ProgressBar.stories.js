import React from 'react';
import ProgressBar from '../src/components/ProgressBar';

import '../src/styles/_all.scss';

export default {
  title: 'Components/ProgressBar',
  args: {
    percentProgress: 50,
  },
  argTypes: {
    percentProgress: {
      options: { min: 0, max: 100, step: 1 },
      control: { type: 'range' },
    },
    orientation: {
      options: ['horizontal', 'vertical'],
      control: { type: 'radio' },
    },
  },
};

const Template = (props) => (
  <div style={{ height: '650px' }}>
    <ProgressBar {...props} />
  </div>
);

export const normal = Template.bind({});

export const horizontal = Template.bind({});
horizontal.args = {
  orientation: 'horizontal',
};

export const indeterminate = Template.bind({});
indeterminate.args = {
  orientation: 'horizontal',
  indeterminate: true,
};

export const complete = Template.bind({});
complete.args = {
  orientation: 'horizontal',
  percentProgress: 100,
  nudge: true,
};
