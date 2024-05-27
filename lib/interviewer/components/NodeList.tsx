import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { v4 } from 'uuid';
import { cn } from '~/utils/shadcn';
import { getCurrentStage } from '../selectors/session';
import createSorter from '../utils/createSorter';
import Node from './Node';

const EnhancedNode = (props) => {
  const { attributes, listeners, setNodeRef, transform, active } = useDraggable(
    {
      id: props[entityPrimaryKeyProperty],
      disabled: !props.allowDrag,
      data: {
        type: 'NODE',
      },
    },
  );
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div {...attributes} {...listeners} style={style} ref={setNodeRef}>
      <Node {...props} />
    </div>
  );
};

export const NodeTransition = ({
  children,
  delay,
}: {
  children: ReactNode;
  delay: number;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: '20%' }}
    animate={{ opacity: 1, y: 0, scale: 1, transition: { delay } }}
    exit={{ opacity: 0, scale: 0 }}
  >
    {children}
  </motion.div>
);

const NodeList = ({
  listId,
  disableDragNew,
  items: initialItems = [],
  label = () => '',
  itemType = 'NODE',
  accepts = ['NODE'],
  className,
  externalData,
  sortOrder = [],
  onItemClick,
}: {
  listId: string;
  disableDragNew: boolean;
  items: unknown[];
  label: (node: unknown) => string;
  itemType: string;
  accepts: string[];
  className: string;
  stage: { id: string };
  externalData: any;
  sortOrder: string[];
  onItemClick?: (node: unknown) => void;
}) => {
  const stage = useSelector(getCurrentStage);

  const [items] = useState(createSorter(sortOrder)(initialItems));
  const [stagger] = useState(true);
  const instanceId = useRef(v4());

  const { isOver, setNodeRef } = useDroppable({
    id: listId,
    data: {
      accepts,
    },
  });

  return (
    <motion.div
      className={cn(
        'flex h-full flex-wrap content-start items-start justify-center',
        className,
        isOver && 'bg-[var(--nc-light-background]',
      )}
      layout
      ref={setNodeRef}
    >
      <AnimatePresence mode="sync">
        {items.map((node, index) => {
          const isDraggable =
            !(externalData && disableDragNew) &&
            !(disableDragNew && node.stageId !== stage.id);
          return (
            <NodeTransition
              key={`${instanceId.current}-${node[entityPrimaryKeyProperty]}`}
              delay={stagger ? index * 0.05 : 0}
            >
              <EnhancedNode
                allowDrag={isDraggable}
                label={`${label(node)}`}
                itemType={itemType}
                onClick={() => onItemClick?.(node)}
                {...node}
              />
            </NodeTransition>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default NodeList;
