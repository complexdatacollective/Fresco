import ProgressBar from './ProgressBar';

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

export const normal = {
  render: (props) => (
    <div style={{ height: '650px' }}>
      <ProgressBar {...props} />
    </div>
  ),
};

export const horizontal = {
  render: (props) => (
    <div style={{ height: '650px' }}>
      <ProgressBar {...props} />
    </div>
  ),

  args: {
    orientation: 'horizontal',
  },
};

export const indeterminate = {
  render: (props) => (
    <div style={{ height: '650px' }}>
      <ProgressBar {...props} />
    </div>
  ),

  args: {
    orientation: 'horizontal',
    indeterminate: true,
  },
};

export const complete = {
  render: (props) => (
    <div style={{ height: '650px' }}>
      <ProgressBar {...props} />
    </div>
  ),

  args: {
    orientation: 'horizontal',
    percentProgress: 100,
    nudge: true,
  },
};
