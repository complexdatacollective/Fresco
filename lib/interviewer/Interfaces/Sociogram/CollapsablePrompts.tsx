import { type ReactNode, type RefObject } from 'react';
import { MotionSurface } from '~/components/layout/Surface';
import Prompts from '~/lib/interviewer/components/Prompts';

const CollapsablePrompts = (props: {
  dragConstraints: RefObject<HTMLElement | null>;
  children?: ReactNode;
  currentPromptIndex?: number;
}) => {
  const { dragConstraints, children } = props;

  return (
    <MotionSurface
      className="bg-surface/60 absolute right-10 bottom-10 z-10 w-96 cursor-move overflow-hidden border-b-2 shadow-2xl backdrop-blur-md"
      drag
      dragConstraints={dragConstraints}
      elevation="none"
      noContainer
      spacing="sm"
    >
      <Prompts small />
      {children}
    </MotionSurface>
  );
};

export default CollapsablePrompts;
