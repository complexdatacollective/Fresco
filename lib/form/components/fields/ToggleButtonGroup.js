import cx from 'classnames';
import PropTypes from 'prop-types';
import { useCallback, useMemo } from 'react';
import { useFieldContext } from '~/lib/form/utils/formContexts';
import Icon from '~/lib/ui/components/Icon';
import MarkdownLabel from './MarkdownLabel';
import { asOptionObject, getValue } from './utils/options';

const ToggleButtonGroup = ({ options = [], className, label, fieldLabel }) => {
  const fieldContext = useFieldContext();
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

      return (
        <label
          key={index}
          className={cx(
            'form-field-togglebutton',
            `form-field-togglebutton-cat-color-seq-${index}`,
            'form-field-togglebutton-group__option',
          )}
          htmlFor={`${fieldContext.name}-${index}`}
        >
          <div>
            <input
              className="form-field-togglebutton__input"
              id={`${fieldContext.name}-${index}`}
              name={fieldContext.name}
              type="checkbox"
              checked={checked}
              onChange={() => handleClickOption(index)}
              value={index}
            />
            <div className="form-field-togglebutton__checkbox">
              <MarkdownLabel inline label={optionLabel} />
            </div>
          </div>
        </label>
      );
    },
    [handleClickOption, isOptionChecked, fieldContext.name],
  );

  const classNames = cx(
    'form-field-togglebutton-group',
    'form-field-container',
    className,
    {
      'form-field-togglebutton-group--has-error':
        !fieldContext.state.meta.isValid &&
        fieldContext.state.meta.isTouched &&
        fieldContext.state.meta.errors?.[0],
    },
  );

  const anyLabel = fieldLabel || label;

  return (
    <div className={classNames}>
      {anyLabel && <MarkdownLabel label={anyLabel} />}
      <div className="form-field form-field__inline" name={fieldContext.name}>
        {options.map(renderOption)}
      </div>
      {!fieldContext.state.meta.isValid &&
        fieldContext.state.meta.isTouched && (
          <div className="form-field-togglebutton-group__error">
            <Icon name="warning" />
            {fieldContext.state.meta.errors?.[0]}
          </div>
        )}
    </div>
  );
};

ToggleButtonGroup.propTypes = {
  options: PropTypes.array,
  className: PropTypes.string,
  label: PropTypes.string,
  fieldLabel: PropTypes.string,
};

export default ToggleButtonGroup;
