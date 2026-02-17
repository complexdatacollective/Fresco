import {
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcNode,
} from '@codaco/shared-consts';
import { type RefCallback, type ReactNode, useCallback, useRef } from 'react';
import { useDropTarget } from '~/lib/dnd';
import { cx } from '~/utils/cva';
import CanvasNode from './CanvasNode';
import EdgeLayer from './EdgeLayer';
import { type SociogramStoreApi } from './useSociogramStore';

type CanvasProps = {
  background: ReactNode;
  nodes: NcNode[];
  edges: NcEdge[];
  store: SociogramStoreApi;
  selectedNodeId: string | null;
  onNodeSelect?: (nodeId: string) => void;
  onNodeDragEnd?: (nodeId: string, position: { x: number; y: number }) => void;
  onDrop?: (nodeId: string, position: { x: number; y: number }) => void;
  allowRepositioning?: boolean;
  disabled?: boolean;
  simulation?: {
    moveNode: (nodeId: string, position: { x: number; y: number }) => void;
    releaseNode: (nodeId: string) => void;
  } | null;
};

export default function Canvas({
  background,
  nodes,
  edges,
  store,
  selectedNodeId,
  onNodeSelect,
  onNodeDragEnd,
  onDrop,
  allowRepositioning = true,
  disabled = false,
  simulation = null,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDrop = useCallback(
    (metadata?: Record<string, unknown>) => {
      if (!metadata?.nodeId) return;
      const nodeId = metadata.nodeId as string;

      // Place at center; user can reposition after placement
      const position = { x: 0.5, y: 0.5 };
      onDrop?.(nodeId, position);
    },
    [onDrop],
  );

  const { dropProps, isOver, willAccept } = useDropTarget({
    id: 'sociogram-canvas',
    accepts: ['UNPOSITIONED_NODE'],
    announcedName: 'Sociogram Canvas',
    onDrop: handleDrop,
    focusBehaviorOnDrop: 'follow-item',
    disabled,
  });

  // Extract the stable ref function to avoid recreating merged ref on every render
  const dropRef = dropProps.ref;
  const mergedRef: RefCallback<HTMLDivElement> = useCallback(
    (el) => {
      canvasRef.current = el;
      dropRef(el);
    },
    [dropRef],
  );

  return (
    <div
      ref={mergedRef}
      className={cx(
        'relative size-full overflow-hidden',
        isOver && willAccept && 'ring-primary/50 ring-4 ring-inset',
      )}
      aria-dropeffect={dropProps['aria-dropeffect']}
      aria-label={dropProps['aria-label']}
      data-zone-id={dropProps['data-zone-id']}
      tabIndex={dropProps.tabIndex}
    >
      {/* Background layer */}
      <div className="absolute inset-0 flex items-center justify-center">
        {background}
      </div>

      {/* Edge layer */}
      <EdgeLayer edges={edges} store={store} />

      {/* Nodes */}
      {nodes.map((node) => {
        const nodeId = node[entityPrimaryKeyProperty];
        return (
          <CanvasNode
            key={nodeId}
            node={node}
            canvasRef={canvasRef}
            store={store}
            onDragEnd={onNodeDragEnd}
            onSelect={onNodeSelect}
            selected={selectedNodeId === nodeId}
            linking={selectedNodeId !== null && selectedNodeId !== nodeId}
            disabled={disabled}
            allowRepositioning={allowRepositioning}
            simulation={simulation}
          />
        );
      })}
    </div>
  );
}
