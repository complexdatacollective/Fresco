import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import Harness from '@/components/StorybookHelpers/Harness';
import RadioGroup from '@/components/Fields/RadioGroup';
import '@/styles/_all.scss';

const requiredProps = {
  input: {},
};

export default { title: 'Fields/RadioGroup' };

export const interaction = () => {
  const [value, setValue] = useState('foo');
  const handleChange = (...args) => {
    setValue(...args);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      label="What do you make of **that**?"
      options={[
        { label: 'foo', value: 'foo' },
        { label: 'bar', value: 'bar' },
        { label: '*bazz* that also\n\nhas new lines', value: 'bazz' },
        { label: 'zook', value: 'zook' },
      ]}
      input={{
        onChange: handleChange,
        value,
      }}
    >
      {(props) => <RadioGroup {...props} />}
    </Harness>
  );
};
