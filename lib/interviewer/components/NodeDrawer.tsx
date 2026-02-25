import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { headingVariants } from '~/components/typography/Heading';
import { cx } from '~/utils/cva';
import DrawerNode from '../Interfaces/Sociogram/DrawerNode';

type NodeDrawerProps = {
  nodes: NcNode[];
  itemType?: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

const MotionChevron = motion.create(ChevronDown);

export default function NodeDrawer({
  nodes,
  itemType,
  expanded,
  onExpandedChange,
}: NodeDrawerProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isExpanded = expanded ?? internalExpanded;
  const setIsExpanded = onExpandedChange ?? setInternalExpanded;

  if (nodes.length === 0) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 mx-auto w-fit max-w-2xl min-w-sm drop-shadow-[0_-2px_16px_rgba(0,0,0,0.4)]">
      {/* Toggle button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cx(
            'bg-surface/80 flex items-center gap-2 rounded-t-lg px-8 py-2 text-sm backdrop-blur-md',
            headingVariants({ level: 'label' }),
          )}
          aria-label={isExpanded ? 'Collapse drawer' : 'Expand drawer'}
          aria-expanded={isExpanded}
        >
          <MotionChevron
            className="size-[1em]"
            animate={{ rotate: isExpanded ? 0 : 180 }}
          />
          {nodes.length} unplaced
        </button>
      </div>

      {/* Drawer content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layout
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: {
                height: { type: 'spring', stiffness: 300, damping: 24 },
                opacity: { duration: 0.15 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.25, ease: [0, 0, 0.2, 1] },
                opacity: { duration: 0.15 },
              },
            }}
            className="bg-surface/80 overflow-hidden rounded backdrop-blur-md"
          >
            <motion.div
              layout
              className="flex items-center justify-center gap-4 overflow-x-auto p-4"
            >
              {nodes.map((node) => (
                <DrawerNode
                  key={node[entityPrimaryKeyProperty]}
                  node={node}
                  itemType={itemType}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
