'use client';

import cx from 'classnames';
import { useId } from 'react';
import Icon from '../Icon';
import MarkdownLabel from './MarkdownLabel';

type InputProps = {
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
};

type MetaProps = {
  active?: boolean;
  error?: string;
  invalid?: boolean;
  touched?: boolean;
};

type TextAreaProps = {
  meta: MetaProps;
  label?: string;
  placeholder?: string;
  fieldLabel?: string;
  className?: string;
  autoFocus?: boolean;
  hidden?: boolean;
  input?: InputProps;
};

const TextArea = ({
  meta = { active: false, error: '', invalid: false, touched: false },
  label,
  placeholder,
  fieldLabel,
  className = '',
  autoFocus = false,
  hidden = false,
  input = {},
}: TextAreaProps) => {
  // Use React's useId hook to generate a stable ID
  const generatedId = useId();
  const id = `textarea-${generatedId}`;

  const seamlessClasses = cx(className, 'form-field-text', {
    'form-field-text--has-focus': meta.active,
    'form-field-text--has-error': meta.invalid && meta.touched && meta.error,
  });

  return (
    <label
      htmlFor={id}
      className="form-field-container"
      hidden={hidden}
      data-name={input.name}
    >
      {fieldLabel || label ? <MarkdownLabel label={fieldLabel ?? label} /> : ''}
      <div className={seamlessClasses}>
        <textarea
          id={id}
          className="form-field form-field-text form-field-text--area form-field-text__input"
          placeholder={placeholder}
          autoFocus={autoFocus}
          {...input}
        />
        {meta.invalid && meta.touched && (
          <div className="form-field-text__error">
            <Icon name="warning" />
            {meta.error}
          </div>
        )}
      </div>
    </label>
  );
};

export default TextArea;
