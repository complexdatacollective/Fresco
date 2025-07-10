'use client';

import cx from 'classnames';
import { useEffect, useId } from 'react';
import { useFieldContext } from '~/lib/form/utils/formContexts';
import Icon from '~/lib/ui/components/Icon';
import MarkdownLabel from './MarkdownLabel';

type ToggleProps = {
  label?: string;
  fieldLabel?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
};

const Toggle = ({
  label,
  fieldLabel,
  className = '',
  disabled = false,
  title,
  ...rest
}: ToggleProps) => {
  const fieldContext = useFieldContext();
  // Use React's useId hook to generate a stable ID
  const id = useId();

  // Handle the initial value setup
  useEffect(() => {
    // Because redux forms will just not pass on this
    // field if it was never touched and we need it to
    // return `false`.
    if (typeof fieldContext.state.value !== 'boolean') {
      fieldContext.handleChange(false);
    }
  }, [fieldContext]);

  const hasError =
    !fieldContext.state.meta.isValid &&
    fieldContext.state.meta.isTouched &&
    fieldContext.state.meta.errors?.[0] !== undefined;

  const containerClassNames = cx('form-field-container', {
    'form-field-toggle--has-error': hasError,
  });

  const componentClasses = cx('form-field', 'form-field-toggle', className, {
    'form-field-toggle--disabled': disabled,
    'form-field-toggle--has-error': hasError,
  });

  return (
    <div className={containerClassNames} data-name={fieldContext.name}>
      {fieldLabel && <MarkdownLabel label={fieldLabel} />}
      <label className={componentClasses} htmlFor={id} title={title}>
        <input
          className="form-field-toggle__input"
          id={id}
          {...rest}
          name={fieldContext.name}
          value={fieldContext.state.value as string}
          checked={!!fieldContext.state.value}
          onChange={(e) => fieldContext.handleChange(e.target.checked)}
          onBlur={() => fieldContext.handleBlur()}
          disabled={disabled}
          type="checkbox"
        />
        <div className="form-field-toggle__toggle">
          <span className="form-field-toggle__button" />
        </div>
        {label && (
          <MarkdownLabel
            inline
            label={label}
            className="form-field-inline-label"
          />
        )}
      </label>
      {!fieldContext.state.meta.isValid &&
        fieldContext.state.meta.isTouched && (
          <div className="form-field-toggle__error">
            <Icon name="warning" />
            {fieldContext.state.meta.errors?.[0]}
          </div>
        )}
    </div>
  );
};

export default Toggle;
