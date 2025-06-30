import cx from 'classnames';
import PropTypes from 'prop-types';
import { useCallback, useId, useMemo } from 'react';
import { useFieldContext } from '~/lib/form/utils/formContexts';
import Icon from '~/lib/ui/components/Icon';
import MarkdownLabel from './MarkdownLabel';
import { asOptionObject, getValue } from './utils/options';

const RadioGroup = ({ options = [], className, label, fieldLabel }) => {
  const fieldContext = useFieldContext();
  const id = useId();
  const currentValue = useMemo(
    () => fieldContext.state.value,
    [fieldContext.state.value],
  );

  const handleChange = useCallback(
    (index) => {
      const optionValue = getValue(options[index]);
      fieldContext.handleChange(optionValue);
    },
    [options, fieldContext],
  );

  const renderOption = useCallback(
    (option, index) => {
      const { value: optionValue, label: optionLabel } = asOptionObject(option);
      const selected = optionValue === currentValue;

      // Create a simple radio button since Radio component now uses its own field context
      return (
        <label
          key={index}
          className="form-field-radio"
          htmlFor={`${id}-${index}`}
        >
          <input
            type="radio"
            className="form-field-radio__input"
            id={`${id}-${index}`}
            name={fieldContext.name}
            value={index}
            checked={selected}
            onChange={() => handleChange(index)}
          />
          <div className="form-field-radio__radio" />
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
    [currentValue, fieldContext.name, handleChange, id],
  );

  const containerClassNames = cx('form-field-container', {
    'form-field-radio-group--has-error':
      !fieldContext.state.meta.isValid &&
      fieldContext.state.meta.isTouched &&
      fieldContext.state.meta.errors?.[0],
  });

  const classNames = cx('form-field', 'form-field-radio-group', className);

  const anyLabel = fieldLabel || label;

  return (
    <div className={containerClassNames}>
      {anyLabel && <MarkdownLabel label={anyLabel} />}
      <div className={classNames} name={fieldContext.name}>
        {options.map(renderOption)}
      </div>
      {!fieldContext.state.meta.isValid &&
        fieldContext.state.meta.isTouched && (
          <div className="form-field-radio-group__error">
            <Icon name="warning" />
            {fieldContext.state.meta.errors?.[0]}
          </div>
        )}
    </div>
  );
};

RadioGroup.propTypes = {
  options: PropTypes.array,
  label: PropTypes.string,
  className: PropTypes.string,
  fieldLabel: PropTypes.string,
  optionComponent: PropTypes.func,
};

export default RadioGroup;
