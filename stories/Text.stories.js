import TextInput from '~/lib/ui/components/Fields/Text';

export default {
  title: 'Fields/TextInput',
  component: TextInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export const Primary = {
  args: {
    type: 'text',
    placeholder: 'Placeholder Text',
    input: {
      name: 'exampleTextInput',
      value: '',
      onChange: (value) => console.log('onChange:', value),
      onBlur: (e) => console.log('onBlur:', e.target.value),
    },
    label: 'Example Label',
    meta: {
      touched: false,
      invalid: false,
      error: null,
    },
  },
};
