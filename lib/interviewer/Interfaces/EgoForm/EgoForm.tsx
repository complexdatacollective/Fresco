import { type VariableValue } from '@codaco/shared-consts';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { useSelector } from 'react-redux';
import Surface, { MotionSurface } from '@codaco/fresco-ui/layout/Surface';
import Heading from '@codaco/fresco-ui/typography/Heading';
import {
    ALLOWED_MARKDOWN_SECTION_TAGS,
    RenderMarkdown,
} from '@codaco/fresco-ui/RenderMarkdown';
import { ScrollArea } from '@codaco/fresco-ui/ScrollArea';
import { useScrolledToBottom } from '~/hooks/useScrolledToBottom';
import useDialog from '@codaco/fresco-ui/dialogs/useDialog';
import { FormWithoutProvider } from '@codaco/fresco-ui/form/Form';
import { useFormMeta } from '@codaco/fresco-ui/form/hooks/useFormState';
import useFormStore from '@codaco/fresco-ui/form/hooks/useFormStore';
import useProtocolForm from '~/lib/interviewer/forms/useProtocolForm';
import FormStoreProvider from '@codaco/fresco-ui/form/store/formStoreProvider';
import { type FieldValue, type FlattenedErrors } from '@codaco/fresco-ui/form/store/types';
import { focusFirstError } from '@codaco/fresco-ui/form/utils/focusFirstError';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import {
    type BeforeNextFunction,
    type StageProps,
} from '~/lib/interviewer/types';
import { updateEgo } from '../../ducks/modules/session';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';
import { getEgoAttributes } from '../../selectors/session';
import { useAppDispatch } from '../../store';

type EgoFormProps = StageProps<'EgoForm'>;

const EgoFormInner = (props: EgoFormProps) => {
  const { stage } = props;

  const { form, introductionPanel } = stage;

  const dispatch = useAppDispatch();
  const { openDialog } = useDialog();

  const [nudgeVisible, setNudgeVisible] = useState(false);

  const { isDirty: isFormDirty, isValid: isFormValid } = useFormMeta();
  const submitForm = useFormStore((s) => s.submitForm);
  const validateForm = useFormStore((s) => s.validateForm);
  const formErrors = useFormStore((s) => s.errors);
  const formErrorsRef = useRef<FlattenedErrors>(formErrors);
  useLayoutEffect(() => {
    formErrorsRef.current = formErrors;
  }, [formErrors]);

  const fields = useFormStore((s) => s.fields);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { hasScrolledToBottom, sentinelRef } =
    useScrolledToBottom(scrollAreaRef);

  // Show nudge after 15s of inactivity. Reset on field changes.
  // Once the user has scrolled to the bottom, permanently hide the nudge.
  useEffect(() => {
    setNudgeVisible(false);
    if (hasScrolledToBottom) return;
    const timer = setTimeout(() => setNudgeVisible(true), 15000);
    return () => clearTimeout(timer);
  }, [fields, hasScrolledToBottom]);

  const { updateReady: setIsReadyForNext } = useReadyForNextStage();
  const egoAttributes = useSelector(getEgoAttributes);

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
            cancel: { label: 'Keep changes', value: false },
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

    // Scroll to the first validation error after a tick so the store
    // update has propagated to React and error elements are rendered.
    setTimeout(() => {
      focusFirstError(formErrorsRef.current);
    }, 0);

    return false;
  };

  useBeforeNext(beforeNext);

  const handleSubmitForm = useCallback(
    async (formData: Record<string, FieldValue>) => {
      // Only include fields from this stage to avoid overwriting values
      // from previous EgoForm stages. Missing fields (unanswered questions)
      // are set to null rather than omitted.
      const stageFieldIds = form.fields.map((f) => f.variable);
      const completeData = Object.fromEntries(
        stageFieldIds.map((id) => [id, formData[id] ?? null]),
      ) as Record<string, VariableValue>;

      await dispatch(updateEgo(completeData));
      return { success: true };
    },
    [dispatch, form.fields],
  );

  useEffect(() => {
    if (!isFormValid) {
      setIsReadyForNext(false);
      return;
    }

    setIsReadyForNext(true);
  }, [isFormValid, setIsReadyForNext]);

  const showScrollNudge = nudgeVisible && !hasScrolledToBottom;

  const { fieldComponents } = useProtocolForm({
    fields: form.fields,
    initialValues: Object.fromEntries(
      Object.entries(egoAttributes).filter(([, value]) => value !== null),
    ) as Record<string, FieldValue>,
  });

  const scrollToBottom = useCallback(() => {
    scrollAreaRef.current?.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  return (
    <>
      <ScrollArea className="m-0 size-full" ref={scrollAreaRef}>
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
        </div>
        <div ref={sentinelRef} aria-hidden />
      </ScrollArea>
      <AnimatePresence>
        {showScrollNudge && (
          <MotionSurface
            noContainer
            level="popover"
            spacing="xs"
            role="status"
            aria-live="polite"
            className="scroll-nudge absolute bottom-4 left-1/2 z-10 flex translate-x-[-50%]"
            initial={{ y: '100%' }}
            animate={{
              y: 0,
              transition: { type: 'spring', stiffness: 200, damping: 15 },
            }}
            exit={{ y: '200%' }}
          >
            <button
              type="button"
              onClick={scrollToBottom}
              className="flex items-center gap-2"
            >
              <motion.div
                aria-hidden="true"
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
              <Heading level="label" margin="none">
                Scroll to see more questions
              </Heading>
              <motion.div
                aria-hidden="true"
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
            </button>
          </MotionSurface>
        )}
      </AnimatePresence>
    </>
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
