'use client';

import { type Prompt as TPrompt } from '@codaco/protocol-validation';
import { findIndex } from 'es-toolkit/compat';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef } from 'react';
import { cx } from '~/utils/cva';
import Pips from './Pips';
import Prompt from './Prompt';

const containerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { when: 'beforeChildren' as const } },
  exit: { opacity: 0 },
};

type PromptsProps = {
  prompts: TPrompt[];
  currentPromptId?: string;
  className?: string;
  small?: boolean;
};

/**
 * Displays prompts with navigation pips and animations.
 * Uses aria-live region to announce prompt changes to screen readers.
 */
const Prompts = ({
  currentPromptId = '0',
  prompts,
  className,
  small,
}: PromptsProps) => {
  const prevPromptRef = useRef<number>(undefined);

  const currentIndex = findIndex(
    prompts,
    (prompt) => prompt.id === currentPromptId,
  );

  useEffect(() => {
    prevPromptRef.current = currentIndex;
  }, [currentPromptId, currentIndex]);

  const backwards = useMemo(
    () => currentIndex < (prevPromptRef.current ?? 0),
    [currentIndex],
  );

  const promptsClasses = cx(
    'text-surface-contrast flex w-full flex-col items-center leading-tight font-normal text-balance',
    className,
  );

  return (
    <motion.div
      className={promptsClasses}
      variants={containerVariants}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {prompts.length > 1 && (
        <Pips
          count={prompts.length}
          currentIndex={currentIndex}
          small={small}
        />
      )}
      <motion.div variants={containerVariants}>
        <AnimatePresence custom={backwards} mode="wait" initial={false}>
          {prompts.map(
            ({ id, text }) =>
              currentIndex >= 0 &&
              prompts[currentIndex]?.id === id && (
                <Prompt
                  key={id}
                  id={id}
                  text={text}
                  backwards={backwards}
                  small={small}
                />
              ),
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default Prompts;
