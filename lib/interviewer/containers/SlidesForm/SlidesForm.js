import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import cx from 'classnames';
import { v4 as uuid } from 'uuid';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { connect, useDispatch } from 'react-redux';
import ProgressBar from '~/lib/ui/components/ProgressBar';
import { Markdown } from '~/lib/ui/components/Fields';
import { submit, isValid, isDirty } from 'redux-form';
import { actionCreators as dialogActions } from '../../ducks/modules/dialogs';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';

const confirmDialog = {
  type: 'Confirm',
  title: 'Discard changes?',
  message:
    'This form contains invalid data, so it cannot be saved. If you continue it will be reset, and your changes will be lost. Do you want to discard your changes?',
  confirmLabel: 'Discard changes',
};

const slideVariants = {
  show: {
    y: 0,
  },
  hideTop: {
    y: '-100%',
  },
  hideBottom: {
    y: '100%',
  },
};

const SlidesForm = (props) => {
  const {
    form,
    stage,
    items = [],
    slideForm: SlideForm,
    parentClass = '',
    registerBeforeNext,
    onComplete,
    getFormName,
    isFormValid,
    isFormDirty,
    updateItem,
  } = props;

  const dispatch = useDispatch();
  const openDialog = useCallback(
    (dialog) => dispatch(dialogActions.openDialog(dialog)),
    [dispatch],
  );
  const submitFormRedux = useCallback(
    (formName) => dispatch(submit(formName)),
    [dispatch],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { updateReady: setIsReadyForNext } = useReadyForNextStage();

  const [pendingDirection, setPendingDirection] = useState(null);
  const [pendingStage, setPendingStage] = useState(-1);

  const getItemIndex = useCallback(() => activeIndex - 1, [activeIndex]);
  const isIntroScreen = useCallback(() => activeIndex === 0, [activeIndex]);
  const isLastItem = useCallback(
    () => activeIndex >= items.length,
    [activeIndex, items.length],
  );

  const previousItem = useCallback(
    () => setActiveIndex(getItemIndex()),
    [getItemIndex],
  );
  const nextItem = useCallback(
    () => setActiveIndex(activeIndex + 1),
    [activeIndex],
  );

  // Submit the form of whatever slide is currently active.
  // Get the form name based on the index of the slide.
  const submitCurrentForm = useCallback(
    () => submitFormRedux(getFormName(getItemIndex())),
    [submitFormRedux, getFormName, getItemIndex],
  );

  // Ref to hold the current slide form state
  const formState = useRef({
    isFormValid,
    isFormDirty,
  });

  // Helpers for accessing form state
  const getIsFormValid = useCallback(
    () => formState.current.isFormValid[getItemIndex()],
    [getItemIndex],
  );
  const getIsFormDirty = useCallback(
    () => formState.current.isFormDirty[getItemIndex()],
    [getItemIndex],
  );

  // Update the navigation button to glow when the current form is valid
  useEffect(() => {
    formState.current = {
      isFormValid,
      isFormDirty,
    };
  }, [isFormValid, isFormDirty]);

  // And we are scrolled to the bottom.
  useEffect(() => {
    const readyForNext = getIsFormValid() && scrollProgress === 1;
    setIsReadyForNext(readyForNext);
  }, [setIsReadyForNext, scrollProgress, getIsFormValid]);

  // Show a confirmation dialog if the form is dirty and invalid.
  const confirmIfChanged = useCallback(() => {
    if (!getIsFormDirty()) {
      return Promise.resolve(true);
    }
    return openDialog(confirmDialog);
  }, [getIsFormDirty, openDialog]);

  /**
   * Called by ProtocolScreen before navigating away from this stage
   *
   * If this `beforeNext` method is defined on an interfaces, the
   * navigation will be blocked until `onComplete()` is
   * called, which allows async events to happen such as form submission.
   */
  const beforeNext = useCallback(
    (direction, index = -1) => {
      setPendingDirection(direction);
      const isPendingStageChange = index !== -1;

      // If we are about to change stage...
      if (isPendingStageChange) {
        // ... if the form has been changed and is valid, submit  it
        if (getIsFormValid() && getIsFormDirty()) {
          setPendingStage(index);
          submitCurrentForm(); // submit and handleUpdate will complete
        } else {
          // ... otherwise, prompt the user to confirm lost changes
          confirmIfChanged().then((confirmed) => {
            if (confirmed) {
              onComplete(direction); // show next stage and lose changes
              return;
            }
            submitCurrentForm(); // submit so errors will display
          });
        }
        return;
      }

      setPendingStage(index);

      // Leave the stage if there are no items or if we are on the intro and
      // moving backwards
      if (items.length === 0 || (isIntroScreen() && direction === -1)) {
        onComplete(direction);
        return;
      }

      // If we are on the intro and moving forwards, move to the next item
      if (isIntroScreen() && direction === 1) {
        nextItem();
        return;
      }

      // If we are moving backward and the current form is not valid...
      if (direction === -1 && !getIsFormValid()) {
        confirmIfChanged().then((confirmed) => {
          if (confirmed) {
            previousItem();
            return;
          }

          submitCurrentForm();
        });

        return;
      }

      setPendingStage(index);
      submitCurrentForm();
    },
    [
      getIsFormValid,
      getIsFormDirty,
      onComplete,
      submitCurrentForm,
      items.length,
      isIntroScreen,
      nextItem,
      previousItem,
      confirmIfChanged,
    ],
  );

  const parentClasses = cx('alter-form', parentClass);

  const isComplete = useCallback(
    (direction, currentStep) => {
      if (isIntroScreen() && direction === -1) {
        return true;
      }
      if (isLastItem() && direction === 1) {
        return true;
      }
      if (currentStep !== -1) {
        return true;
      }
      return false;
    },
    [isIntroScreen, isLastItem],
  );

  const handleScroll = useCallback(
    () =>
      debounce((_, progress) => {
        setScrollProgress(progress);
        const nextIsReady = getIsFormValid() && progress === 1;

        setIsReadyForNext(nextIsReady);
      }, 200),
    [setIsReadyForNext, setScrollProgress, getIsFormValid],
  );

  useEffect(() => {
    setIsReadyForNext(false);
  }, [activeIndex, setIsReadyForNext]);

  const handleUpdate = useCallback(
    (...update) => {
      updateItem(...update);

      if (isComplete(pendingDirection, pendingStage)) {
        onComplete(pendingDirection);
        return;
      }

      if (pendingDirection === -1) {
        previousItem();
        return;
      }

      nextItem();
    },
    [
      updateItem,
      onComplete,
      pendingDirection,
      pendingStage,
      previousItem,
      nextItem,
      isComplete,
    ],
  );

  useEffect(() => {
    registerBeforeNext(beforeNext);
  }, [beforeNext, registerBeforeNext]);

  // enter key should always move forward, and needs to process using beforeNext
  const handleEnterSubmit = useCallback(
    (e) => {
      beforeNext(1);
      e.preventDefault();
    },
    [beforeNext],
  );

  const renderActiveSlide = useCallback(() => {
    const itemIndex = getItemIndex();
    const formName = getFormName(itemIndex);

    const slideForm = {
      ...form,
      form: formName,
    };

    return (
      <motion.div
        key={itemIndex}
        className="slide-wrapper"
        variants={slideVariants}
        animate="show"
        initial={pendingDirection === 1 ? 'hideBottom' : 'hideTop'}
        exit={pendingDirection === 1 ? 'hideTop' : 'hideBottom'}
        transition={{ easing: 'easeInOutQuad', duration: 0.5 }}
      >
        <SlideForm
          key={itemIndex}
          subject={stage.subject}
          item={items[itemIndex]}
          onUpdate={handleUpdate}
          onScroll={handleScroll}
          form={slideForm}
          submitButton={
            <button
              type="submit"
              key="submit"
              aria-label="Submit"
              hidden
              onClick={handleEnterSubmit}
            />
          }
        />
      </motion.div>
    );
  }, [
    items,
    getFormName,
    form,
    stage.subject,
    pendingDirection,
    handleUpdate,
    handleScroll,
    SlideForm,
    handleEnterSubmit,
    getItemIndex,
  ]);

  const renderIntroSlide = useCallback(
    () => (
      <motion.div
        key="introduction-wrapper"
        className="introduction-wrapper"
        variants={slideVariants}
        animate="show"
        initial={pendingDirection === 1 ? 'hideBottom' : 'hideTop'}
        exit="hideTop"
        transition={{ easing: 'easeInOutQuad', duration: 0.5 }}
      >
        <div className="alter-form__introduction">
          <h1>{stage.introductionPanel.title}</h1>
          <Markdown label={stage.introductionPanel.text} />
        </div>
      </motion.div>
    ),
    [
      pendingDirection,
      stage.introductionPanel.title,
      stage.introductionPanel.text,
    ],
  );

  return (
    <div className={parentClasses}>
      <div className="slide-container">
        <AnimatePresence initial={false}>
          {isIntroScreen() ? renderIntroSlide() : renderActiveSlide()}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {!isIntroScreen() && (
          <motion.div
            className="progress-container"
            key="progress-container"
            initial={{ opacity: 0, y: 100 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: 0.5, duration: 0.5 },
            }}
            exit={{ opacity: 0, y: 100 }}
          >
            <h6 className="progress-container__status-text">
              <strong>{activeIndex}</strong> of <strong>{items.length}</strong>
            </h6>
            <ProgressBar
              orientation="horizontal"
              percentProgress={(activeIndex / items.length) * 100}
              nudge={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

SlidesForm.propTypes = {
  form: PropTypes.object.isRequired,
  stage: PropTypes.object.isRequired,
  items: PropTypes.array,
  updateItem: PropTypes.func.isRequired,
  parentClass: PropTypes.string,
  slideForm: PropTypes.elementType.isRequired,
};

const makeMapStateToProps = () => {
  const formPrefix = uuid();

  const getFormName = (formId) =>
    formId ? `${formPrefix}_${formId}` : formPrefix;

  return (state, props) => {
    const isFormValid = props.items.map((_, index) =>
      isValid(getFormName(index))(state),
    );

    const isFormDirty = props.items.map((_, index) =>
      isDirty(getFormName(index))(state),
    );

    return {
      form: props.stage.form,
      getFormName,
      isFormValid,
      isFormDirty,
    };
  };
};

const withStore = connect(makeMapStateToProps);

export { SlidesForm };

export default withStore(SlidesForm);
