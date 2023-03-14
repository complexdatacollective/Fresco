import Prompt from './Prompt';

const prompt = `Within the **past 6 months**, who have you felt close to, or discussed important personal matters with?`;

export default {
  title: 'Components/Prompt',
  component: Prompt,
};

export const Primary = {
  render: ({ ...args }) => {
    const props = {
      ...args,
    };

    return (
      <div style={{ background: 'var(--background)' }}>
        <Prompt {...props} />
      </div>
    );
  },

  args: {
    id: '123',
    text: prompt,
  },
};

export const Truncation = {
  render: ({ ...args }) => {
    const props = {
      ...args,
    };

    return (
      <div
        style={{
          background: 'var(--background)',
          border: '1px solid red',
          width: '20%',
          height: '50%',
          '--number-of-lines': args.lines,
        }}
      >
        <Prompt {...props} />
      </div>
    );
  },

  args: {
    id: '123',
    text: 'This is a really long prompt that should be wrapped first over multiple lines but will then ultimately be truncated with ellipses because nobody should ever need to write this much for any reason at all',
    speakable: false,
    lines: 3,
  },
};
