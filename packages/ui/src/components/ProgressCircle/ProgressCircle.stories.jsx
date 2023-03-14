import ProgressCircle from './ProgressCircle';

export default {
  title: 'Components/Progress Circle',
  component: ProgressCircle,
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
