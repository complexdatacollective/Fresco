'use client';

import { motion } from 'motion/react';
import { Fragment } from 'react';
import Heading from '@codaco/fresco-ui/typography/Heading';
import { RenderMarkdown } from '@codaco/fresco-ui/RenderMarkdown';
import { cx } from '@codaco/fresco-ui/utils/cva';

const variants = {
  enter: (backwards: boolean) => ({
    x: backwards ? '-25%' : '25%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (backwards: boolean) => ({
    x: backwards ? '25%' : '-25%',
    opacity: 0,
  }),
};

type PromptProps = {
  id: string;
  text: string;
  backwards?: boolean;
  small?: boolean;
};

/**
 * Renders a single prompt with animation support.
 */
const Prompt = ({ id, text, backwards = false, small }: PromptProps) => {
  const promptClasses = cx(
    'font-heading pb-[0.1em] text-center text-2xl',
  );

  return (
    <motion.div
      data-testid="prompt"
      title={text}
      key={id}
      custom={backwards}
      variants={variants}
      className={promptClasses}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: 'spring', stiffness: 600, damping: 35 },
        opacity: { duration: 0.2 },
      }}
    >
      <Heading
        level={small ? 'h4' : 'h2'}
        margin="none"
        className="font-normal"
      >
        <RenderMarkdown render={<Fragment />}>{text}</RenderMarkdown>
      </Heading>
    </motion.div>
  );
};

export default Prompt;
