import Pips from './Pips';

export default {
  title: 'Components/Pips',
  component: Pips,
};

export const Primary = {
  render: ({ ...args }) => {
    const props = {
      ...args,
    };

    return (
      <div style={{ background: 'var(--background)' }}>
        <Pips {...props} />
      </div>
    );
  },

  args: {
    count: 3,
    currentIndex: 2,
  },
};

export const Large = {
  render: ({ ...args }) => {
    const props = {
      ...args,
    };

    return (
      <div style={{ background: 'var(--background)' }}>
        <Pips {...props} />
      </div>
    );
  },

  args: {
    count: 3,
    currentIndex: 2,
    large: true,
  },
};
