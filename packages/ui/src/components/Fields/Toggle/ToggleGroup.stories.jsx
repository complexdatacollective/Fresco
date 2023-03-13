import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import Harness from '@/components/StorybookHelpers/Harness';
import ToggleButtonGroup from '@/components/Fields/ToggleButtonGroup';

const requiredProps = {
  input: {},
};

export default { title: 'Fields/ToggleButtonGroup' };

export const interaction = () => {
  const [value, setValue] = useState(['foo']);
  const handleChange = (...args) => {
    setValue(...args);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      label="What is **your** occupation?"
      options={[
        { label: 'Epidemiologist', value: 1 },
        { label: 'Telecommunications *Technician*', value: 2 },
        { label: 'Manufacturing', value: 3 },
        { label: 'Industrial-Organization Psychologist', value: 4 },
        { label: '_Gardening_ Club', value: 5 },
      ]}
      input={{
        onChange: handleChange,
        value,
      }}
    >
      {(props) => <ToggleButtonGroup {...props} />}
    </Harness>
  );
};

export const moreThanTenValues = () => {
  const [value, setValue] = useState(['foo']);
  const handleChange = (...args) => {
    setValue(...args);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      label="What is **your** occupation?"
      options={[
        { label: 'One', value: 1 },
        { label: 'Two', value: 2 },
        { label: 'Three', value: 3 },
        { label: 'Four', value: 4 },
        { label: 'Five', value: 5 },
        { label: 'Six', value: 6 },
        { label: 'Seven', value: 7 },
        { label: 'Eight', value: 8 },
        { label: 'Nine', value: 9 },
        { label: 'Ten', value: 10 },
        { label: 'Eleven', value: 11 },
        { label: 'Twelve', value: 12 },
        { label: 'Thirteen', value: 13 },
        { label: 'Fourteen', value: 14 },
        { label: 'Fifteen', value: 15 },
      ]}
      input={{
        onChange: handleChange,
        value,
      }}
    >
      {(props) => <ToggleButtonGroup {...props} />}
    </Harness>
  );
};
