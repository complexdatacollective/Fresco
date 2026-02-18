import { type Stage } from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Surface, { MotionSurface } from '~/components/layout/Surface';
import {
  ALLOWED_MARKDOWN_SECTION_TAGS,
  RenderMarkdown,
} from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import { ScrollArea } from '~/components/ui/ScrollArea';
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

  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [showScrollStatus, setShowScrollStatus] = useFlipflop(
    true,
    7000,
    false,
  );

  const { isDirty: isFormDirty, isValid: isFormValid } = useFormMeta();
  const submitForm = useFormStore((s) => s.submitForm);
  const validateForm = useFormStore((s) => s.validateForm);

  const [isOverflowing, setIsOverflowing] = useState(false);
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

  const showScrollNudge =
    !hasReachedBottom && showScrollStatus && isOverflowing;

  const scrollRafRef = useRef<number | null>(null);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
      }

      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
        setHasReachedBottom(atBottom);
        setShowScrollStatus(false);
      });
    },
    [setShowScrollStatus],
  );

  const { fieldComponents } = useProtocolForm({
    fields: form.fields,
    initialValues: Object.fromEntries(
      Object.entries(egoAttributes).filter(([, value]) => value !== null),
    ) as Record<string, FieldValue>,
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = scrollAreaRef.current;
    if (!viewport) return;

    const checkOverflow = () => setIsOverflowing(elementHasOverflow(viewport));

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(viewport);

    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollAreaRef.current?.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  return (
    <>
      <ScrollArea
        className="m-0 size-full"
        onScroll={handleScroll}
        ref={scrollAreaRef}
      >
        <div
          ref={contentRef}
          className="interface mx-auto max-w-[80ch] flex-col"
        >
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
