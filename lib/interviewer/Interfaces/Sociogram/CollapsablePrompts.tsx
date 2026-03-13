import { type ReactNode, type RefObject } from 'react';
import { MotionSurface } from '~/components/layout/Surface';
import Prompts from '~/lib/interviewer/components/Prompts';
import { cx } from '~/utils/cva';

const CollapsablePrompts = (props: {
  dragConstraints: RefObject<HTMLElement | null>;
  children?: ReactNode;
  currentPromptIndex?: number;
  className?: string;
}) => {
  const { dragConstraints, children, className } = props;

  return (
    <MotionSurface
      className={cx(
        'bg-surface/60 absolute top-4 right-4 z-10 flex w-fit max-w-sm cursor-move flex-col items-center gap-4 overflow-hidden border-b-2 shadow-2xl backdrop-blur-md',
        className,
      )}
      layout
      drag
      dragConstraints={dragConstraints}
      elevation="none"
      noContainer
      spacing="sm"
      variants={{
        initial: {
          scale: 0.4,
          opacity: 0,
        },
        animate: {
          scale: 1,
          opacity: 1,
        },
        exit: {
          scale: 0,
          opacity: 0,
        },
      }}
    >
      <Prompts small />
      {children}
    </MotionSurface>
  );
};

export default CollapsablePrompts;
