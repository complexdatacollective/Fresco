import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { headingVariants } from '~/components/typography/Heading';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { cx } from '~/utils/cva';
import DrawerNode from '../Interfaces/Sociogram/DrawerNode';

type NodeDrawerProps = {
  nodes: NcNode[];
  itemType?: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** When true, drawer is absolutely positioned (for Sociogram canvas overlay). Defaults to false (inline flex). */
  floating?: boolean;
};

const MotionChevron = motion.create(ChevronDown);

export default function NodeDrawer({
  nodes,
  itemType,
  expanded,
  onExpandedChange,
  floating = false,
}: NodeDrawerProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isExpanded = expanded ?? internalExpanded;
  const setIsExpanded = onExpandedChange ?? setInternalExpanded;

  const hasNodes = nodes.length > 0;

  // Suppress scrollbar and fade during layout animations.
  // Detect node count changes synchronously during render so
  // the suppression is active before the browser paints.
  const [isLayoutAnimating, setIsLayoutAnimating] = useState(false);
  const prevNodeCountRef = useRef(nodes.length);

  if (nodes.length !== prevNodeCountRef.current) {
    prevNodeCountRef.current = nodes.length;
    if (nodes.length > 0 && !isLayoutAnimating) {
      setIsLayoutAnimating(true);
    }
  }

  // Safety timeout in case onLayoutAnimationComplete doesn't fire
  // (e.g. no nodes actually moved).
  useEffect(() => {
    if (!isLayoutAnimating) return;
    const timeout = setTimeout(() => setIsLayoutAnimating(false), 500);
    return () => clearTimeout(timeout);
  }, [isLayoutAnimating]);

  const [remeasureKey, setRemeasureKey] = useState(0);

  const handleLayoutAnimationComplete = useCallback(() => {
    setIsLayoutAnimating(false);
    setRemeasureKey((k) => k + 1);
  }, []);

  return (
    <AnimatePresence>
      {hasNodes && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '150%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className={cx(
            'tablet:min-w-sm tablet:w-fit z-10 mx-auto w-full max-w-2xl drop-shadow-xl',
            floating ? 'absolute inset-x-0 bottom-0' : 'shrink-0',
          )}
        >
          {/* Toggle button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cx(
                'bg-surface flex items-center gap-2 rounded-t-lg px-8 py-2 text-sm',
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

          <motion.div
            initial={{
              height: 0,
              opacity: 0,
              marginBottom: 'calc(var(--spacing) * -4)',
            }}
            animate={
              isExpanded
                ? {
                    height: 'auto',
                    opacity: 1,
                    marginBottom: 0,
                    transition: {
                      height: { type: 'spring', stiffness: 300, damping: 24 },
                      marginBottom: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 24,
                      },
                      opacity: { duration: 0.15 },
                    },
                  }
                : {
                    height: 0,
                    opacity: 0,
                    marginBottom: 'calc(var(--spacing) * -4)',
                    transition: {
                      height: { duration: 0.25, ease: [0, 0, 0.2, 1] },
                      marginBottom: {
                        duration: 0.25,
                        ease: [0, 0, 0.2, 1],
                      },
                      opacity: { duration: 0.15 },
                    },
                  }
            }
            className="bg-surface publish-colors overflow-hidden rounded"
          >
            <ScrollArea
              orientation="horizontal"
              fade
              remeasureKey={remeasureKey}
              viewportClassName="flex items-center gap-4 p-4"
            >
              {nodes.map((node) => (
                <DrawerNode
                  key={node[entityPrimaryKeyProperty]}
                  node={node}
                  itemType={itemType}
                  onLayoutAnimationComplete={handleLayoutAnimationComplete}
                />
              ))}
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
