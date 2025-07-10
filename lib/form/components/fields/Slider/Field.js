import cx from 'classnames';
import PropTypes from 'prop-types';
import { useFieldContext } from '~/lib/form/utils/formContexts';
import Icon from '~/lib/ui/components/Icon';
import MarkdownLabel from '../MarkdownLabel';
import Slider from './Slider';

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
  if (!hasValue(value)) {
    return null;
  }
  return value;
};

const SliderField = ({
  label,
  parameters,
  options,
  fieldLabel,
  className = '',
  hidden,
  type,
}) => {
  const fieldContext = useFieldContext();

  const formFieldClasses = cx(className, 'form-field-slider', {
    'form-field-slider--has-error': !fieldContext.state.meta.isValid && fieldContext.state.meta.isTouched,
  });

  const anyLabel = fieldLabel || label;
  const sliderType = getSliderType(type);

  return (
    <div className="form-field-container" hidden={hidden}>
      {anyLabel && <MarkdownLabel label={anyLabel} />}
      <div className={formFieldClasses} name={fieldContext.name}>
        <Slider
          options={options}
          parameters={parameters}
          type={sliderType}
          name={fieldContext.name}
          value={getValue(fieldContext.state.value)}
          onChange={fieldContext.handleChange}
          onBlur={fieldContext.handleBlur}
        />
        {!fieldContext.state.meta.isValid && fieldContext.state.meta.isTouched && (
          <div className="form-field-slider__error">
            <Icon name="warning" />
            {fieldContext.state.meta.errors?.[0]}
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
  parameters: PropTypes.object,
  options: PropTypes.array,
  fieldLabel: PropTypes.string,
  type: PropTypes.string.isRequired,
};

export default SliderField;
