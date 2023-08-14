import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import ToggleButton from './ToggleButton';
import Icon from '../Icon';
import { asOptionObject, getValue } from './utils/options';
import MarkdownLabel from './MarkdownLabel';

class ToggleButtonGroup extends PureComponent {
  get value() {
    const {
      input: { value },
    } = this.props;
    return value;
  }

  handleClickOption = (event) => {
    const { options, input } = this.props;

    const option = getValue(options[event.target.value]);
    const newValue = this.isOptionChecked(option)
      ? this.value.filter((value) => value !== option)
      : [...this.value, option];

    input.onChange(newValue);
  };

  isOptionChecked = (option) => {
    const {
      input: { value = [] },
    } = this.props;
    const included = value.includes(option);
    return included;
  };

  renderOption = (option, index) => {
    const { value: optionValue, label: optionLabel } = asOptionObject(option);

    return (
      <ToggleButton
        className="form-field-togglebutton-group__option"
        key={index}
        input={{
          value: index,
          checked: this.isOptionChecked(optionValue),
          onChange: this.handleClickOption,
        }}
        label={optionLabel}
        color={`cat-color-seq-${index + 1}`}
      />
    );
  };

  render() {
    const {
      options,
      className,
      label,
      fieldLabel,
      input: { name },
      meta: { error, invalid, touched },
    } = this.props;

    const classNames = cx(
      'form-field-togglebutton-group',
      'form-field-container',
      className,
      {
        'form-field-togglebutton-group--has-error': invalid && touched && error,
      },
    );

    const anyLabel = fieldLabel || label;

    return (
      <div className={classNames}>
        {anyLabel && <MarkdownLabel label={anyLabel} />}
        <div className="form-field form-field__inline" name={name}>
          {options.map(this.renderOption)}
        </div>
        {invalid && touched && (
          <div className="form-field-togglebutton-group__error">
            <Icon name="warning" />
            {error}
          </div>
        )}
      </div>
    );
  }
}

ToggleButtonGroup.propTypes = {
  options: PropTypes.array,
  className: PropTypes.string,
  label: PropTypes.string,
  fieldLabel: PropTypes.string,
  input: PropTypes.object.isRequired,
  meta: PropTypes.object,
};

ToggleButtonGroup.defaultProps = {
  className: null,
  label: null,
  fieldLabel: null,
  options: [],
  meta: {},
};

export default ToggleButtonGroup;
