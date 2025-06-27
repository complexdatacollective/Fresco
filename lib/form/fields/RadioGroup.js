import cx from 'classnames';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { v4 as uuid } from 'uuid';
import Icon from '~/lib/ui/components/Icon';
import MarkdownLabel from './MarkdownLabel';
import Radio from './Radio';
import { asOptionObject, getValue } from './utils/options';

class RadioGroup extends Component {
  static defaultProps = {
    optionComponent: Radio,
    options: [],
    meta: {},
  };

  constructor(props) {
    super(props);

    this.id = uuid();
  }

  onChange = (index) => {
    const {
      input: { onChange },
      options,
    } = this.props;

    return onChange(getValue(options[index]));
  };

  renderOption = (option, index) => {
    const {
      input: { value },
      optionComponent: OptionComponent,
    } = this.props;

    const {
      value: optionValue,
      label: optionLabel,
      ...optionRest
    } = asOptionObject(option);
    const selected = optionValue === value;

    return (
      <OptionComponent
        key={index}
        input={{
          name: this.props.input.name,
          value: index,
          checked: selected,
          onChange: () => this.onChange(index),
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
      input: { name },
      className,
      label,
      fieldLabel,
      meta: { error, invalid, touched },
    } = this.props;

    const containerClassNames = cx('form-field-container', {
      'form-field-radio-group--has-error': invalid && touched && error,
    });

    const classNames = cx('form-field', 'form-field-radio-group', className);

    const anyLabel = fieldLabel || label;

    return (
      <div className={containerClassNames}>
        {anyLabel && <MarkdownLabel label={anyLabel} />}
        <div className={classNames} name={name}>
          {options.map(this.renderOption)}
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

export default RadioGroup;
