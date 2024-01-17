import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
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
  message: 'This form contains invalid data, so it cannot be saved. If you continue it will be reset, and your changes will be lost. Do you want to discard your changes?',
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
    getFormName,
    isFormValid,
    isFormDirty,
    updateItem,
  } = props;

  const dispatch = useDispatch();
  const openDialog = useCallback((dialog) => dispatch(dialogActions.openDialog(dialog)), [dispatch]);
  const submitFormRedux = useCallback((formName) => dispatch(submit(formName)), [dispatch]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  // const { updateReady: setIsReadyForNext } = useReadyForNextStage();

  const [pendingDirection, setPendingDirection] = useState(null);

  const getItemIndex = useCallback(() => activeIndex - 1, [activeIndex]);
  const isIntroScreen = useCallback(() => activeIndex === 0, [activeIndex]);
  const isLastItem = useCallback(() => activeIndex >= items.length, [activeIndex, items.length]);

  const previousItem = useCallback(() => setActiveIndex(getItemIndex()), [getItemIndex]);
  const nextItem = useCallback(() => setActiveIndex(activeIndex + 1), [activeIndex]);

  // Submit the form of whatever slide is currently active.
  // Get the form name based on the index of the slide.
  const submitCurrentForm = useCallback(() => submitFormRedux(getFormName(getItemIndex())), [submitFormRedux, getFormName, getItemIndex]);

  // Ref to hold the current slide form state
  const formState = useRef({
    isFormValid,
    isFormDirty,
  });

  // Helpers for accessing form state
  const currentFormIsValid = useCallback(() => (formState.current.isFormValid[getItemIndex()]), [getItemIndex]);
  const currentFormIsDirty = useCallback(() => (formState.current.isFormDirty[getItemIndex()]), [getItemIndex]);

  // Update the navigation button to glow when the current form is valid
  // And we are scrolled to the bottom.
  // useEffect(() => {
  //   formState.current = {
  //     isFormValid,
  //     isFormDirty,
  //   };

  //   const readyForNext = currentFormIsValid() && scrollProgress === 1;
  //   setIsReadyForNext(readyForNext);
  // }, [isFormValid, isFormDirty, setIsReadyForNext, scrollProgress, currentFormIsValid]);

  // Show a dialog prompting the user to discard changes when form is dirty & invalid
  const checkShouldProceed = useCallback(() => {
    return openDialog(confirmDialog);
  }, [openDialog]);

  const beforeNext = useCallback((direction) => {
    // Leave the stage if there are no items
    if (items.length === 0) {
      return true;
    }

    // Leave the stage if we are on the intro and going backwards
    if (isIntroScreen() && direction === 'backwards') {
      return true;
    }

    setPendingDirection(direction);

    // When moving backwards, allow navigation when form is valid and not dirty
    if (direction === 'backwards') {
      if (!currentFormIsValid() && currentFormIsDirty()) {
        checkShouldProceed().then((confirm) => {
          if (confirm) {
            previousItem();
          }

          return false;
        })
      }

      previousItem();
    }

    // We are moving forwards. 

    // If we are on the intro and moving forwards, move to the next item
    if (isIntroScreen()) {
      nextItem();
      return false;
    }

    // We need to check the validity of the current
    // form, and submit it.
    submitCurrentForm();

    // If the form is valid, move to the next item
    if (currentFormIsValid()) {
      // If we are on the last item, move to the next stage
      if (isLastItem()) {
        return true;
      }

      nextItem();
      return false;
    }
  }, [isIntroScreen, isLastItem, currentFormIsValid, currentFormIsDirty, checkShouldProceed, submitCurrentForm, nextItem, previousItem, items.length]);

  const parentClasses = cx(
    'alter-form',
    parentClass,
  );

  const isComplete = useCallback((direction) => {
    if (isIntroScreen() && direction === -1) { return true; }
    if (isLastItem() && direction === 1) { return true; }
    return false;
  }, [isIntroScreen, isLastItem]);

  // const handleScroll = useCallback(() => debounce((_, progress) => {
  //   setScrollProgress(progress);
  //   const nextIsReady = currentFormIsValid() && progress === 1;

  //   setIsReadyForNext(nextIsReady);
  // }, 200), [setIsReadyForNext, setScrollProgress, currentFormIsValid]);

  // useEffect(() => {
  //   setIsReadyForNext(false);
  // }, [activeIndex, setIsReadyForNext]);

  const handleUpdate = useCallback((...update) => {
    updateItem(...update);

    // If stage is complete, return early.
    if (isComplete(pendingDirection)) {
      return;
    }

    if (pendingDirection === 'backwards') {
      previousItem();
      return;
    }

    nextItem();
  }, [updateItem, pendingDirection, previousItem, nextItem, isComplete]);

  useEffect(() => {
    registerBeforeNext(beforeNext);
  }, [beforeNext, registerBeforeNext]);

  // enter key should always move forward, and needs to process using beforeNext
  const handleEnterSubmit = useCallback((e) => {
    beforeNext(1);
    e.preventDefault();
  }, [beforeNext]);

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
        initial={pendingDirection === 'forwards' ? 'hideBottom' : 'hideTop'}
        exit={pendingDirection === 'forwards' ? 'hideTop' : 'hideBottom'}
        transition={{ easing: 'easeInOutQuad', duration: 0.5 }}
      >
        <SlideForm
          key={itemIndex}
          subject={stage.subject}
          item={items[itemIndex]}
          onUpdate={handleUpdate} // TODO: this should be renamed onSubmit for consistency with EgoForm
          // onScroll={handleScroll}
          form={slideForm}
          submitButton={<button type="submit" key="submit" aria-label="Submit" hidden onClick={handleEnterSubmit} />}
        />
      </motion.div>
    );
  }, [items, getFormName, form, stage.subject, pendingDirection, handleUpdate, SlideForm, handleEnterSubmit, getItemIndex]);

  const renderIntroSlide = useCallback(() => (
    <motion.div
      key="introduction-wrapper"
      className="introduction-wrapper"
      variants={slideVariants}
      animate="show"
      initial={pendingDirection === 'forwards' ? 'hideBottom' : 'hideTop'}
      exit="hideTop"
      transition={{ easing: 'easeInOutQuad', duration: 0.5 }}
    >
      <div
        className="alter-form__introduction"
      >
        <h1>{stage.introductionPanel.title}</h1>
        <Markdown
          label={stage.introductionPanel.text}
        />
      </div>
    </motion.div>
  ), [pendingDirection, stage.introductionPanel.title, stage.introductionPanel.text]);

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
            animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.5 } }}
            exit={{ opacity: 0, y: 100 }}
          >
            <h6 className="progress-container__status-text">
              <strong>{activeIndex}</strong>
              {' '}
              of
              {' '}
              <strong>{items.length}</strong>
            </h6>
            <ProgressBar orientation="horizontal" percentProgress={(activeIndex / items.length) * 100} nudge={false} />
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

  const getFormName = (formId) => (formId ? `${formPrefix}_${formId}` : formPrefix);

  return (state, props) => {
    const isFormValid = props.items.map(
      (_, index) => isValid(getFormName(index))(state),
    );

    const isFormDirty = props.items.map(
      (_, index) => isDirty(getFormName(index))(state),
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
