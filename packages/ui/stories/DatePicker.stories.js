import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import Harness from './helpers/Harness';
import DatePicker, { DATE_FORMATS } from '../src/components/Fields/DatePicker';
import '../src/styles/_all.scss';

const requiredProps = {
  label: 'Please __choose__ a date',
  input: { value: null },
  meta: {},
};

export default { title: 'Fields/DatePicker' };

export const Field = () => {
  const [value, setValue] = useState('1959-09-09');
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
          <DatePicker {...props} />
          Next element
        </div>
      )}
    </Harness>
  );
};

export const Parameters = () => {
  const [value, setValue] = useState('1959-09');
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
      parameters={{
        type: 'month',
        min: '1000-01',
        max: '3000-12',
      }}
    >
      {props => (
        <div>
          <DatePicker {...props} />
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
          <DatePicker {...props} />
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
            <DatePicker {...props} />
            Next element
          </div>
        </div>
      )}
    </Harness>
  );
};

export const AutoScroll = () => (
  <Harness
    requiredProps={requiredProps}
    parameters={{
      min: '1000-01',
      max: '3000-12',
    }}
  >
    {props => (
      <div style={{
        backgroundColor: 'var(--color-slate-blue)',
        height: '500px',
        overflowY: 'scroll',
        scrollBehavior: 'smooth',
        position: 'relative',
        top: '3rem',
      }}
      >
        <div style={{ padding: '400px 0' }}>
          <DatePicker {...props} />
        </div>
      </div>
    )}
  </Harness>
);

export const LightPanelBackground = () => {
  const [value, setValue] = useState('1959-09-09');
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
          <div style={{"--input-panel-bg": "white",
        "--input-text": "rgb(109, 111, 118)"}}>
            <DatePicker {...props} />
          </div>
          Next element
        </div>
      )}
    </Harness>
  );
};
