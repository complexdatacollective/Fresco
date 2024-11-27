import { debounce } from 'lodash-es';
import { AnimatePresence, motion } from 'motion/react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isDirty, isValid, submit } from 'redux-form';
import Markdown from '~/lib/ui/components/Fields/Markdown';
import Icon from '~/lib/ui/components/Icon';
import Scroller from '~/lib/ui/components/Scroller';
import { actionCreators as dialogActions } from '../../ducks/modules/dialogs';
import { actionCreators as sessionActions } from '../../ducks/modules/session';
import useFlipflop from '../../hooks/useFlipflop';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';
import { getEgoAttributes } from '../../selectors/network';
import Form from '../Form';

const elementHasOverflow = ({
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

  const beforeNext = async (direction) => {
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
  };

  registerBeforeNext(beforeNext);

  const handleSubmitForm = (formData) => {
    updateEgo({}, formData);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateReadyStatus = useCallback(
    debounce((progress) => {
      const nextIsReady = isFormValid && progress === 1;
      setIsReadyForNext(nextIsReady);
    }, 200),
    [isFormValid, setIsReadyForNext],
  );

  const handleScroll = useCallback(
    (_, progress) => {
      setShowScrollStatus(false);
      setScrollProgress(progress);

      updateReadyStatus(progress);
    },
    [setShowScrollStatus, setScrollProgress, updateReadyStatus],
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
