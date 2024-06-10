import { AnimatePresence, motion } from 'framer-motion';
import { hash } from 'ohash';
import { ForwardRefExoticComponent, useCallback } from 'react';
import draggable from '~/lib/dnd/Draggable';
import { type DraggingItem } from '~/lib/dnd/store';
import useDroppable from '~/lib/dnd/useDroppable';
import { cn } from '~/utils/shadcn';

type NodeListProps = {
  listId: string;
  items: Record<string, unknown>[];
  ItemComponent: ForwardRefExoticComponent<unknown>;
  willAccept: (item: DraggingItem) => boolean;
  allowDrop: boolean;
  onDrop?: (event: DragEvent) => void;
  className?: string;
};

const NodeList = (props: NodeListProps) => {
  const { items, willAccept, allowDrop, onDrop, className, ItemComponent } =
    props;

  const ItemMotionComponent = useCallback(
    () => (props) =>
      draggable(ItemComponent, { type: 'EXISTING_NODE', metaData: props }),
    [],
  );

  const { ref, isActive, isValid, isOver } = useDroppable({
    disabled: !allowDrop,
    onDrop: (event) => {
      console.log('dropped', event);
    },
    willAccept,
  });

  return (
    <motion.div
      className={cn(
        'flex h-full w-full flex-wrap content-start items-start justify-center rounded-[var(--nc-border-radius)] transition-colors duration-500',
        className,
        isOver && !isValid && 'bg-tomato',
        isOver && isValid && 'bg-sea-green/75',
        isValid && !isOver && 'bg-sea-green/25',
      )}
      layout
      ref={ref}
    >
      <AnimatePresence mode="sync">
        {items.map((item, index) => {
          const delay = index * 0.1;

          const itemHash = hash(item);

          return ItemMotionComponent(item);
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default NodeList;
