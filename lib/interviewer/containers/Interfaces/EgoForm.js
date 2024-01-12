import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import { connect, useSelector } from 'react-redux';
import Icon from '~/lib/ui/components/Icon';
import Scroller from '~/lib/ui/components/Scroller';
import Markdown from '~/lib/ui/components/Fields/Markdown';
import { submit, isValid, isDirty } from 'redux-form';
import { entityAttributesProperty } from '@codaco/shared-consts';
import Form from '../Form';
import { actionCreators as sessionActions } from '../../ducks/modules/session';
import { actionCreators as dialogActions } from '../../ducks/modules/dialogs';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';
import useFlipflop from '../../hooks/useFlipflop';
import { getEgoAttributes } from '../../selectors/network';

export const elementHasOverflow = ({
  clientWidth,
  clientHeight,
  scrollWidth,
  scrollHeight,
}) => scrollHeight > clientHeight || scrollWidth > clientWidth;

const confirmDialog = {
  type: 'Confirm',
  title: 'Discard changes?',
  message:
    'This form contains invalid data, so it cannot be saved. If you continue it will be reset and your changes will be lost. Do you want to discard your changes?',
  confirmLabel: 'Discard changes',
};

const getFormName = (index) => `EGO_FORM_${index}`;

const EgoForm = ({
  ego = {},
  form,
  formName,
  introductionPanel,
  isFormDirty,
  isFormValid,
  openDialog,
  registerBeforeNext,
  submitForm: reduxFormSubmit,
  updateEgo,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollStatus, setShowScrollStatus] = useFlipflop(
    true,
    7000,
    false,
  );
  const [isOverflowing, setIsOverflowing] = useState(false);
  const { updateReady: setIsReadyForNext } = useReadyForNextStage();
  const egoAttributes = useSelector(getEgoAttributes);

  console.log('ego form', egoAttributes);

  const formState = useRef({
    isFormDirty,
    isFormValid,
  });

  useEffect(() => {
    formState.current = {
      isFormDirty,
      isFormValid,
    };
  }, [isFormDirty, isFormValid]);

  // Detect if the scrollable element has overflowing content
  useEffect(() => {
    const element = document.querySelector(
      '.ego-form__form-container-scroller',
    );
    if (!element) {
      return;
    }

    setIsOverflowing(elementHasOverflow(element));
  }, []);

  const checkShouldProceed = useCallback(() => {
    if (!formState.current.isFormDirty) {
      return Promise.resolve(true);
    }
    return openDialog(confirmDialog);
  }, [openDialog]);

  const onConfirmProceed = (confirm) => {
    if (confirm) {
      return true;
    }

    return false;
  };

  // Prompt the user that if they continue, their changes will be lost
  const checkAndProceed = useCallback(() => checkShouldProceed()
    .then(onConfirmProceed), [checkShouldProceed]);

  const beforeNext = useCallback(
    async (direction) => {
      console.log('ego form before next', direction);
      // If direction is backwards, and the form is invalid, check if the user
      // wants to proceed anyway (causing the form to be reset)
      if (direction === 'backwards') {
        console.log('direction is backwards', formState.current);
        if (formState.current.isFormDirty && !formState.current.isFormValid) {
          console.log('form is not valid');
          return checkAndProceed();
        } else {
          return true;
        }
      }

      reduxFormSubmit(formName); // Submit the form

      // If the form is valid, proceed to the next stage
      if (formState.current.isFormValid) {
        return true;
      }

      // If the form is invalid, block navigation.
      return false;
    },
    [checkAndProceed, formName, reduxFormSubmit, formState],
  );

  useEffect(() => {
    console.log('ego form registering before next');
    registerBeforeNext(beforeNext);
  }, [beforeNext, registerBeforeNext]);

  const handleSubmitForm = (formData) => {
    console.log('handle submit');
    updateEgo({}, formData);
  };

  useEffect(() => {
    if (!formState.current.isFormValid) {
      setIsReadyForNext(false);

      return;
    }

    setIsReadyForNext(true);
  }, [formState, setIsReadyForNext]);

  // Todo: fix show scroll nudge.
  const showScrollNudge = useMemo(
    () => scrollProgress !== 1 && showScrollStatus && isOverflowing,
    [scrollProgress, showScrollStatus, isOverflowing],
  );

  return (
    <div className="ego-form alter-form">
      <div className="ego-form__form-container">
        <Scroller
          className="ego-form__form-container-scroller"
        >
          <div className="ego-form__introduction">
            <h1>{introductionPanel.title}</h1>
            <Markdown label={introductionPanel.text} />
          </div>
          <Form
            {...form}
            initialValues={egoAttributes}
            form={formName}
            subject={{ entity: 'ego' }}
            onSubmit={handleSubmitForm}
            onChange={() => {
              // Reset the scroll nudge timeout each time a form field is changed
              setShowScrollStatus(false);
            }}
          />
        </Scroller>
      </div>
      <AnimatePresence>
        {showScrollNudge && (
          <motion.div
            className="scroll-nudge"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
          >
            <h5>Scroll to see more questions</h5>
            <motion.div
              animate={{
                y: [0, 7, 0, 7, 0],
              }}
              transition={{
                duration: 2,
                loop: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Icon name="chevron-down" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

EgoForm.propTypes = {
  form: PropTypes.object.isRequired,
  introductionPanel: PropTypes.object.isRequired,
  ego: PropTypes.object,
  stage: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
  submitForm: PropTypes.func.isRequired,
  updateEgo: PropTypes.func.isRequired,
};

function mapStateToProps(state, props) {
  const formName = getFormName(props.stage.id);
  const isFormValid = isValid(formName)(state);
  const isFormDirty = isDirty(formName)(state);

  return {
    form: props.stage.form,
    introductionPanel: props.stage.introductionPanel,
    isFormValid,
    isFormDirty,
    formName,
  };
}

const mapDispatchToProps = {
  updateEgo: sessionActions.updateEgo,
  submitForm: submit,
  openDialog: dialogActions.openDialog,
};

const withStore = connect(mapStateToProps, mapDispatchToProps);

export { EgoForm };

export default withStore(EgoForm);
