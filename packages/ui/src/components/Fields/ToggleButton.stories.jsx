import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import Harness from '@/components/StorybookHelpers/Harness';
import ToggleButton from '@/components/Fields/ToggleButton';
import '@/styles/_all.scss';

const requiredProps = {
  input: {},
};

export default { title: 'Fields/ToggleButton' };

export const off = () => (
  <Harness
    requiredProps={requiredProps}
    label="Is this switch on?"
    input={{
      value: false,
    }}
  >
    {(props) => <ToggleButton {...props} />}
  </Harness>
);

export const on = () => (
  <Harness
    requiredProps={requiredProps}
    label="Is this switch on?"
    input={{
      value: true,
    }}
  >
    {(props) => <ToggleButton {...props} />}
  </Harness>
);

export const interaction = () => {
  const [value, setValue] = useState(false);
  const handleChange = (...args) => {
    setValue((v) => !v);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      label="Is this switch on?"
      input={{
        onChange: handleChange,
        value,
      }}
    >
      {(props) => <ToggleButton {...props} />}
    </Harness>
  );
};
