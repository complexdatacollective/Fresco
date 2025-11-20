import { type Stage } from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { isDirty, isValid, submit } from 'redux-form';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import { useDialog } from '~/lib/dialogs/DialogProvider';
import { Form } from '~/lib/form';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
import Icon from '~/lib/ui/components/Icon';
import Scroller from '~/lib/ui/components/Scroller';
import { type BeforeNextFunction } from '../containers/ProtocolScreen';
import { type StageProps } from '../containers/Stage';
import { updateEgo } from '../ducks/modules/session';
import useFlipflop from '../hooks/useFlipflop';
import useReadyForNextStage from '../hooks/useReadyForNextStage';
import { getEgoAttributes } from '../selectors/session';
import { useAppDispatch } from '../store';

const elementHasOverflow = ({
  clientWidth,
  clientHeight,
  scrollWidth,
  scrollHeight,
}: {
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
}) => scrollHeight > clientHeight || scrollWidth > clientWidth;

const getFormName = (index: string) => `EGO_FORM_${index}`;

type EgoFormProps = StageProps & {
  stage: Extract<Stage, { type: 'EgoForm' }>;
};

const EgoForm = (props: EgoFormProps) => {
  const { registerBeforeNext, stage } = props;

  const { form, introductionPanel } = stage;

  const dispatch = useAppDispatch();
  const { openDialog } = useDialog();
  const submitFormRedux = useCallback(
    (formName: string) => dispatch(submit(formName)),
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
  const isFormValid = useSelector(isValid(formName));
  const isFormDirty = useSelector(isDirty(formName));

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

  const beforeNext: BeforeNextFunction = async (direction) => {
    // If direction is backwards, and the form is invalid, check if the user
    // wants to proceed anyway (causing the form to be reset)
    if (direction === 'backwards') {
      if (isFormDirty && !isFormValid) {
        const result = await openDialog({
          type: 'choice',
          title: 'Discard changes?',
          description:
            'This form contains invalid data, so it cannot be saved. If you continue it will be reset and your changes will be lost. Do you want to discard your changes?',
          intent: 'danger',
          actions: {
            primary: { label: 'Discard changes', value: true },
            cancel: { label: 'Go back', value: false },
          },
        });
        return !!result;
      }

      // if form is valid submit the form and proceed backwards
      if (isFormDirty && isFormValid) {
        submitFormRedux(formName);
      }

      return true;
    }

    // Submit the form to trigger validation
    submitFormRedux(formName);

    // If the form is valid, proceed to the next stage
    if (isFormValid) {
      return true;
    }

    // If the form is invalid, block navigation.
    return false;
  };

  registerBeforeNext(beforeNext);

  const handleSubmitForm = useCallback(
    async (formData: Record<string, VariableValue>) => {
      await dispatch(updateEgo(formData));
    },
    [dispatch],
  );

  const handleScroll = useCallback(
    (_: number, progress: number) => {
      setShowScrollStatus(false);
      setScrollProgress(progress);
    },
    [setShowScrollStatus, setScrollProgress],
  );

  useEffect(() => {
    if (!isFormValid) {
      setIsReadyForNext(false);
      return;
    }

    setIsReadyForNext(true);
  }, [isFormValid, setIsReadyForNext]);

  const showScrollNudge = useMemo(
    () => scrollProgress !== 1 && showScrollStatus && isOverflowing,
    [scrollProgress, showScrollStatus, isOverflowing],
  );

  const { fieldComponents } = useProtocolForm({
    fields: form.fields,
    initialValues: egoAttributes,
  });

  return (
    <div className="ego-form alter-form">
      <div className="ego-form__form-container">
        <Scroller
          className="ego-form__form-container-scroller"
          onScroll={handleScroll}
        >
          <div className="ego-form__introduction">
            <h1>{introductionPanel!.title}</h1>
            <RenderMarkdown>{introductionPanel!.text}</RenderMarkdown>
          </div>
          <Form onSubmit={handleSubmitForm}>{fieldComponents}</Form>
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

export default EgoForm;
