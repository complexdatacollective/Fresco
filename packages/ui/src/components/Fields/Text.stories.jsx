import React from 'react';
import { get } from '@codaco/utils';
import Text from '../src/components/Fields/Text';
import '../src/styles/_all.scss';

export default {
  title: 'Fields/Text',
  args: {
    value: undefined,
    error: 'Something was not right about the input',
    invalid: false,
    touched: false,
    label: 'This prompt text contains **markdown** _formatting_',
    adornmentLeft: undefined,
    adornmentRight: undefined,
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

const Template = ({
  value,
  error,
  invalid,
  touched,
  label,
  onChange,
  adornmentLeft,
  adornmentRight,
}) => {
  const input = { value, onChange };
  const meta = { error, invalid, touched };

  return (
    <>
      <Text
        input={input}
        meta={meta}
        label={label}
        adornmentLeft={get(adornments, adornmentLeft)}
        adornmentRight={get(adornments, adornmentRight)}
      />
      Next element
    </>
  );
};

export const Normal = Template.bind({});

export const WithError = Template.bind({});
WithError.args = {
  invalid: true,
  touched: true,
};

export const MultilineLabel = Template.bind({});
MultilineLabel.args = {
  label: 'This is a _particularly_ long prompt that is spread:\n- Over multiple\n- lines',
};

export const WithAdornment = Template.bind({});
WithAdornment.args = {
  adornmentLeft: 'search',
  adornmentRight: 'clear',
};
