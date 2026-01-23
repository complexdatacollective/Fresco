import cx from 'classnames';
import { motion } from 'motion/react';
import { Fragment } from 'react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';

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
};

/**
 * Renders a single prompt.
 */
const Prompt = ({ id, text, backwards = false }: PromptProps) => {
  const classes = cx('prompt');

  return (
    <motion.div
      title={text}
      key={id}
      custom={backwards}
      variants={variants}
      className={classes}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: 'spring', stiffness: 600, damping: 35 },
        opacity: { duration: 0.2 },
      }}
    >
      <Heading level="h2" margin="none" className="font-normal">
        <RenderMarkdown render={<Fragment />}>{text}</RenderMarkdown>
      </Heading>
    </motion.div>
  );
};

export default withNoSSRWrapper(Prompt);
