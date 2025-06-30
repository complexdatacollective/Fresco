import { compose } from '@reduxjs/toolkit';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { getFormMeta, getFormValues, initialize, reduxForm } from 'redux-form';
import { scrollParent } from '~/lib/interviewer/utils/scrollParent';
import autoInitialisedForm from '../behaviours/autoInitialisedForm';
import { makeEnrichFieldsWithCodebookMetadata } from '../selectors/forms';
import Field from './Field';

const scrollToFirstError = (errors) => {
  // Todo: first item is an assumption that may not be valid. Should iterate and check
  // vertical position to ensure it is actually the "first" in page order (topmost).
  if (!errors) {
    return;
  }

  const firstError = Object.keys(errors)[0];

  // All Fields have a name corresponding to variable ID so look this up.
  // When used on alter form, multiple forms can be differentiated by the active slide
  // class. This needs priority, so look it up first.
  const el =
    document.querySelector(`.swiper-slide-active [name="${firstError}"]`) ||
    document.querySelector(`[name="${firstError}"]`);

  // If element is not found, prevent crash.
  if (!el) {
    // eslint-disable-next-line no-console
    console.warn(
      `scrollToFirstError(): Element [name="${firstError}"] not found in DOM`,
    );
    return;
  }

  // Subtract 200 to put more of the input in view.
  const topPos = el.offsetTop - 200;

  // Assume forms are inside a scrollable
  const scroller = scrollParent(el);

  scroller.scrollTop = topPos;
};

/**
 * Renders a redux form that contains fields according to a `fields` config.
 */
class Form extends Component {
  componentDidMount() {
    const { form, initialValues, fields, dispatch } = this.props;

    // Call initialize action creator when the component mounts
    dispatch(initialize(form, initialValues, fields));
  }

  handleFieldBlur = () => {
    const { autoPopulate } = this.props;
    if (!autoPopulate) {
      return;
    }

    const {
      meta: { fields, values },
      dirty,
      autofill,
    } = this.props;

    // if we don't check dirty state, this ends up firing and auto populating fields
    // when it shouldn't, like when closing the form
    if (dirty) {
      autoPopulate(fields, values, autofill);
    }
  };

  render() {
    const {
      autoFocus = false,
      fields,
      handleSubmit,
      className,
      submitButton = (
        <button type="submit" key="submit" aria-label="Submit" hidden />
      ),
      children,
    } = this.props;

    return (
      <form className={className} onSubmit={handleSubmit} autoComplete="off">
        {fields.map((field, index) => {
          const isFirst = autoFocus && index === 0;
          return (
            <Field
              key={`${field.name} ${index}`}
              {...field}
              autoFocus={isFirst}
              onBlur={() => {
                this.handleFieldBlur();
              }}
            />
          );
        })}
        {submitButton}
        {children}
      </form>
    );
  }
}

Form.propTypes = {
  autofill: PropTypes.func.isRequired,
  autoFocus: PropTypes.bool,
  autoPopulate: PropTypes.func,
  dirty: PropTypes.bool.isRequired,
  form: PropTypes.string.isRequired,
  fields: PropTypes.array.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  meta: PropTypes.object.isRequired,
  className: PropTypes.string,
  submitButton: PropTypes.object,
  initialValues: PropTypes.object,
  validationMeta: PropTypes.object,
  otherNetworkEntities: PropTypes.object,
  subject: PropTypes.object.isRequired, // Implicit dependency used by autoInitialisedForm
};

function makeMapStateToProps() {
  const enrichFieldsWithCodebookMetadata =
    makeEnrichFieldsWithCodebookMetadata();

  return function mapStateToProps(state, props) {
    return {
      meta: {
        fields: getFormMeta(props.form)(state),
        values: getFormValues(props.form)(state),
      },
      fields: enrichFieldsWithCodebookMetadata(state, props),
      initialValues: props.initialValues,
    };
  };
}

export default compose(
  connect(makeMapStateToProps),
  autoInitialisedForm,
  reduxForm({
    enableReinitialize: true, // form could have ego out of sync because submit is in progress
    touchOnChange: false,
    touchOnBlur: true,
    onSubmitFail: scrollToFirstError,
  }),
)(Form);
