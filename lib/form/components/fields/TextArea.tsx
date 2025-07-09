'use client';

import cx from 'classnames';
import { useId, useState } from 'react';
import { useFieldContext } from '~/lib/form/utils/formContexts';
import Icon from '~/lib/ui/components/Icon';
import MarkdownLabel from './MarkdownLabel';

type TextAreaProps = {
  label?: string;
  placeholder?: string;
  fieldLabel?: string;
  className?: string;
  autoFocus?: boolean;
  hidden?: boolean;
};

const TextArea = ({
  label,
  placeholder,
  fieldLabel,
  className = '',
  autoFocus = false,
  hidden = false,
}: TextAreaProps) => {
  const fieldContext = useFieldContext();
  const [hasFocus, setHasFocus] = useState(false);
  // Use React's useId hook to generate a stable ID
  const generatedId = useId();
  const id = `textarea-${generatedId}`;

  const handleFocus = () => {
    setHasFocus(true);
  };

  const handleBlur = () => {
    setHasFocus(false);
    fieldContext.handleBlur();
  };

  const seamlessClasses = cx(className, 'form-field-text', {
    'form-field-text--has-focus': hasFocus,
    'form-field-text--has-error':
      !fieldContext.state.meta.isValid &&
      fieldContext.state.meta.isTouched &&
      (fieldContext.state.meta.errors?.[0] as string),
  });

  return (
    <label
      htmlFor={id}
      className="form-field-container"
      hidden={hidden}
      data-name={fieldContext.name}
    >
      {fieldLabel || label ? <MarkdownLabel label={fieldLabel ?? label} /> : ''}
      <div className={seamlessClasses}>
        <textarea
          id={id}
          name={fieldContext.name}
          value={(fieldContext.state.value as string) || ''}
          className="form-field form-field-text form-field-text--area form-field-text__input"
          placeholder={placeholder}
          autoFocus={autoFocus}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onChange={(e) => fieldContext.handleChange(e.target.value)}
        />
        {!fieldContext.state.meta.isValid &&
          fieldContext.state.meta.isTouched && (
            <div className="form-field-text__error">
              <Icon name="warning" />
              {fieldContext.state.meta.errors?.[0]}
            </div>
          )}
      </div>
    </label>
  );
};

export default TextArea;
