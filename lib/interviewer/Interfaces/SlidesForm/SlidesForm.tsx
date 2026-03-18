import { AnimatePresence, motion } from 'motion/react';
import {
  type ComponentType,
  type ReactElement,
  useEffect,
  useState,
} from 'react';
import { useScrolledToBottom } from '~/hooks/useScrolledToBottom';
import { useFormMeta } from '~/lib/form/hooks/useFormState';
import useFormStore from '~/lib/form/hooks/useFormStore';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import Heading from '~/components/typography/Heading';
import ProgressBar from '~/components/ui/ProgressBar';
import useDialog from '~/lib/dialogs/useDialog';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import {
  type BeforeNextFunction,
  type Direction,
  type StageProps,
} from '~/lib/interviewer/types';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';

type SlidesFormProps = StageProps<'AlterForm' | 'AlterEdgeForm'> & {
  items: unknown[];
  updateItem: (...args: unknown[]) => void;
  onNavigateBack?: () => void;
  slideForm: ComponentType<{
    item: unknown;
    onUpdate: (...args: unknown[]) => void;
    form: Record<string, unknown>;
    submitButton: ReactElement;
    sentinelRef: (node: HTMLDivElement | null) => void;
  }>;
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

function SlidesFormInner({
  stage,
  getNavigationHelpers,
  items = [],
  slideForm: SlideForm,
  updateItem,
  onNavigateBack,
}: SlidesFormProps) {
  const { moveForward } = getNavigationHelpers();
  const { openDialog } = useDialog();

  const { isValid, isDirty } = useFormMeta();
  const validateForm = useFormStore((s) => s.validateForm);
  const submitForm = useFormStore((s) => s.submitForm);
  const fieldCount = useFormStore((s) => s.fields.size);
  const formErrors = useFormStore((s) => s.errors);

  const { isAtBottom: hasScrolledToBottom, sentinelRef } =
    useScrolledToBottom();

  const [activeIndex, setActiveIndex] = useState(0);
  const { updateReady: setIsReadyForNext } = useReadyForNextStage();

  const [pendingDirection, setPendingDirection] = useState<Direction | null>(
    null,
  );

  useEffect(() => {
    setIsReadyForNext(isValid && hasScrolledToBottom && fieldCount > 0);
  }, [setIsReadyForNext, isValid, hasScrolledToBottom, fieldCount]);

  useEffect(() => {
    setIsReadyForNext(false);
  }, [activeIndex, setIsReadyForNext]);

  const beforeNext: BeforeNextFunction = async (direction: Direction) => {
    if (items.length === 0) {
      return true;
    }

    setPendingDirection(direction);

    if (direction === 'backwards') {
      if (activeIndex === 0) {
        if (onNavigateBack) {
          onNavigateBack();
          return false;
        }
        return true;
      }

      const formIsValid = await validateForm();

      if (!formIsValid && isDirty) {
        const confirm = await openDialog({
          type: 'choice',
          title: 'Discard changes?',
          description:
            'This form contains invalid data, so it cannot be saved. If you continue it will be reset, and your changes will be lost. Do you want to discard your changes?',
          intent: 'destructive',
          actions: {
            primary: { label: 'Discard changes', value: true },
            cancel: { label: 'Go back', value: false },
          },
        });

        if (confirm) {
          setActiveIndex((prev) => prev - 1);
        }
        return false;
      }

      if (formIsValid) {
        await submitForm();
      }

      setActiveIndex((prev) => prev - 1);
      return false;
    }

    // Forward direction
    const formIsValid = await validateForm();

    if (!formIsValid) {
      focusFirstError(formErrors);
      return false;
    }

    await submitForm();

    if (activeIndex >= items.length - 1) {
      return true;
    }

    setActiveIndex((prev) => prev + 1);
    return false;
  };

  useBeforeNext(beforeNext);

  const handleEnterSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    moveForward();
    e.preventDefault();
  };

  return (
    <div className="interface">
      <div className="flex w-full flex-auto items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeIndex}
            className="absolute flex size-full max-w-7xl items-center justify-center [&_.scrollable]:h-full [&_.scrollable]:px-5"
            variants={slideVariants}
            animate="show"
            initial={pendingDirection === 'forwards' ? 'hideBottom' : 'hideTop'}
            exit={pendingDirection === 'forwards' ? 'hideTop' : 'hideBottom'}
            transition={{ ease: 'easeInOut', duration: 0.5 }}
          >
            <SlideForm
              key={activeIndex}
              item={items[activeIndex]}
              onUpdate={updateItem}
              form={stage.form}
              sentinelRef={sentinelRef}
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
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {items.length > 1 && (
          <motion.div
            className="absolute bottom-5 z-[--z-panel] flex w-80 flex-none flex-col text-center"
            key="progress-container"
            initial={{ opacity: 0, y: 100 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: 0.5, duration: 0.5 },
            }}
            exit={{ opacity: 0, y: 100 }}
          >
            <Heading level="label">
              <strong>{activeIndex + 1}</strong> of{' '}
              <strong>{items.length}</strong>
            </Heading>
            <ProgressBar
              orientation="horizontal"
              percentProgress={((activeIndex + 1) / items.length) * 100}
              nudge={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SlidesForm(props: SlidesFormProps) {
  return (
    <FormStoreProvider>
      <SlidesFormInner {...props} />
    </FormStoreProvider>
  );
}
