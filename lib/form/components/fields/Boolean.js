import cx from 'classnames';
import PropTypes from 'prop-types';
import { useCallback, useMemo } from 'react';
import Boolean from '~/lib/ui/components/Boolean/Boolean';
import { useFieldContext } from '~/lib/form/utils/formContexts';
import Icon from '~/lib/ui/components/Icon';
import MarkdownLabel from './MarkdownLabel';

const BooleanField = ({
  label,
  fieldLabel,
  noReset = false,
  className = '',
  disabled = false,
  onChange,
  options = [
    { label: 'Yes', value: true },
    { label: 'No', value: false, negative: true },
  ],
}) => {
  const fieldContext = useFieldContext();

  const value = useMemo(
    () => fieldContext.state.value,
    [fieldContext.state.value],
  );

  const handleChange = useCallback(
    (newValue) => {
      fieldContext.handleChange(newValue);
      if (onChange) {
        onChange(newValue);
      }
    },
    [fieldContext, onChange],
  );

  const invalid = !fieldContext.state.meta.isValid;
  const touched = fieldContext.state.meta.isTouched;
  const error = fieldContext.state.meta.errors?.[0];

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
    <div className={componentClasses} name={fieldContext.name}>
      {anyLabel && <MarkdownLabel label={anyLabel} />}
      <div className="form-field-boolean__control">
        <Boolean
          options={options}
          value={value}
          onChange={handleChange}
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

BooleanField.propTypes = {
  label: PropTypes.string,
  fieldLabel: PropTypes.string,
  noReset: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
      value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string, PropTypes.number]).isRequired,
      classes: PropTypes.string,
      icon: PropTypes.func,
      negative: PropTypes.bool,
    }),
  ),
};

export default BooleanField;
