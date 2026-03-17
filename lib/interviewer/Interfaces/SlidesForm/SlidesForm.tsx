import { debounce } from 'es-toolkit';
import { AnimatePresence, motion } from 'motion/react';
import type { ForwardRefExoticComponent, ReactElement, RefAttributes } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Surface from '~/components/layout/Surface';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import ProgressBar from '~/components/ui/ProgressBar';
import useDialog from '~/lib/dialogs/useDialog';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import {
  type BeforeNextFunction,
  type Direction,
  type StageProps,
} from '~/lib/interviewer/types';
import { cx } from '~/utils/cva';
import useReadyForNextStage from '../../hooks/useReadyForNextStage';
import { type SlideFormHandle } from './SlideFormNode';

type SlidesFormProps = StageProps<'AlterForm' | 'AlterEdgeForm'> & {
  items: unknown[];
  updateItem: (...args: unknown[]) => void;
  parentClass?: string;
  slideForm: ForwardRefExoticComponent<
    {
      item: unknown;
      onUpdate: (...args: unknown[]) => void;
      onScroll: () => void;
      form: Record<string, unknown>;
      submitButton: ReactElement<Record<string, unknown>>;
    } & RefAttributes<SlideFormHandle>
  >;
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

function SlidesForm({
  stage,
  getNavigationHelpers,
  items = [],
  slideForm: SlideForm,
  parentClass = '',
  updateItem,
}: SlidesFormProps) {
  const { moveForward } = getNavigationHelpers();

  const { openDialog } = useDialog();

  // Ref to access the current slide's form methods
  const slideFormRef = useRef<SlideFormHandle>(null);

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

  // Update readiness based on scroll progress (validity is checked via ref when needed)
  useEffect(() => {
    const isValid = slideFormRef.current?.isValid ?? true;
    const readyForNext = isValid && scrollProgress === 1;
    setIsReadyForNext(readyForNext);
  }, [setIsReadyForNext, scrollProgress]);

  const beforeNext: BeforeNextFunction = async (direction: Direction) => {
    if (items.length === 0) {
      return true;
    }

    flushSync(() => setPendingDirection(direction));

    if (isIntroScreen() && direction === 'backwards') {
      return true;
    }

    const formHandle = slideFormRef.current;

    if (direction === 'backwards') {
      // Validate to get fresh state
      const formIsValid = formHandle
        ? await formHandle.validateForm()
        : true;
      const isDirty = formHandle?.isDirty ?? false;

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
          previousItem();
        }
        return false;
      }

      if (formIsValid && formHandle) {
        await formHandle.submitForm();
      }

      previousItem();
      return false;
    }

    if (isIntroScreen()) {
      nextItem();
      return false;
    }

    // Validate form before proceeding forward
    const formIsValid = formHandle ? await formHandle.validateForm() : true;

    if (!formIsValid) {
      return false;
    }

    if (formHandle) {
      await formHandle.submitForm();
    }

    if (isLastItem()) {
      return true;
    }

    nextItem();
    return false;
  };

  const parentClasses = cx('interface', parentClass);

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

  // Create a stable debounced scroll handler
  const debouncedScrollHandler = useMemo(
    () =>
      debounce((_: unknown, progress: number) => {
        setScrollProgress(progress);
      }, 200),
    [],
  );

  // Cleanup debounced handler on unmount
  useEffect(() => {
    return () => {
      debouncedScrollHandler.cancel();
    };
  }, [debouncedScrollHandler]);

  const handleScroll = useCallback(
    () => debouncedScrollHandler,
    [debouncedScrollHandler],
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

  useBeforeNext(beforeNext);

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
          ref={slideFormRef}
          key={itemIndex}
          item={items[itemIndex]}
          onUpdate={handleUpdate}
          onScroll={handleScroll}
          form={stage.form}
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

export default SlidesForm;
