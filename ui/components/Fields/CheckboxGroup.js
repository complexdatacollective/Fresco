import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Checkbox from './Checkbox';
import { asOptionObject, getValue } from './utils/options';
import Icon from '../Icon';
import MarkdownLabel from './MarkdownLabel';

class CheckboxGroup extends PureComponent {
  get value() {
    const { input: { value } } = this.props;
    return value;
  }

  handleClickOption = (index) => {
    const { input: { onChange }, options } = this.props;
    const option = getValue(options[index]);
    const newValue = this.isOptionChecked(option)
      ? this.value.filter((value) => value !== option)
      : [...this.value, option];

    onChange(newValue);
  }

  isOptionChecked = (option) => {
    const { input: { value = [] } } = this.props;
    const included = value.includes(option);
    return included;
  }

  renderOption = (option, index) => {
    const { optionComponent } = this.props;
    const OptionComponent = optionComponent;
    const { value: optionValue, label: optionLabel, ...optionRest } = asOptionObject(option);

    return (
      <OptionComponent
        className="form-field-checkbox-group__option"
        key={index}
        input={{
          value: index,
          checked: this.isOptionChecked(optionValue),
          onChange: () => this.handleClickOption(index),
        }}
        label={optionLabel}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...optionRest}
      />
    );
  };

  render() {
    const {
      options,
      className,
      fieldLabel,
      label,
      input: { name },
      meta: { error, invalid, touched },
    } = this.props;

    const classNames = cx(
      'form-field-checkbox-group',
      'form-field-container',
      {
        'form-field-checkbox-group--has-error': invalid && touched && error,
      },
      className,
    );

    const anyLabel = fieldLabel || label;

    return (
      <div className={classNames}>
        { anyLabel
          && <MarkdownLabel label={anyLabel} />}
        <div className="form-field" name={name}>
          { options.map(this.renderOption) }
        </div>
        {invalid && touched && (
        <div className="form-field-checkbox-group__error">
          <Icon name="warning" />
          {error}
        </div>
        )}
      </div>
    );
  }
}

CheckboxGroup.propTypes = {
  options: PropTypes.array,
  className: PropTypes.string,
  label: PropTypes.string,
  fieldLabel: PropTypes.string,
  input: PropTypes.object.isRequired,
  optionComponent: PropTypes.func,
  meta: PropTypes.object,
};

CheckboxGroup.defaultProps = {
  className: null,
  label: null,
  fieldLabel: null,
  options: [],
  optionComponent: Checkbox,
  meta: {},
};

export default CheckboxGroup;
