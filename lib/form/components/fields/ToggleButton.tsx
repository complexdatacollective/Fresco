'use client';

import cx from 'classnames';
import React, { useId } from 'react';
import { useFieldContext } from '~/lib/form/utils/formContexts';
import MarkdownLabel from './MarkdownLabel';

type ToggleButtonProps = {
  label: string;
  className?: string;
  disabled?: boolean;
  color?: string;
  fieldLabel?: string;
};

const ToggleButton = ({
  label,
  className = '',
  disabled = false,
  color = 'cat-color-seq-1',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fieldLabel, // Included but not used
  ...rest
}: ToggleButtonProps) => {
  const fieldContext = useFieldContext();
  // Use React's useId hook to generate a stable ID
  const id = useId();

  const componentClasses = cx(
    'form-field-togglebutton',
    `form-field-togglebutton-${color}`,
    className,
    {
      'form-field-togglebutton--disabled': disabled,
    },
  );

  return (
    <label className={componentClasses} htmlFor={id}>
      <div>
        <input
          className="form-field-togglebutton__input"
          id={id}
          name={fieldContext.name}
          checked={!!fieldContext.state.value}
          onChange={(e) => fieldContext.handleChange(e.target.checked)}
          onBlur={() => fieldContext.handleBlur()}
          {...rest}
          type="checkbox"
        />
        <div className="form-field-togglebutton__checkbox">
          <MarkdownLabel inline label={label} />
        </div>
      </div>
    </label>
  );
};

export default ToggleButton;
