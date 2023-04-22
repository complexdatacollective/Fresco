import React from 'react';
import PropTypes from 'prop-types';
import { noop, get, isEmpty } from 'lodash';
import SearchIcon from '@material-ui/icons/SearchRounded';
import ClearIcon from '@material-ui/icons/ClearRounded';
import { getCSSVariableAsString } from '../../utils/CSSVariables';
import Text from './Text';

const Search = (props) => {
  const color = getCSSVariableAsString('--input-text');

  const hasValue = !isEmpty(get(props, ['input', 'value'], ''));

  const onChange = get(props, ['input', 'onChange'], noop);

  const handleClear = () => {
    onChange('');
  };

  const adornmentLeft = color && (
    <SearchIcon style={{ color }} />
  );

  const adornmentRight = color && hasValue && (
    <ClearIcon
      style={{
        color,
        cursor: 'pointer',
      }}
      onClick={handleClear}
    />
  );

  return (
    <Text
      adornmentLeft={adornmentLeft}
      adornmentRight={adornmentRight}
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      type="search"
    />
  );
};

Search.defaultProps = {
  input: { onChange: noop },
};

Search.propTypes = {
  input: PropTypes.object,
};

export default Search;
