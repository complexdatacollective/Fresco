import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Icon from '../../Icon';
import DatePicker from './DatePicker';
import MarkdownLabel from '../MarkdownLabel';

class DatePickerField extends Component {
  constructor(props) {
    super(props);

    this.ref = React.createRef();
  }

  render() {
    const {
      input,
      meta: { error, invalid, touched },
      label,
      placeholder,
      parameters,
      fieldLabel,
      className,
      hidden,
    } = this.props;

    const formFieldClasses = cx(
      className,
      'form-field-date-picker',
      { 'form-field-date-picker--has-error': invalid && touched },
    );

    const anyLabel = fieldLabel || label;
    return (
      <div className="form-field-container" hidden={hidden} ref={this.ref}>
        {anyLabel
          && <MarkdownLabel label={anyLabel} />}
        <div className={formFieldClasses} name={input.name}>
          <DatePicker
            parameters={parameters}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...input}
            onChange={input.onBlur}
            parentRef={this.ref}
            placeholder={placeholder}
          />
          {invalid && touched
            && (
              <div className="form-field-date-picker__error">
                <div className="form-field-date-picker__error-message">
                  <Icon name="warning" />
                  {error}
                </div>
              </div>
            )}
        </div>

      </div>

    );
  }
}

DatePickerField.propTypes = {
  parameters: PropTypes.object,
  input: PropTypes.object.isRequired,
  meta: PropTypes.object,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  fieldLabel: PropTypes.string,
  className: PropTypes.string,
  hidden: PropTypes.bool,
};

DatePickerField.defaultProps = {
  parameters: {},
  meta: {},
  label: null,
  placeholder: null,
  fieldLabel: null,
  className: null,
  hidden: null,
};

export default DatePickerField;
