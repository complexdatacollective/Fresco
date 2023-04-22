import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import uuid from 'uuid';
import MarkdownLabel from './MarkdownLabel';

class ToggleButton extends PureComponent {
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
      color,
      fieldLabel,
      ...rest
    } = this.props;

    const componentClasses = cx(
      'form-field-togglebutton',
      `form-field-togglebutton-${color}`,
      className,
      {
        'form-field-togglebutton--disabled': disabled,
      },
    );

    return (
      <label className={componentClasses} htmlFor={this.id}>
        <div>
          <input
            className="form-field-togglebutton__input"
            id={this.id}
            checked={!!input.value}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...input}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...rest}
            type="checkbox"
          />
          <div className="form-field-togglebutton__checkbox">
            <MarkdownLabel inline label={label} />
          </div>
        </div>
      </label>
    );
  }
}

ToggleButton.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  input: PropTypes.object.isRequired,
  color: PropTypes.string,
  fieldLabel: PropTypes.string,
};

ToggleButton.defaultProps = {
  className: '',
  label: null,
  disabled: false,
  color: 'cat-color-seq-1',
  fieldLabel: null,
};

export default ToggleButton;
