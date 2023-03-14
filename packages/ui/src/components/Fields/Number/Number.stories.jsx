import Number from './Number';

export default {
  title: 'Fields/Number',
  args: {
    value: 0,
    error: 'Something was not right about the input',
    invalid: false,
    touched: false,
    label: 'This prompt text contains **markdown** _formatting_',
  },
  argTypes: {
    value: {
      control: {
        type: 'text',
      },
    },
    onChange: { action: 'onChange' },
  },
};

export const Normal = {
  render: ({ value, error, invalid, touched, label, onChange }) => {
    const input = { value, onChange };
    const meta = { error, invalid, touched };

    return (
      <>
        <Number input={input} meta={meta} label={label} />
        Next element
      </>
    );
  },
};
