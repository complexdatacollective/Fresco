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
  input: { onChange, onBlur, ...inputProps },
  ...numberInputProps
}) => (
  <TextInput
    type="number"
    placeholder={placeholder}
    input={{
      onChange: (value) => onChange(toInt(value)),
      onBlur: (e) => onBlur(toInt(e.target.value)),
      onKeyDown: (e) => {
        // Only allow numeric characters, '-', backspace, delete, and arrow keys
        if (
          !/^[0-9-]$/.test(e.key) &&
          ![
            'Backspace',
            'Delete',
            'ArrowLeft',
            'ArrowRight',
            'ArrowUp',
            'ArrowDown',
          ].includes(e.key)
        ) {
          e.preventDefault();
        }
      },
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
