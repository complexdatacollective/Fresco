'use client';

import cx from 'classnames';
import React, { useId } from 'react';
import { useFieldContext } from '~/lib/form/utils/formContexts';
import MarkdownLabel from './MarkdownLabel';

type RadioProps = {
  label?: React.ReactNode;
  fieldLabel?: string;
  className?: string;
  disabled?: boolean;
};

const Radio = ({
  label,
  className = '',
  disabled = false,
  ...rest
}: RadioProps) => {
  const fieldContext = useFieldContext();
  // Use React's useId hook to generate a stable ID
  const id = useId();

  const componentClasses = cx('form-field-radio', className, {
    'form-field-radio--disabled': disabled,
  });

  return (
    <label className={componentClasses} htmlFor={id}>
      <input
        type="radio"
        className="form-field-radio__input"
        id={id}
        name={fieldContext.name}
        checked={!!fieldContext.state.value}
        onChange={(e) => fieldContext.handleChange(e.target.value)}
        onBlur={() => fieldContext.handleBlur()}
        {...rest}
      />
      <div className="form-field-radio__radio" />
      {label && (
        <MarkdownLabel
          inline
          label={label}
          className="form-field-inline-label"
        />
      )}
    </label>
  );
};

export default Radio;
