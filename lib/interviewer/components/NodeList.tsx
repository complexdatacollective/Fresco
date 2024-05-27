import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DragEventHandler,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { v4 } from 'uuid';
import useStore from '~/lib/dnd/store';
import { cn } from '~/utils/shadcn';
import { getCurrentStage } from '../selectors/session';
import createSorter from '../utils/createSorter';
import Node from './Node';

const EnhancedNode = (props) => {
  const setDraggingItem = useStore((state) => state.setDraggingItem);

  const handleDragStart: DragEventHandler<HTMLDivElement> = (event) => {
    setDraggingItem({ id: 'test', type: 'TEST_NODE' });
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd: DragEventHandler<HTMLDivElement> = () => {
    setDraggingItem(null);
  };

  return (
    <div draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
  disableDragNew,
  items: initialItems = [],
  label = () => '',
  itemType = 'NODE',
  className,
  externalData,
  sortOrder = [],
  onItemClick,
  onDrop,
}: {
  listId: string;
  disableDragNew: boolean;
  items: unknown[];
  label: (node: unknown) => string;
  itemType: string;
  accepts: string[];
  className: string;
  stage: { id: string };
  externalData: unknown[];
  sortOrder: string[];
  onItemClick?: (node: unknown) => void;
  onDrop?: (node: unknown) => void;
}) => {
  const stage = useSelector(getCurrentStage);

  const [items] = useState(createSorter(sortOrder)(initialItems));
  const [stagger] = useState(true);
  const instanceId = useRef(v4());

  // isActive
  // isValid
  // isOver

  const [isActive, setIsActive] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const draggingItem = useStore((state) => state.draggingItem);

  useEffect(() => {
    if (draggingItem) {
    }
  }, [draggingItem]);

  return (
    <motion.div
      className={cn(
        'flex h-full w-full flex-wrap content-start items-start justify-center',
        className,
        isOver && 'bg-[var(--nc-light-background)]',
      )}
      layout
      onDragEnter={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsOver(false);
      }}
      onDrop={(event) => {
        console.log('drop', event);
        setIsOver(false);
        onDrop?.(event);
      }}
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
