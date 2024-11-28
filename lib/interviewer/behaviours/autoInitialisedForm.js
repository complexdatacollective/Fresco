import { fromPairs } from 'es-toolkit/compat';
import PropTypes from 'prop-types';

// TODO: Seems like this knowledge should be part of the field component?
const typeInitalValue = (field) => {
  switch (field.type) {
    case 'CheckboxGroup':
    case 'ToggleGroup':
      return fromPairs(field.options.map((option) => [option, false]));
    default:
      return '';
  }
};

const initialValues = (fields) =>
  fromPairs(fields.map((field) => [field.name, typeInitalValue(field)]));

/**
 * Renders a redux form that contains fields according to a `fields` config.
 */
const autoInitialisedForm = (WrappedComponent) => {
  const AutoInitialisedForm = (props) => {
    const { fields } = props;
    return (
      <WrappedComponent initialValues={initialValues(fields)} {...props} />
    );
  };

  AutoInitialisedForm.propTypes = {
    fields: PropTypes.array.isRequired,
  };

  return AutoInitialisedForm;
};

export default autoInitialisedForm;
