import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import useDroppable from '~/lib/dnd/useDroppable';
import { cn } from '~/utils/shadcn';

type NodeListProps = {
  items: unknown[];
  ItemComponent: React.ComponentType<unknown>;
  itemType: string;
  accepts: string[];
  allowDrop: boolean;
  onDrop?: (event: DragEvent) => void;
  className?: string;
};

const NodeList = (props: NodeListProps) => {
  const {
    items,
    itemType,
    accepts,
    allowDrop,
    onDrop,
    className,
    ItemComponent,
  } = props;

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
        'flex h-full w-full flex-wrap content-start items-start justify-center rounded-[var(--nc-border-radius)]',
        className,
        isOver && 'opacity-1',
        isActive && 'bg-cerulean-blue opacity-25',
        isValid && 'bg-sea-green opacity-25',
      )}
      layout
      ref={ref}
    >
      <AnimatePresence mode="sync">
        {items.map((item, index) => {
          const delay = index * 0.1;

          // return <ItemComponent key={index} {...item} />;

          return (
            <ItemMotionComponent
              layout
              initial={{ opacity: 0, y: '20%' }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { delay } }}
              exit={{ opacity: 0, scale: 0 }}
              key={index}
              {...item}
            />
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default NodeList;
