import { type NcNode } from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { isEqual } from 'ohash';
import { memo, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import {
  useDndStore,
  useDragSource,
  useDropTarget,
  type DndStore,
} from '~/lib/dnd';
import { cn } from '~/utils/shadcn';
import {
  MotionFamilyTreeNode,
  PlaceholderNodeProps,
} from '../containers/Interfaces/FamilyTreeCensus/FamilyTreeNode';
import { getCurrentStageId } from '../selectors/session';

type DraggableMotionNodeProps = {
  node: PlaceholderNodeProps;
  itemType: string;
  allowDrag: boolean;
  [key: string]: unknown;
};

// DraggableMotionNode component that wraps MotionNode with drag functionality
const DraggableFamilyTreeMotionNode = memo(
  ({ node, itemType, allowDrag, ...nodeProps }: DraggableMotionNodeProps) => {
    const { dragProps } = useDragSource({
      type: 'node',
      metadata: { ...node, itemType },
      announcedName: `Node ${node.type}`,
      disabled: !allowDrag,
    });

    return (
      <div {...dragProps}>
        <MotionFamilyTreeNode {...node} {...nodeProps} />
      </div>
    );
  },
);

DraggableFamilyTreeMotionNode.displayName = 'DraggableFamilyTreeMotionNode';

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

type NodeListProps = {
  items?: PlaceholderNodeProps[];
  itemType?: string;
  hoverColor?: string;
  onItemClick?: (node: NcNode) => void;
  id?: string;
  accepts?: (data: unknown) => boolean;
  onDrop?: (data: { meta: unknown }) => void;
};

const FamilyTreePlaceholderNodeList = memo(
  ({
    items = [],
    itemType = 'NODE',
    hoverColor,
    onItemClick = () => undefined,
    id,
    accepts: _accepts,
    onDrop,
  }: NodeListProps) => {
    const stageId = useSelector(getCurrentStageId);

    // Use new DND hooks
    const { dropProps, isOver, willAccept } = useDropTarget({
      id: id ?? 'node-list',
      accepts: ['node'],
      announcedName: 'Node list',
      onDrop: (metadata) => {
        if (onDrop) {
          onDrop({ meta: metadata });
        }
      },
    });

    const dragItem = useDndStore((state: DndStore) => state.dragItem);
    const meta =
      (dragItem?.metadata as PlaceholderNodeProps) ??
      ({} as PlaceholderNodeProps);

    const isValidTarget = willAccept;
    const isHovering = isValidTarget && isOver;

    const classNames = cn(
      'flex flex-wrap justify-center min-h-full w-full transition-background duration-300 content-start rounded-md',
      // Fix: Empty NodeLists need minimum dimensions for proper drop zone bounds
      items.length === 0 && 'min-h-[800px] min-w-[300px]',
      willAccept && 'bg-[var(--nc-node-list-action-bg)]',
      isHovering && (hoverColor ? `bg-[var(${hoverColor})]` : 'bg-accent'),
    );

    return (
      <motion.div
        {...dropProps}
        className={classNames}
        variants={nodeListVariants}
        layout
        key="node-list"
      >
        <AnimatePresence mode="sync">
          {items.map((node: PlaceholderNodeProps) => {
            const isDraggable = !node.unDeletable;
            return (
              <motion.div key={node.id} className="draggable-family-tree-node">
                <DraggableFamilyTreeMotionNode
                  node={node}
                  itemType={itemType}
                  allowDrag={isDraggable}
                  layout
                  onClick={() => onItemClick(node)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
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

FamilyTreePlaceholderNodeList.displayName = 'FamilyTreePlaceholderNodeList';

// export default scrollable(FamilyTreePlaceholderNodeList);
export default FamilyTreePlaceholderNodeList;
