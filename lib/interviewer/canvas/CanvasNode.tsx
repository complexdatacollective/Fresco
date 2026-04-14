import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { useCallback, type RefObject } from 'react';
import { useCanvasDrag } from '~/lib/interviewer/canvas/useCanvasDrag';
import {
  useCanvasStore,
  type CanvasStoreApi,
} from '~/lib/interviewer/canvas/useCanvasStore';
import Node from '~/lib/interviewer/components/ConnectedNode';

type CanvasNodeProps = {
  node: NcNode;
  canvasRef: RefObject<HTMLElement | null>;
  store: CanvasStoreApi;
  onDragEnd?: (nodeId: string, position: { x: number; y: number }) => void;
  onSelect?: (nodeId: string) => void;
  selected?: boolean;
  linking?: boolean;
  highlighted?: boolean;
  disabled?: boolean;
  allowRepositioning?: boolean;
  simulation?: {
    moveNode: (nodeId: string, position: { x: number; y: number }) => void;
    releaseNode: (nodeId: string) => void;
  } | null;
};

export default function CanvasNode({
  node,
  canvasRef,
  store,
  onDragEnd,
  onSelect,
  selected = false,
  linking = false,
  highlighted = false,
  disabled = false,
  allowRepositioning = true,
  simulation = null,
}: CanvasNodeProps) {
  const nodeId = node[entityPrimaryKeyProperty];

  const position = useCanvasStore(store, (state) =>
    state.positions.get(nodeId),
  );

  const handleClick = useCallback(() => {
    onSelect?.(nodeId);
  }, [onSelect, nodeId]);

  const { dragProps } = useCanvasDrag({
    nodeId,
    canvasRef,
    store,
    onDragEnd,
    onClick: handleClick,
    disabled: disabled || !allowRepositioning,
    simulation,
  });

  if (!position) return null;

  const { style: dragStyle, ...restDragProps } = dragProps;

  return (
    <Node
      nodeId={nodeId}
      type={node.type}
      selected={selected}
      linking={linking}
      highlighted={highlighted}
      disabled={disabled}
      size="sm"
      className="absolute outline-offset-8!"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        ...dragStyle,
      }}
      {...restDragProps}
    />
  );
}
