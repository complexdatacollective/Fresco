import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import Harness from '@/components/StorybookHelpers/Harness';
import Boolean from '@/components/Fields/Boolean/BooleanField';
import Icon from '@/components/Icon';

export default { title: 'Fields/Boolean' };

const requiredProps = {
  label: 'This is the **boolean** input.',
  input: { value: null },
  meta: {},
};

export const interaction = () => {
  const [value, setValue] = useState();

  const handleChange = (...args) => {
    setValue(...args);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      label="This input type **requires** the user to _specifically_ set a value, which can also be cleared."
      input={{
        onChange: handleChange,
        value,
      }}
    >
      {(props) => (
        <>
          <Boolean {...props} />
          next element
        </>
      )}
    </Harness>
  );
};

export const jsxLabels = () => {
  const [value, setValue] = useState();

  const handleChange = (...args) => {
    setValue(...args);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      label="This input type **requires** the user to _specifically_ set a value, which can also be cleared."
      input={{
        onChange: handleChange,
        value,
      }}
      options={[
        { label: () => <h1>Yes</h1>, value: true },
        { label: () => <h1>No</h1>, value: false },
      ]}
    >
      {(props) => (
        <>
          <Boolean {...props} />
          next element
        </>
      )}
    </Harness>
  );
};

export const withoutReset = () => {
  const [value, setValue] = useState();

  const handleChange = (...args) => {
    setValue(...args);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      label="This input type **requires** the user to _specifically_ set a value, which can also be cleared."
      input={{
        onChange: handleChange,
        value,
      }}
      noReset
    >
      {(props) => (
        <>
          <Boolean {...props} />
          next element
        </>
      )}
    </Harness>
  );
};

export const longText = () => {
  const [value, setValue] = useState();

  const handleChange = (...args) => {
    setValue(...args);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      label="This version has longer labels."
      input={{
        onChange: handleChange,
        value,
      }}
      options={[
        {
          label:
            '**Yes**. This is a really long label that represents the value yes. Are there any other questions?',
          value: true,
        },
        { label: 'No', value: false },
      ]}
    >
      {(props) => (
        <>
          <Boolean {...props} />
          next element
        </>
      )}
    </Harness>
  );
};

export const longTextWithList = () => {
  const [value, setValue] = useState();

  const handleChange = (...args) => {
    setValue(...args);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      label="This version has longer labels that include list items."
      input={{
        onChange: handleChange,
        value,
      }}
      options={[
        {
          label:
            '# Yes\n\nThis is a really long label that represents the value yes.\n\n- Are there any other questions?\n\n- Are there any other questions?\n\n- Are there any other questions?',
          value: true,
        },
        {
          label:
            '# No\n\nThis is a really long label that represents the value no.\n\n- Are there any other questions?\n\n- Are there any other questions?\n\n- Are there any other questions?',
          value: false,
        },
      ]}
    >
      {(props) => (
        <>
          <Boolean {...props} />
          next element
        </>
      )}
    </Harness>
  );
};

export const withFiveItems = () => {
  const [value, setValue] = useState();

  const handleChange = (...args) => {
    setValue(...args);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      label="This version has longer labels that include list items."
      input={{
        onChange: handleChange,
        value,
      }}
      options={[
        { label: 'All the time', value: 5 },
        { label: 'Most of the time', value: 4 },
        { label: 'Sometimes', value: 3 },
        { label: 'Rarely', value: 2 },
        {
          label: 'Never',
          value: 1,
          classes: 'red',
          icon: () => <Icon name="cross" color="white" />,
        },
      ]}
    >
      {(props) => (
        <>
          <Boolean {...props} />
          next element
        </>
      )}
    </Harness>
  );
};

export const WithError = () => {
  const defaultMeta = false;
  const [meta, setMeta] = useState(defaultMeta);

  const toggleError = () => {
    setMeta(!meta);
    action('toggleError')(!meta);
  };

  const renderMeta = {
    error: 'Something was not right about the input',
    invalid: meta,
    touched: meta,
  };

  const [value, setValue] = useState();

  const handleChange = (...args) => {
    setValue(...args);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      label="This input type **requires** the user to _specifically_ set a value, which can also be cleared."
      input={{
        onChange: handleChange,
        value,
      }}
      meta={renderMeta}
    >
      {(props) => (
        <>
          <button onClick={toggleError}>Toggle Error</button>
          <Boolean {...props} />
          next element
        </>
      )}
    </Harness>
  );
};
