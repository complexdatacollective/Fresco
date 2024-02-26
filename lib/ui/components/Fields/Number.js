import React from 'react';
import TextInput from './Text';

const toInt = (value) => {
  const int = parseInt(value, 10);
  if (Number.isNaN(int)) {
    return null;
  }
  return int;
};

const NumberInput = ({
  placeholder = 'Enter a number...',
  input: { onChange, onBlur, ...rest },
}) => (
  <TextInput
    type="number"
    placeholder={placeholder}
    input={{
      onChange: (e) => onChange(toInt(e.target.value)),
      onBlur: (e) => onBlur(toInt(e.target.value)),
      ...rest,
    }}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...rest}
  />
);

NumberInput.propTypes = {
  ...TextInput.propTypes,
};

export default NumberInput;