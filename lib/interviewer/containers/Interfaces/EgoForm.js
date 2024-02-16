import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import Icon from '~/lib/ui/components/Icon';
import Scroller from '~/lib/ui/components/Scroller';
import Markdown from '~/lib/ui/components/Fields/Markdown';
import { submit, isValid, isDirty } from 'redux-form';
import Form from '../Form';
import { actionCreators as sessionActions } from '../../ducks/modules/session';
import { actionCreators as dialogActions } from '../../ducks/modules/dialogs';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';
import useFlipflop from '../../hooks/useFlipflop';
import { getEgoAttributes } from '../../selectors/network';
import { debounce } from 'lodash';

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

const EgoForm = (props) => {
  const { registerBeforeNext, stage } = props;

  const { form, introductionPanel } = stage;

  const dispatch = useDispatch();
  const openDialog = useCallback(
    (dialog) => dispatch(dialogActions.openDialog(dialog)),
    [dispatch],
  );
  const submitFormRedux = useCallback(
    (formName) => dispatch(submit(formName)),
    [dispatch],
  );
  const updateEgo = useCallback(
    (modelData, attributeData) =>
      dispatch(sessionActions.updateEgo(modelData, attributeData)),
    [dispatch],
  );

  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollStatus, setShowScrollStatus] = useFlipflop(
    true,
    7000,
    false,
  );
  const [isOverflowing, setIsOverflowing] = useState(false);
  const { updateReady: setIsReadyForNext } = useReadyForNextStage();
  const egoAttributes = useSelector(getEgoAttributes);

  const formName = getFormName(props.stage.id);
  const isFormValid = useSelector((state) => isValid(formName)(state));
  const isFormDirty = useSelector((state) => isDirty(formName)(state));

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
    return openDialog(confirmDialog);
  }, [openDialog]);

  const beforeNext = useCallback(
    async (direction) => {
      // If direction is backwards, and the form is invalid, check if the user
      // wants to proceed anyway (causing the form to be reset)
      if (direction === 'backwards') {
        if (isFormDirty && !isFormValid) {
          return checkShouldProceed();
        }

        // if form is valid submit the form and proceed backwards
        if (isFormValid) {
          submitFormRedux(formName); // Submit the form
        }

        return true;
      }

      submitFormRedux(formName); // Submit the form

      // If the form is valid, proceed to the next stage
      if (isFormValid) {
        return true;
      }

      // If the form is invalid, block navigation.
      return false;
    },
    [formName, submitFormRedux, checkShouldProceed, isFormDirty, isFormValid],
  );

  useEffect(() => {
    registerBeforeNext(beforeNext);
  }, [beforeNext, registerBeforeNext]);

  const handleSubmitForm = (formData) => {
    updateEgo({}, formData);
  };

  const handleScroll = useCallback(
    (_, progress) => {
      setShowScrollStatus(false);
      setScrollProgress(progress);

      debounce((progress) => {
        const nextIsReady = isFormValid && progress === 1;
        setIsReadyForNext(nextIsReady);
      }, 200);
    },
    [setIsReadyForNext, setScrollProgress, isFormValid, setShowScrollStatus],
  );

  useEffect(() => {
    setIsReadyForNext(false);

    if (isFormDirty && !isFormValid) {
      return;
    }
  }, [isFormDirty, isFormValid, setIsReadyForNext]);

  useEffect(() => {
    if (!isFormValid) {
      setIsReadyForNext(false);
    }
  }, [isFormValid, setIsReadyForNext]);

  const showScrollNudge = useMemo(
    () => scrollProgress !== 1 && showScrollStatus && isOverflowing,
    [scrollProgress, showScrollStatus, isOverflowing],
  );

  return (
    <div className="ego-form alter-form">
      <div className="ego-form__form-container">
        <Scroller
          className="ego-form__form-container-scroller"
          onScroll={handleScroll}
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
                ease: 'easeInOut',
                repeat: Infinity,
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
  stage: PropTypes.shape({
    id: PropTypes.string.isRequired,
    form: PropTypes.object.isRequired,
    introductionPanel: PropTypes.shape({
      title: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default EgoForm;
