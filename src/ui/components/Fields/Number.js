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
  ...rest
}) => (
  <TextInput
    type="number"
    placeholder={placeholder}
    input={{
      onChange: (e) => rest.input.onChange(toInt(e.target.value)),
      onBlur: (e) => rest.input.onBlur(toInt(e.target.value)),
      ...rest.input,
    }}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...rest}
  />
);

NumberInput.propTypes = {
  ...TextInput.propTypes,
};

export default NumberInput;
