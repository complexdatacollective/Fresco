import TextInput from './Text';

const toInt = (value) => {
  // Handle empty string explicitly
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  const int = parseInt(value, 10);
  if (Number.isNaN(int)) {
    return '';
  }
  return int;
};

const NumberInput = ({
  placeholder = 'Enter a number...',
  input: { onChange, onBlur, value, ...inputProps },
  ...numberInputProps
}) => (
  <TextInput
    type="number"
    placeholder={placeholder}
    input={{
      onChange: (e) =>
        onChange(e.target.value === '' ? '' : toInt(e.target.value)),
      onBlur: (e) =>
        onBlur && onBlur(e.target.value === '' ? '' : toInt(e.target.value)),
      value: value ?? '',
      ...inputProps,
    }}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...numberInputProps}
  />
);

NumberInput.propTypes = {
  ...TextInput.propTypes,
};

export default NumberInput;
