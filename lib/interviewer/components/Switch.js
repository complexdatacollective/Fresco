import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { v4 as uuid } from 'uuid';

const Switch = ({
  label,
  on = false,
  disabled = false,
  className,
  onChange,
}) => {
  const id = useRef(uuid());

  const classes = cx(
    'switch',
    className,
    { 'switch--on': on },
    { 'switch--disabled': disabled },
  );

  return (
    <label className={classes} htmlFor={id.current} title={label}>
      <input
        className="switch__input"
        id={id.current}
        checked={on}
        disabled={disabled}
        type="checkbox"
        value="true"
        onChange={() => onChange?.()}
      />
      <div className="switch__button" />
      <div className="switch__label">{label}</div>
    </label>
  );
};

Switch.propTypes = {
  label: PropTypes.string,
  disabled: PropTypes.bool,
  on: PropTypes.bool,
  className: PropTypes.string,
  onChange: PropTypes.func,
};

export default Switch;
