import { type NcNode, type VariableValue } from '@codaco/shared-consts';
import { useSelector } from 'react-redux';
import Node from '~/components/Node';
import { useDragSource } from '~/lib/dnd';
import { useNodeLabel } from '~/lib/interviewer/Interfaces/Anonymisation/useNodeLabel';
import { FAMILY_TREE_CONFIG } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/config';
import { useClickUnlessDragged } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/useClickUnlessDragged';
import { getNodeColorSelector } from '~/lib/interviewer/selectors/session';

/**
 * Icon for the ego (self) node in the family tree.
 * Based on the add-a-person icon (lib/ui/assets/icons/add-a-person-single.svg).
 *
 * Variants:
 * - "platinum": For colored backgrounds - uses platinum shades
 * - "slate": For white/platinum backgrounds - uses slate blue shades
 */
function EgoIcon({
  className,
  variant = 'slate',
}: {
  className?: string;
  variant?: 'platinum' | 'slate';
}) {
  const colors =
    variant === 'platinum'
      ? {
          primary: 'var(--color-platinum)',
          secondary: 'var(--color-platinum-dark)',
        }
      : {
          primary: 'var(--color-slate-blue)',
          secondary: 'var(--color-slate-blue-dark)',
        };

  return (
    <svg
      viewBox="0 0 139.8 167.5"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Head - upper half */}
      <path
        fill={colors.primary}
        d="M69.9,0C46.1,0,26.8,21.4,26.8,47.8c-0.1,11.6,3.8,22.9,11.1,32l64-64C94,6.1,82.6,0,69.9,0z"
      />
      {/* Head - lower half */}
      <path
        fill={colors.secondary}
        d="M37.9,79.8c7.9,9.7,19.3,15.8,32,15.8c23.8,0,43.1-21.4,43.1-47.8c0.1-11.6-3.8-22.9-11.1-32L37.9,79.8z"
      />
      {/* Neck */}
      <path
        fill={colors.secondary}
        d="M94,103.4c-4.1,0-13.6-7.5-10.9-11.3H56.6c2.7,3.8-6.8,11.3-10.9,11.3l24.2,10.8L94,103.4z"
      />
      {/* Body - left side */}
      <path
        fill={colors.primary}
        d="M100.3,105.3l-58.6,58.6C26.5,160,12.3,152.8,0,143c9.2-20.1,27.7-35.5,50.2-41.3c5.9,3.8,12.7,5.8,19.7,5.9c7-0.1,13.8-2.1,19.7-5.9C93.3,102.7,96.8,103.9,100.3,105.3z"
      />
      {/* Body - right side */}
      <path
        fill={colors.secondary}
        d="M139.8,143c-27.6,22-63.9,29.8-98.1,20.9l58.6-58.6C117.8,112.5,131.9,125.9,139.8,143z"
      />
    </svg>
  );
}

export type FamilyTreeNodeType = {
  id: string;
  label: string;
  interviewNetworkId?: string;
  placeholderId?: string;
  isEgo?: boolean;
  x?: number;
  y?: number;
  shape?: 'circle' | 'square';
  selected?: boolean;
  sex?: 'male' | 'female';
  diseases?: Map<string, boolean>;
  fields?: Record<string, VariableValue>;
  readOnly: boolean;
};

type FamilyTreeNodeProps = {
  networkNode?: NcNode;
  placeholderId: string;
  label: string;
  shape: 'circle' | 'square';
  allowDrag: boolean;
  isEgo?: boolean;
  x: number;
  y: number;
  selected?: boolean;
  handleClick?: () => void;
};

/**
 * Renders the node label for nodes linked to the network.
 * Uses the standard useNodeLabel hook for label derivation.
 */
function NetworkNodeLabel({ node }: { node: NcNode }) {
  const label = useNodeLabel(node);
  return <h4>{label}</h4>;
}

export default function FamilyTreeNode(props: FamilyTreeNodeProps) {
  const {
    networkNode,
    placeholderId,
    label,
    allowDrag,
    x,
    y,
    shape,
    isEgo,
    selected,
    handleClick,
  } = props;

  const nodeTypeColor = useSelector(getNodeColorSelector);

  const { handlePointerDown, handlePointerUp, shouldHandleClick } =
    useClickUnlessDragged();

  const nodeColor = () => {
    if (networkNode)
      return {
        '--base': `var(--${nodeTypeColor})`,
        '--dark': `var(--${nodeTypeColor}-dark)`,
      };

    return {
      '--base': `var(--color-platinum)`,
      '--dark': `var(--color-platinum-dark)`,
    };
  };

  const { dragProps } = useDragSource({
    type: 'FAMILY_TREE_NODE',
    metadata: { itemType: 'FAMILY_TREE_NODE', placeholderId: placeholderId },
    announcedName: label,
    disabled: !allowDrag,
  });

  return (
    <div
      className="family-tree-node absolute"
      style={{
        top: y,
        left: x,
        width: FAMILY_TREE_CONFIG.nodeContainerWidth,
        height: FAMILY_TREE_CONFIG.nodeContainerHeight,
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={() => {
        if (shouldHandleClick()) handleClick?.();
      }}
    >
      <div
        className="relative flex flex-col items-center gap-2 text-center"
        {...dragProps}
      >
        <div className="relative shrink-0">
          <Node
            className="shrink-0"
            style={
              {
                width: FAMILY_TREE_CONFIG.nodeWidth,
                height: FAMILY_TREE_CONFIG.nodeHeight,
                ...nodeColor(),
              } as React.CSSProperties
            }
            color="custom"
            label=""
            ariaLabel={isEgo ? 'You' : label || 'Node'}
            shape={shape}
            selected={selected}
          />
          {isEgo && (
            <EgoIcon
              className="pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-1/2"
              variant={networkNode ? 'platinum' : 'slate'}
            />
          )}
        </div>
        {isEgo && (
          <svg
            viewBox="0 0 300 300"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute right-6 bottom-8 block size-30"
          >
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="3"
                markerHeight="6"
                fill="yellow"
              >
                <path d="M 0 0 L 8.5 2 L 2 8.5 z"></path>
              </marker>
            </defs>
            <line
              x1="295"
              y1="295"
              x2="270"
              y2="270"
              stroke="yellow"
              markerEnd="url(#arrow)"
              strokeWidth="20"
            ></line>
          </svg>
        )}
        {/*
          Position anchor would be ideal for this but no FF support:
          https://developer.mozilla.org/en-US/docs/Web/CSS/position-anchor
        */}
        <div className="family-tree-node-label-container bg-cyber-grape/80 m-1 flex flex-col gap-0.5 rounded-md px-2 py-1 text-white">
          {isEgo ? (
            <h4>You</h4>
          ) : networkNode ? (
            <NetworkNodeLabel node={networkNode} />
          ) : (
            <h4>{label}</h4>
          )}
          <h5 className="family-tree-node-label font-normal!">{label}</h5>
        </div>
      </div>
    </div>
  );
}
