import { AnimatePresence, motion } from 'framer-motion';
import { hash } from 'ohash';
import { useMemo, type ComponentType } from 'react';
import type { ItemType } from '~/lib/dnd/config';
import useDroppable from '~/lib/dnd/useDroppable';
import { cn } from '~/utils/shadcn';

type NodeListProps = {
  items: unknown[];
  ItemComponent: ComponentType;
  accepts: ItemType[];
  allowDrop: boolean;
  onDrop?: (event: DragEvent) => void;
  className?: string;
};

const NodeList = (props: NodeListProps) => {
  const { items, accepts, allowDrop, onDrop, className, ItemComponent } = props;

  const ItemMotionComponent = useMemo(() => motion(ItemComponent), []);

  const { ref, isActive, isValid, isOver } = useDroppable({
    disabled: !allowDrop,
    onDrop: (event) => {
      console.log('dropped', event);
    },
    accepts,
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

          return (
            <ItemMotionComponent
              layout
              initial={{ opacity: 0, y: '20%' }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { delay } }}
              exit={{ opacity: 0, scale: 0 }}
              key={itemHash}
              {...item}
            />
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default NodeList;
