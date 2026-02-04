import { type NcNode } from '@codaco/shared-consts';
import { isEqual } from 'es-toolkit';
import { motion } from 'motion/react';
import React, { forwardRef, memo } from 'react';
import { useSelector } from 'react-redux';
import { getNodeColorSelector } from '~/lib/interviewer/selectors/session';
import UINode from '~/lib/ui/components/Node';
import { cn } from '~/utils/shadcn';
import { useNodeLabel } from '../containers/Interfaces/Anonymisation/useNodeLabel';

const Node = memo(
  forwardRef<
    React.ElementRef<typeof UINode>,
    NcNode & React.ComponentProps<typeof UINode>
  >((props: NcNode & React.ComponentProps<typeof UINode>, ref) => {
    const color = useSelector(getNodeColorSelector);
    const label = useNodeLabel(props);

    return (
      <UINode
        color={color}
        {...props}
        className={cn('node', props.className)}
        label={label}
        ref={ref}
      />
    );
  }),
  (prevProps, nextProps) => {
    if (!isEqual(prevProps, nextProps)) {
      return false;
    }

    return true;
  },
);

Node.displayName = 'Node';

export default Node;

export const MotionNode = motion.create(Node);
