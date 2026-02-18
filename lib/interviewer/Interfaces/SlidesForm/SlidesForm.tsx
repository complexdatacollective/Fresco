import { type Stage } from '@codaco/protocol-validation';
import { debounce } from 'es-toolkit';
import { AnimatePresence, motion } from 'motion/react';
import type { ComponentType, ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import Surface from '~/components/layout/Surface';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import ProgressBar from '~/components/ui/ProgressBar';
import useDialog from '~/lib/dialogs/useDialog';
import useFormState from '~/lib/form/hooks/useFormState';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { cx } from '~/utils/cva';
import {
  type BeforeNextFunction,
  type Direction,
  type StageProps,
} from '../../components/ProtocolScreen';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';

type SlidesFormProps = StageProps & {
  stage: Extract<Stage, { type: 'AlterForm' | 'EgoForm' }>;
  items: unknown[];
  updateItem: (...args: unknown[]) => void;
  parentClass?: string;
  slideForm: ComponentType<{
    subject: Record<string, unknown>;
    item: unknown;
    onUpdate: (...args: unknown[]) => void;
    onScroll: () => void;
    form: Record<string, unknown>;
    submitButton: ReactElement<Record<string, unknown>>;
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
  parentClass = '',
  registerBeforeNext,
  updateItem,
}: SlidesFormProps) {
  const { moveForward } = getNavigationHelpers();

  const { openDialog } = useDialog();

  const formState = useFormState();
  const { submitForm, isValid, isDirty } = formState;

  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { updateReady: setIsReadyForNext } = useReadyForNextStage();

  const [pendingDirection, setPendingDirection] = useState<Direction | null>(
    null,
  );

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

  useEffect(() => {
    const readyForNext = isValid && scrollProgress === 1;
    setIsReadyForNext(readyForNext);
  }, [setIsReadyForNext, scrollProgress, isValid]);

  const beforeNext: BeforeNextFunction = (direction: Direction) => {
    if (items.length === 0) {
      return true;
    }

    flushSync(() => setPendingDirection(direction));

    if (isIntroScreen() && direction === 'backwards') {
      return true;
    }

    if (direction === 'backwards') {
      if (!isValid && isDirty) {
        void openDialog({
          type: 'choice',
          title: 'Discard changes?',
          description:
            'This form contains invalid data, so it cannot be saved. If you continue it will be reset, and your changes will be lost. Do you want to discard your changes?',
          intent: 'destructive',
          actions: {
            primary: { label: 'Discard changes', value: true },
            cancel: { label: 'Go back', value: false },
          },
        }).then((confirm) => {
          if (confirm) {
            previousItem();
          }
          void submitForm();
        });
        return false;
      } else if (isValid) {
        void submitForm();
      }

      previousItem();
      return false;
    }

    if (isIntroScreen()) {
      nextItem();
      return false;
    }

    void submitForm();

    if (!isValid) {
      return false;
    }

    if (isValid) {
      if (isLastItem()) {
        return true;
      }

      nextItem();
      return false;
    }

    return false;
  };

  const parentClasses = cx(
    'interface flex h-full flex-col items-center justify-center',
    parentClass,
  );

  const isComplete = useCallback(
    (direction: Direction | null) => {
      if (isIntroScreen() && direction === 'backwards') {
        return true;
      }
      if (isLastItem() && direction === 'forwards') {
        return true;
      }
      return false;
    },
    [isIntroScreen, isLastItem],
  );

  const handleScroll = useCallback(
    () =>
      debounce((_: unknown, progress: number) => {
        setScrollProgress(progress);
        const nextIsReady = isValid && progress === 1;

        setIsReadyForNext(nextIsReady);
      }, 200),
    [setIsReadyForNext, isValid],
  );

  useEffect(() => {
    setIsReadyForNext(false);
  }, [activeIndex, setIsReadyForNext]);

  const handleUpdate = useCallback(
    (...update: unknown[]) => {
      updateItem(...update);

      if (isComplete(pendingDirection)) {
        return;
      }

      if (pendingDirection === 'backwards') {
        previousItem();
        return;
      }

      nextItem();
    },
    [updateItem, pendingDirection, previousItem, nextItem, isComplete],
  );

  registerBeforeNext(beforeNext);

  const handleEnterSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    moveForward();
    e.preventDefault();
  };

  const renderActiveSlide = () => {
    const itemIndex = getItemIndex();

    return (
      <motion.div
        key={itemIndex}
        className="absolute flex size-full max-w-7xl items-center justify-center [&_.scrollable]:h-full [&_.scrollable]:px-5"
        variants={slideVariants}
        animate="show"
        initial={pendingDirection === 'forwards' ? 'hideBottom' : 'hideTop'}
        exit={pendingDirection === 'forwards' ? 'hideTop' : 'hideBottom'}
        transition={{ ease: 'easeInOut', duration: 0.5 }}
      >
        <SlideForm
          key={itemIndex}
          item={items[itemIndex]}
          onUpdate={handleUpdate}
          onScroll={handleScroll}
          form={formState as Record<string, unknown>}
          subject={
            (stage.type === 'EgoForm'
              ? { entity: 'ego' }
              : stage.subject) as Record<string, unknown>
          }
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
  };

  const renderIntroSlide = useCallback(
    () => (
      <motion.div
        key="introduction-wrapper"
        className="flex size-full items-center justify-center"
        variants={slideVariants}
        animate="show"
        initial={pendingDirection === 'forwards' ? 'hideBottom' : 'hideTop'}
        exit="hideTop"
        transition={{ ease: 'easeInOut', duration: 0.5 }}
      >
        <Surface
          className="@container-normal h-auto max-h-[75%]"
          elevation="medium"
          maxWidth="3xl"
        >
          <Heading level="h1" className="text-center">
            {stage.introductionPanel.title}
          </Heading>
          <RenderMarkdown>{stage.introductionPanel.text}</RenderMarkdown>
        </Surface>
      </motion.div>
    ),
    [pendingDirection, stage.introductionPanel],
  );

  return (
    <div className={parentClasses}>
      <div className="flex w-full flex-auto items-center justify-center overflow-hidden">
        <AnimatePresence initial={false}>
          {isIntroScreen() ? renderIntroSlide() : renderActiveSlide()}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {!isIntroScreen() && (
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
              <strong>{activeIndex}</strong> of <strong>{items.length}</strong>
            </Heading>
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
}

const SlidesForm = (props: SlidesFormProps) => {
  return (
    <FormStoreProvider>
      <SlidesFormInner {...props} />
    </FormStoreProvider>
  );
};

export default SlidesForm;
