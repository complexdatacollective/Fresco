import { withProps, compose } from 'recompose';
import { has } from 'lodash';
import TextInput from './Text';

const toInt = (value) => {
  const int = parseInt(value, 10);
  if (Number.isNaN(int)) {
    return null;
  }
  return int;
};

const withNumericChangeHandlers = withProps((props) => ({
  type: 'number',
  placeholder: props.placeholder ? props.placeholder : 'Enter a number...',
  input: {
    ...props.input,
    onChange: (e) => has(props, 'input.onChange')
      && props.input.onChange(toInt(e.target.value)),
    onBlur: (e) => has(props, 'input.onBlur')
      && props.input.onBlur(toInt(e.target.value)),
  },
}));

export default compose(
  withNumericChangeHandlers,
)(TextInput);
