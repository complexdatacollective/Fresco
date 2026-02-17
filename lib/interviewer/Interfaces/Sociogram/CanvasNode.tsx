import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { type RefObject, useCallback } from 'react';
import Node from '~/lib/interviewer/components/Node';
import { useCanvasDrag } from './useCanvasDrag';
import { useSociogramStore, type SociogramStoreApi } from './useSociogramStore';

type CanvasNodeProps = {
  node: NcNode;
  canvasRef: RefObject<HTMLElement | null>;
  store: SociogramStoreApi;
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

  const position = useSociogramStore(store, (state) =>
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
    <div
      className="absolute"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: 'translate(-50%, -50%)',
        ...dragStyle,
      }}
      {...restDragProps}
      role="button"
      tabIndex={0}
      aria-label={`${typeof node[entityAttributesProperty].name === 'string' ? node[entityAttributesProperty].name : 'Node'} at position ${Math.round(position.x * 100)}%, ${Math.round(position.y * 100)}%`}
    >
      <Node
        {...node}
        selected={selected}
        linking={linking}
        highlighted={highlighted}
        disabled={disabled}
        size="sm"
      />
    </div>
  );
}
