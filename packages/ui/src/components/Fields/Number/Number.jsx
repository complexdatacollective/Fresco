import { has } from '@codaco/utils';
import { useMemo } from 'react';
import TextInput from './Text';

const toInt = (value) => {
  const int = parseInt(value, 10);
  if (Number.isNaN(int)) {
    return null;
  }
  return int;
};

export const NumberInput = (props) => {
  const {
    placeholder,
    input,
  } = props;

  const inputProps = useMemo(() => ({
    ...input,
    onChange: (e) => has(props, 'input.onChange')
      && props.input.onChange(toInt(e.target.value)),
    onBlur: (e) => has(props, 'input.onBlur')
      && props.input.onBlur(toInt(e.target.value)),
  }), [input]);

  return (
    <TextInput
      type="number"
      placeholder={placeholder ? placeholder : 'Enter a number...'}
      input={inputProps}
    />
  );
}


export default NumberInput;
