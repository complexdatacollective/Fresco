import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcNode,
} from '@codaco/shared-consts';
import { clamp } from 'es-toolkit';
import {
  type ReactNode,
  type RefCallback,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useDropTarget } from '~/lib/dnd';
import CanvasNode from '~/lib/interviewer/canvas/CanvasNode';
import EdgeLayer from '~/lib/interviewer/canvas/EdgeLayer';
import { type CanvasStoreApi } from '~/lib/interviewer/canvas/useCanvasStore';

type CanvasProps = {
  background: ReactNode;
  underlays?: ReactNode;
  foreground?: ReactNode;
  nodes: NcNode[];
  edges: NcEdge[];
  store: CanvasStoreApi;
  selectedNodeId: string | null;
  highlightAttribute?: string;
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
  underlays,
  foreground,
  nodes,
  edges,
  store,
  selectedNodeId,
  highlightAttribute,
  onNodeSelect,
  onNodeDragEnd,
  onDrop,
  allowRepositioning = true,
  disabled = false,
  simulation = null,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);

  // Track canvas dimensions so the store can compute boundary margins
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      store.getState().setCanvasDimensions({ width, height });
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [store]);

  // Track pointer position via a document-level listener.
  // React's onPointerMove on the canvas div does NOT fire during DnD drags
  // because useDragSource calls setPointerCapture on the dragged element,
  // redirecting all pointer events away from the canvas.
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    };
    document.addEventListener('pointermove', handler);
    return () => document.removeEventListener('pointermove', handler);
  }, []);

  const handleDrop = useCallback(
    (metadata?: Record<string, unknown>) => {
      if (!metadata?.nodeId) return;
      const nodeId = metadata.nodeId as string;

      let position = { x: 0.5, y: 0.5 };
      const canvas = canvasRef.current;
      const pointer = lastPointerPosRef.current;

      if (canvas && pointer) {
        const rect = canvas.getBoundingClientRect();
        position = {
          x: clamp((pointer.x - rect.left) / rect.width, 0, 1),
          y: clamp((pointer.y - rect.top) / rect.height, 0, 1),
        };
      }

      onDrop?.(nodeId, position);
    },
    [onDrop],
  );

  const { dropProps } = useDropTarget({
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
      className="relative size-full overflow-hidden"
      aria-label={dropProps['aria-label']}
      data-zone-id={dropProps['data-zone-id']}
      tabIndex={dropProps.tabIndex}
    >
      {/* Background layer */}
      <div className="absolute inset-0 flex items-center justify-center">
        {background}
      </div>

      {/* Underlays (convex hulls) */}
      {underlays}

      {/* Edge layer */}
      <EdgeLayer edges={edges} store={store} />

      {/* Nodes */}
      {nodes.map((node) => {
        const nodeId = node[entityPrimaryKeyProperty];
        const highlighted = highlightAttribute
          ? !!node[entityAttributesProperty][highlightAttribute]
          : false;
        return (
          <CanvasNode
            key={nodeId}
            node={node}
            canvasRef={canvasRef}
            store={store}
            onDragEnd={onNodeDragEnd}
            onSelect={onNodeSelect}
            selected={false}
            linking={selectedNodeId === nodeId}
            highlighted={highlighted}
            disabled={disabled}
            allowRepositioning={allowRepositioning}
            simulation={simulation}
          />
        );
      })}

      {/* Foreground (annotations/drawing) */}
      {foreground}
    </div>
  );
}
