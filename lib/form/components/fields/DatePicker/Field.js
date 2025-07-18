import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { useFieldContext } from '~/lib/form/utils/formContexts';
import Icon from '~/lib/ui/components/Icon';
import MarkdownLabel from '../MarkdownLabel';
import DatePicker from './DatePicker';

const DatePickerField = ({
  label,
  placeholder,
  parameters = {},
  fieldLabel,
  className,
  hidden,
}) => {
  const fieldContext = useFieldContext();
  const ref = useRef();

  const formFieldClasses = cx(className, 'form-field-date-picker', {
    'form-field-date-picker--has-error':
      !fieldContext.state.meta.isValid && fieldContext.state.meta.isTouched,
  });

  const anyLabel = fieldLabel || label;

  return (
    <div className="form-field-container" hidden={hidden} ref={ref}>
      {anyLabel && <MarkdownLabel label={anyLabel} />}
      <div className={formFieldClasses} name={fieldContext.name}>
        <DatePicker
          parameters={parameters}
          value={fieldContext.state.value}
          onChange={fieldContext.handleChange}
          onBlur={fieldContext.handleBlur}
          name={fieldContext.name}
          parentRef={ref}
          placeholder={placeholder}
        />
        {!fieldContext.state.meta.isValid &&
          fieldContext.state.meta.isTouched && (
            <div className="form-field-date-picker__error">
              <div className="form-field-date-picker__error-message">
                <Icon name="warning" />
                {fieldContext.state.meta.errors?.[0]}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

DatePickerField.propTypes = {
  parameters: PropTypes.object,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  fieldLabel: PropTypes.string,
  className: PropTypes.string,
  hidden: PropTypes.bool,
};

export default DatePickerField;
