import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import uuid from 'uuid';
import Radio from './Radio';
import { asOptionObject, getValue } from './utils/options';
import Icon from '../Icon';
import MarkdownLabel from './MarkdownLabel';

class RadioGroup extends Component {
  constructor(props) {
    super(props);

    this.id = uuid();
  }

  onChange = (index) => {
    const {
      input: {
        onChange,
      },
      options,
    } = this.props;

    return onChange(getValue(options[index]));
  };

  renderOption = (option, index) => {
    const {
      input: { value },
      optionComponent: OptionComponent,
    } = this.props;

    const { value: optionValue, label: optionLabel, ...optionRest } = asOptionObject(option);
    const selected = optionValue === value;

    return (
      <OptionComponent
        key={index}
        input={{
          value: index,
          checked: selected,
          onChange: () => this.onChange(index),
        }}
        label={optionLabel}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...optionRest}
      />
    );
  }

  render() {
    const {
      options,
      input: { name },
      className,
      label,
      fieldLabel,
      meta: { error, invalid, touched },
    } = this.props;

    const containerClassNames = cx(
      'form-field-container',
      {
        'form-field-radio-group--has-error': invalid && touched && error,
      },
    );

    const classNames = cx(
      'form-field',
      'form-field-radio-group',
      className,
    );

    const anyLabel = fieldLabel || label;

    return (
      <div className={containerClassNames}>
        { anyLabel
          && <MarkdownLabel label={anyLabel} />}
        <div className={classNames} name={name}>
          { options.map(this.renderOption) }
        </div>
        {invalid && touched && (
        <div className="form-field-radio-group__error">
          <Icon name="warning" />
          {error}
        </div>
        )}
      </div>
    );
  }
}

RadioGroup.propTypes = {
  options: PropTypes.array,
  label: PropTypes.string,
  input: PropTypes.object.isRequired,
  className: PropTypes.string,
  fieldLabel: PropTypes.string,
  meta: PropTypes.object,
  optionComponent: PropTypes.func,
};

RadioGroup.defaultProps = {
  label: null,
  fieldLabel: null,
  className: null,
  optionComponent: Radio,
  options: [],
  meta: {},
};

export { RadioGroup };

export default RadioGroup;
