import cx from 'classnames';
import PropTypes from 'prop-types';
import { useCallback, useId, useMemo } from 'react';
import { useFieldContext } from '~/lib/form/utils/formContexts';
import Icon from '~/lib/ui/components/Icon';
import MarkdownLabel from './MarkdownLabel';
import { asOptionObject, getValue } from './utils/options';

const CheckboxGroup = ({ options = [], className, fieldLabel, label }) => {
  const fieldContext = useFieldContext();
  const id = useId();
  const value = useMemo(
    () => fieldContext.state.value || [],
    [fieldContext.state.value],
  );

  const handleClickOption = useCallback(
    (index) => {
      const option = getValue(options[index]);
      const isChecked = value.includes(option);
      const newValue = isChecked
        ? value.filter((v) => v !== option)
        : [...value, option];

      fieldContext.handleChange(newValue);
    },
    [options, value, fieldContext],
  );

  const isOptionChecked = useCallback(
    (option) => {
      return value.includes(option);
    },
    [value],
  );

  const renderOption = useCallback(
    (option, index) => {
      const { value: optionValue, label: optionLabel } = asOptionObject(option);
      const checked = isOptionChecked(optionValue);

      // Create a simple checkbox since Checkbox component now uses its own field context
      return (
        <label
          key={index}
          className="form-field-checkbox form-field-checkbox-group__option"
          htmlFor={`${id}-${index}`}
        >
          <input
            type="checkbox"
            className="form-field-checkbox__input"
            id={`${id}-${index}`}
            name={fieldContext.name}
            value={index}
            checked={checked}
            onChange={() => handleClickOption(index)}
          />
          <div className="form-field-checkbox__checkbox" />
          {optionLabel && (
            <MarkdownLabel
              inline
              label={optionLabel}
              className="form-field-inline-label"
            />
          )}
        </label>
      );
    },
    [fieldContext.name, handleClickOption, isOptionChecked, id],
  );

  const classNames = cx(
    'form-field-checkbox-group',
    'form-field-container',
    {
      'form-field-checkbox-group--has-error':
        !fieldContext.state.meta.isValid &&
        fieldContext.state.meta.isTouched &&
        fieldContext.state.meta.errors?.[0],
    },
    className,
  );

  const anyLabel = fieldLabel || label;

  return (
    <div className={classNames}>
      {anyLabel && <MarkdownLabel label={anyLabel} />}
      <div className="form-field" name={fieldContext.name}>
        {options.map(renderOption)}
      </div>
      {!fieldContext.state.meta.isValid &&
        fieldContext.state.meta.isTouched && (
          <div className="form-field-checkbox-group__error">
            <Icon name="warning" />
            {fieldContext.state.meta.errors?.[0]}
          </div>
        )}
    </div>
  );
};

CheckboxGroup.propTypes = {
  options: PropTypes.array,
  className: PropTypes.string,
  label: PropTypes.string,
  fieldLabel: PropTypes.string,
  optionComponent: PropTypes.func,
};

export default CheckboxGroup;
