import React from 'react';
import PropTypes from 'prop-types';
import BooleanOption from './BooleanOption';

const Boolean = ({
  noReset,
  options,
  value,
  onChange,
}) => (
  <div className="form-field boolean">
    <div className="boolean__options">
      {options.map(({
        label,
        value: optionValue,
        classes,
        icon,
        negative,
      }) => (
        <BooleanOption
          classes={classes}
          key={optionValue}
          label={label}
          selected={value === optionValue}
          onClick={() => onChange(optionValue)}
          icon={icon}
          negative={negative}
        />
      ))}
    </div>
    { !noReset && (
    <div className="boolean__reset">
      <div onClick={() => onChange(null)}>
        Reset answer
      </div>
    </div>
    )}
  </div>
);

const valuePropTypes = PropTypes.oneOfType([
  PropTypes.bool,
  PropTypes.string,
  PropTypes.number,
]);

const optionPropTypes = PropTypes.shape({
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
  ]).isRequired,
  value: valuePropTypes,
  classes: PropTypes.string,
  icon: PropTypes.func,
  negative: PropTypes.bool,
}).isRequired;

Boolean.propTypes = {
  noReset: PropTypes.bool.isRequired,
  options: PropTypes.arrayOf(optionPropTypes),
  value: valuePropTypes,
  onChange: PropTypes.func,
};

Boolean.defaultProps = {
  value: null,
  options: [],
  onChange: () => {},
};

export default Boolean;
