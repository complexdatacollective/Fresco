import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import MarkdownLabel from './MarkdownLabel';
import Boolean from '../Boolean/Boolean';
import Icon from '../Icon';

const BooleanField = ({
  label,
  fieldLabel,
  noReset,
  className,
  input,
  disabled,
  options,
  meta: { error, invalid, touched },
}) => {
  const componentClasses = cx(
    'form-field-container form-field-boolean',
    className,
    {
      'form-field-boolean--disabled': disabled,
    },
    {
      'form-field-boolean--has-error': invalid && touched && error,
    },
  );

  const anyLabel = fieldLabel || label;

  return (
    <div className={componentClasses} name={input.name}>
      {anyLabel && <MarkdownLabel label={anyLabel} />}
      <div className="form-field-boolean__control">
        <Boolean
          options={options}
          value={input.value}
          onChange={input.onChange}
          noReset={noReset}
        />
        {invalid && touched && (
        <div className="form-field-boolean__error">
          <Icon name="warning" />
          {error}
        </div>
        )}
      </div>
    </div>
  );
};

const valuePropTypes = PropTypes.oneOfType([
  PropTypes.bool,
  PropTypes.string,
  PropTypes.number,
]).isRequired;

BooleanField.propTypes = {
  label: PropTypes.string,
  fieldLabel: PropTypes.string,
  noReset: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  input: PropTypes.object.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func,
      ]).isRequired,
      value: valuePropTypes,
      classes: PropTypes.string,
      icon: PropTypes.func,
      negative: PropTypes.bool,
    }),
  ),
  meta: PropTypes.object,
};

BooleanField.defaultProps = {
  className: '',
  noReset: false,
  label: null,
  fieldLabel: null,
  disabled: false,
  options: [
    { label: 'Yes', value: true },
    { label: 'No', value: false, negative: true },
  ],
  meta: {},
};

export default BooleanField;
