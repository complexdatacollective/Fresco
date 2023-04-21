import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Icon from '../../Icon';
import Slider from './Slider';
import MarkdownLabel from '../MarkdownLabel';

const getSliderType = (variableType) => {
  switch (variableType) {
    case 'ordinal':
      return 'LIKERT';
    case 'scalar':
      return 'VAS';
    default:
      return null;
  }
};

const hasValue = (value) => value !== '';

/**
 * Empty string value should be treated as `null`
 * because redux-forms turns `null` values (e.g.
 * unset values) into empty strings when
 * building the input object...
 */
const getValue = (value) => {
  if (!hasValue(value)) { return null; }
  return value;
};

const SliderField = (props) => {
  const {
    input,
    meta: { error, invalid, touched },
    label,
    parameters,
    options,
    fieldLabel,
    className,
    hidden,
    type,
  } = props;

  const formFieldClasses = cx(
    className,
    'form-field-slider',
    { 'form-field-slider--has-error': invalid && touched },
  );

  const anyLabel = fieldLabel || label;
  const sliderType = getSliderType(type);

  return (
    <div className="form-field-container" hidden={hidden}>
      { anyLabel
        && <MarkdownLabel label={anyLabel} />}
      <div className={formFieldClasses} name={input.name}>
        <Slider
          options={options}
          parameters={parameters}
          type={sliderType}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...input}
          value={getValue(input.value)}
        />
        {invalid && touched && (
          <div className="form-field-slider__error">
            <Icon name="warning" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

SliderField.propTypes = {
  label: PropTypes.node,
  className: PropTypes.string,
  hidden: PropTypes.bool,
  input: PropTypes.object.isRequired,
  meta: PropTypes.object,
  parameters: PropTypes.object,
  options: PropTypes.array,
  fieldLabel: PropTypes.string,
  type: PropTypes.string.isRequired,
};

SliderField.defaultProps = {
  className: '',
  label: null,
  hidden: false,
  meta: {},
  fieldLabel: null,
  options: null,
  parameters: null,
};

export default SliderField;
