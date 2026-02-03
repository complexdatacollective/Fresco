import { type Stage } from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Surface from '~/components/layout/Surface';
import {
  ALLOWED_MARKDOWN_SECTION_TAGS,
  RenderMarkdown,
} from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import useDialog from '~/lib/dialogs/useDialog';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import { useFormMeta } from '~/lib/form/hooks/useFormState';
import useFormStore from '~/lib/form/hooks/useFormStore';
import useProtocolForm from '~/lib/form/hooks/useProtocolForm';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { type FieldValue } from '~/lib/form/store/types';
import { type BeforeNextFunction } from '../components/ProtocolScreen';
import { type StageProps } from '../components/Stage';
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

type EgoFormProps = StageProps & {
  stage: Extract<Stage, { type: 'EgoForm' }>;
};

const EgoFormInner = (props: EgoFormProps) => {
  const { registerBeforeNext, stage } = props;

  const { form, introductionPanel } = stage;

  const dispatch = useAppDispatch();
  const { openDialog } = useDialog();

  const { isDirty: isFormDirty, isValid: isFormValid } = useFormMeta();
  const submitForm = useFormStore((s) => s.submitForm);
  const validateForm = useFormStore((s) => s.validateForm);

  const [scrollProgress] = useState(0);
  const [showScrollStatus] = useFlipflop(true, 7000, false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const { updateReady: setIsReadyForNext } = useReadyForNextStage();
  const egoAttributes = useSelector(getEgoAttributes);

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
          intent: 'destructive',
          actions: {
            primary: { label: 'Discard changes', value: true },
            cancel: { label: 'Go back', value: false },
          },
        });
        return !!result;
      }

      // if form is valid submit the form and proceed backwards
      if (isFormDirty && isFormValid) {
        await submitForm();
      }

      return true;
    }

    // Validate form and submit if valid
    const formIsValid = await validateForm();
    if (formIsValid) {
      await submitForm();
      return true;
    }

    // If the form is invalid, block navigation.
    return false;
  };

  registerBeforeNext(beforeNext);

  const handleSubmitForm = useCallback(
    async (formData: unknown) => {
      await dispatch(updateEgo(formData as Record<string, VariableValue>));
      return { success: true };
    },
    [dispatch],
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
    initialValues: Object.fromEntries(
      Object.entries(egoAttributes).filter(([, value]) => value !== null),
    ) as Record<string, FieldValue>,
  });

  return (
    <div className="interface mx-auto max-w-[80ch] flex-col">
      <Surface>
        <Heading level="h1">{introductionPanel.title}</Heading>
        <RenderMarkdown allowedElements={ALLOWED_MARKDOWN_SECTION_TAGS}>
          {introductionPanel.text}
        </RenderMarkdown>
      </Surface>
      <Surface>
        <FormWithoutProvider onSubmit={handleSubmitForm}>
          {fieldComponents}
        </FormWithoutProvider>
      </Surface>
      <AnimatePresence>
        {showScrollNudge && (
          <motion.div
            className="scroll-nudge gap-2"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
          >
            <Heading level="h4" margin="none">
              Scroll to see more questions
            </Heading>
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
              <ChevronDown size="24" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EgoForm = (props: EgoFormProps) => {
  return (
    <FormStoreProvider>
      <EgoFormInner {...props} />
    </FormStoreProvider>
  );
};

export default EgoForm;
