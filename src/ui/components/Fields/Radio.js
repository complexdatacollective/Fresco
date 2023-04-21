import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import uuid from 'uuid';
import MarkdownLabel from './MarkdownLabel';

class Radio extends PureComponent {
  constructor(props) {
    super(props);

    this.id = uuid();
  }

  render() {
    const {
      label,
      className,
      input,
      disabled,
      fieldLabel,
      ...rest
    } = this.props;

    const componentClasses = cx(
      'form-field-radio',
      className,
      {
        'form-field-radio--disabled': disabled,
      },
    );

    return (
      <label className={componentClasses} htmlFor={this.id}>
        <input
          type="radio"
          className="form-field-radio__input"
          id={this.id}
          // input.checked is only provided by redux form if type="checkbox" or type="radio" is
          // provided to <Field />, so for the case that it isn't we can rely on the more reliable
          // input.value
          checked={!!input.value}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...input}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...rest}
        />
        <div className="form-field-radio__radio" />
        {label && <MarkdownLabel inline label={label} className="form-field-inline-label" />}
      </label>
    );
  }
}

Radio.propTypes = {
  label: PropTypes.node,
  fieldLabel: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  input: PropTypes.object.isRequired,
};

Radio.defaultProps = {
  className: '',
  label: null,
  fieldLabel: null,
  disabled: false,
};

export default Radio;
