import { type RefObject } from 'react';
import { MotionSurface } from '~/components/layout/Surface';
import Prompts from '~/lib/interviewer/components/Prompts';

const CollapsablePrompts = (props: { dragConstraints: RefObject<null> }) => {
  const { dragConstraints } = props;

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
    </MotionSurface>
  );
};

export default CollapsablePrompts;
