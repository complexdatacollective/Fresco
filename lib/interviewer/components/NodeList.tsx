import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { noop } from 'es-toolkit';
import { find } from 'es-toolkit/compat';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { isEqual } from 'ohash';
import { memo, type ComponentProps, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { ScrollArea } from '~/components/ui/ScrollArea';
import {
  useDndStore,
  useDragSource,
  useDropTarget,
  type DndStore,
} from '~/lib/dnd';
import { type DropCallback } from '~/lib/dnd/types';
import { cx } from '~/utils/cva';
import { getCurrentStageId } from '../selectors/session';
import { MotionNode } from './Node';

type DraggableMotionNodeProps = ComponentProps<typeof MotionNode> & {
  node: NcNode;
  itemType: string;
  allowDrag: boolean;
  nodeSize?: 'sm' | 'md' | 'lg';
  [key: string]: unknown;
};

// DraggableMotionNode component that wraps MotionNode with drag functionality
const DraggableMotionNode = memo(
  ({
    node,
    itemType,
    allowDrag,
    onClick: _onClick,
    nodeSize,
    ...nodeProps
  }: DraggableMotionNodeProps & { onClick?: () => void }) => {
    const { dragProps } = useDragSource({
      type: 'node',
      metadata: { ...node, itemType },
      announcedName: `Node ${node.type}`,
      disabled: !allowDrag,
    });

    return (
      <MotionNode {...node} {...nodeProps} {...dragProps} size={nodeSize} />
    );
  },
);

DraggableMotionNode.displayName = 'DraggableMotionNode';

export const NodeTransition = ({
  children,
  delay,
  exit = false,
}: {
  children: ReactNode;
  delay: number;
  exit?: boolean;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: '20%' }}
    animate={{ opacity: 1, y: 0, scale: 1, transition: { delay } }}
    exit={{ opacity: 0, scale: 0, transition: { duration: exit ? 0.4 : 0 } }}
  >
    {children}
  </motion.div>
);

export const nodeListVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      delayChildren: 0.25,
      staggerChildren: 0.05,
    },
  },
  exit: { opacity: 0 },
};

const nodeVariants = {
  initial: { opacity: 0, y: '-20%', scale: 0 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

type NodeListProps = {
  disableDragNew?: boolean;
  items?: NcNode[];
  itemType?: string;
  hoverColor?: string;
  onItemClick?: (node: NcNode) => void;
  id?: string;
  accepts?: string[];
  onDrop?: DropCallback;
  nodeSize?: 'sm' | 'md' | 'lg';
  className?: string;
};

const NodeList = memo(
  ({
    disableDragNew,
    items = [],
    itemType = 'NODE',
    hoverColor: _hoverColor,
    onItemClick = () => undefined,
    id,
    accepts = ['node'],
    onDrop = noop,
    nodeSize = 'md',
    className,
  }: NodeListProps) => {
    const stageId = useSelector(getCurrentStageId);

    // Use new DND hooks
    const { dropProps, isOver, willAccept } = useDropTarget({
      id: id ?? 'node-list',
      accepts,
      announcedName: 'Node list',
      onDrop,
    });

    const dragItem = useDndStore((state: DndStore) => state.dragItem);
    const meta = (dragItem?.metadata as NcNode) ?? ({} as NcNode);

    const isSource = !!find(items, [
      entityPrimaryKeyProperty,
      meta[entityPrimaryKeyProperty] ?? null,
    ]);

    const isValidTarget = !isSource && willAccept;
    const isHovering = isValidTarget && isOver;

    const classNames = cx(
      'flex h-full shrink-0 grow basis-full flex-col rounded transition-colors duration-300',
      // Fix: Empty NodeLists need minimum dimensions for proper drop zone bounds
      items.length === 0 && 'min-w-[300px]',
      willAccept && 'bg-accent',
      isHovering && 'bg-success',
      className,
    );

    const itemsClassName = cx(
      'flex flex-row flex-wrap content-start items-start justify-start gap-4',
    );

    return (
      <LayoutGroup id={id}>
        <motion.div
          {...dropProps}
          className={classNames}
          variants={nodeListVariants}
          layout
          key="node-list"
        >
          <ScrollArea>
            <motion.div className={itemsClassName} layout role="listbox">
              <AnimatePresence>
                {items.map((node: NcNode) => {
                  const isDraggable =
                    !disableDragNew || node.stageId === stageId; // Always allow dragging if the node was created on this stage
                  return (
                    <motion.div
                      key={node[entityPrimaryKeyProperty]}
                      variants={nodeVariants}
                    >
                      <DraggableMotionNode
                        node={node}
                        layout
                        itemType={itemType}
                        allowDrag={isDraggable}
                        onClick={() => onItemClick(node)}
                        nodeSize={nodeSize}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </ScrollArea>
        </motion.div>
      </LayoutGroup>
    );
  },
  (prevProps: NodeListProps, nextProps: NodeListProps) => {
    // only re-render if items change, or click handler changes
    if (prevProps.onItemClick !== nextProps.onItemClick) {
      return false;
    }
    if (!isEqual(prevProps.items, nextProps.items)) {
      return false;
    }

    return true;
  },
);

NodeList.displayName = 'NodeList';

export default NodeList;
