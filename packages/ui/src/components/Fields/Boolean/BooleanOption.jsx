import React, { memo, useRef } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import RoundCheckbox from './RoundCheckbox';
import Markdown from '../../Markdown';
import useSize from '../../../hooks/useSize';

const BooleanOption = ({
  classes,
  selected,
  label,
  onClick,
  customIcon,
  negative,
}) => {
  const sizeRef = useRef(null);
  const size = useSize(sizeRef);

  const classNames = cx(
    'boolean-option',
    { 'boolean-option--selected': selected },
    { 'boolean-option--negative': negative },
    { 'boolean-option--collapsed': size && size.width < 235 },
    classes,
  );

  const renderLabel = () => {
    if (typeof label === 'function') {
      return label();
    }

    return <Markdown label={label} className="form-field-inline-label" />;
  };

  return (
    <div
      className={classNames}
      onClick={onClick}
      onKeyDown={onClick}
      role="button"
      tabIndex={0}
      ref={sizeRef}
    >
      {customIcon || <RoundCheckbox checked={selected} negative={negative} />}
      {renderLabel()}
    </div>
  );
};

BooleanOption.propTypes = {
  classes: PropTypes.string,
  selected: PropTypes.bool,
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
  ]).isRequired,
  onClick: PropTypes.func,
  customIcon: PropTypes.func,
  negative: PropTypes.bool,
};

BooleanOption.defaultProps = {
  classes: null,
  selected: false,
  onClick: () => { },
  customIcon: null,
  negative: false,
};

export default memo(BooleanOption);
