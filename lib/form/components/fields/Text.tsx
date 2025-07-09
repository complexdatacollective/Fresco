import cx from 'classnames';
import React, {
  type InputHTMLAttributes,
  useCallback,
  useId,
  useState,
} from 'react';
import { useFieldContext } from '~/lib/form/utils/formContexts';
import Icon from '~/lib/ui/components/Icon';
import MarkdownLabel from './MarkdownLabel';

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  placeholder?: string;
  fieldLabel?: string;
  className?: string;
  adornmentLeft?: React.ReactNode;
  adornmentRight?: React.ReactNode;
};

const TextInput = ({
  label,
  placeholder = 'Enter some text...',
  fieldLabel,
  className = '',
  type = 'text',
  autoFocus = false,
  hidden = false,
  adornmentLeft,
  adornmentRight,
}: TextInputProps) => {
  const fieldContext = useFieldContext();
  const id = useId();
  const [hasFocus, setFocus] = useState(false);

  const handleFocus = useCallback(() => {
    setFocus(true);
    // fieldContext doesn't have onFocus, so we don't need to call it
  }, []);

  const handleBlur = useCallback(() => {
    setFocus(false);
    fieldContext.handleBlur();
  }, [fieldContext]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      fieldContext.handleChange(e.target.value);
    },
    [fieldContext],
  );

  const hasLeftAdornment = !!adornmentLeft;
  const hasRightAdornment = !!adornmentRight;
  const hasAdornment = hasLeftAdornment || hasRightAdornment;

  const seamlessClasses = cx(className, 'form-field-text', {
    'form-field-text--has-focus': hasFocus,
    'form-field-text--has-error':
      !fieldContext.state.meta.isValid &&
      fieldContext.state.meta.isTouched &&
      (fieldContext.state.meta.errors?.[0] as string),
    'form-field-text--adornment': hasAdornment,
    'form-field-text--has-left-adornment': hasLeftAdornment,
    'form-field-text--has-right-adornment': hasRightAdornment,
  });

  const anyLabel = fieldLabel ?? label;

  return (
    <div className="form-field-container" hidden={hidden}>
      {anyLabel && <MarkdownLabel label={anyLabel} />}
      <div className={seamlessClasses}>
        <input
          id={id}
          name={fieldContext.name}
          value={(fieldContext.state.value as string) || ''}
          className="form-field form-field-text__input"
          placeholder={placeholder}
          autoFocus={autoFocus}
          type={type}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onChange={handleChange}
        />
        {adornmentLeft && (
          <div className="form-field-text__adornment-left">{adornmentLeft}</div>
        )}
        {adornmentRight && (
          <div className="form-field-text__adornment-right">
            {adornmentRight}
          </div>
        )}
        {!fieldContext.state.meta.isValid &&
          fieldContext.state.meta.isTouched && (
            <div className="form-field-text__error">
              <Icon name="warning" />
              {fieldContext.state.meta.errors?.[0]}
            </div>
          )}
      </div>
    </div>
  );
};

export default TextInput;
