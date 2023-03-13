import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import Harness from '@/components/StorybookHelpers/Harness';
import Toggle from '@/components/Fields/Toggle';

const requiredProps = {
  input: {},
};

export default { title: 'Fields/Toggle' };

export const off = () => (
  <Harness
    requiredProps={requiredProps}
    label="Is this switch on?"
    input={{
      value: false,
    }}
  >
    {(props) => <Toggle {...props} />}
  </Harness>
);

export const on = () => (
  <Harness
    requiredProps={requiredProps}
    label="Is this switch **on**?"
    input={{
      value: true,
    }}
  >
    {(props) => <Toggle {...props} />}
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
      label="Is this switch *on*?"
      input={{
        onChange: handleChange,
        value,
      }}
    >
      {(props) => <Toggle {...props} />}
    </Harness>
  );
};

export const fieldLabelInteraction = () => {
  const [value, setValue] = useState(false);
  const handleChange = (...args) => {
    setValue((v) => !v);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      fieldLabel="Is this switch *on*?"
      input={{
        onChange: handleChange,
        value,
      }}
    >
      {(props) => <Toggle {...props} />}
    </Harness>
  );
};

export const disabled = () => {
  const [value, setValue] = useState(false);
  const handleChange = (...args) => {
    setValue((v) => !v);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      label="Is this switch *on*?"
      disabled
      input={{
        onChange: handleChange,
        value,
      }}
    >
      {(props) => <Toggle {...props} />}
    </Harness>
  );
};
