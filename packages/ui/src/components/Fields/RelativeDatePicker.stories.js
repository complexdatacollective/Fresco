import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import Harness from './helpers/Harness';
import RelativeDatePicker from '../src/components/Fields/RelativeDatePicker';
import '../src/styles/_all.scss';

const requiredProps = {
  label: 'Please __choose__ a date',
  input: { value: null },
  meta: {},
};

export default { title: 'Fields/RelativeDatePicker' };

export const Field = () => {
  const [value, setValue] = useState('2019-09-09');
  const handleChange = (...args) => {
    setValue(...args);
    action('change')(...args);
  };

  return (
    <Harness
      requiredProps={requiredProps}
      input={{
        onBlur: handleChange,
        value,
      }}
    >
      {props => (
        <div>
          <RelativeDatePicker {...props} />
          Next element
        </div>
      )}
    </Harness>
  );
};

export const WithPlaceholder = () => {

  return (
    <Harness
      requiredProps={requiredProps}
      placeholder="This is my placeholder"
    >
      {props => (
        <div>
          <RelativeDatePicker {...props} />
          Next element
        </div>
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


  const renderMeta = { error: 'Something was not right about the input', invalid: meta, touched: meta };

  return (
    <Harness
      requiredProps={requiredProps}
      meta={renderMeta}
    >
      {props => (
        <div>
          <button onClick={toggleError}>Toggle Error</button>
          <div>
            <RelativeDatePicker {...props} />
            Next element
          </div>
        </div>
      )}
    </Harness>
  );
};

export const AutoScroll = () => (
  <Harness requiredProps={requiredProps}>
    {props => (
      <div style={{ backgroundColor: 'var(--color-slate-blue)', height: '400px', overflowY: 'scroll' }}>
        <div style={{ padding: '300px 0' }}>
          <RelativeDatePicker {...props} />
        </div>
      </div>
    )}
  </Harness>
);
