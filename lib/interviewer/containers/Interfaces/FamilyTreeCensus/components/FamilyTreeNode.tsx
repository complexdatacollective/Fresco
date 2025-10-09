import { useSelector } from 'react-redux';
import { useDragSource } from '~/lib/dnd';
import { getNodeColorSelector } from '~/lib/interviewer/selectors/session';
import { Node } from '~/lib/ui/components';
import { FAMILY_TREE_CONFIG } from '../config';

export default function FamilyTreeNode(props: {
  interviewNetworkId?: string;
  placeholderId: string;
  name?: string;
  label: string;
  shape: 'circle' | 'square';
  allowDrag: boolean;
  isEgo?: boolean;
  x: number;
  y: number;
  handleClick?: () => void;
}) {
  const {
    placeholderId,
    name,
    label,
    allowDrag,
    x,
    y,
    shape,
    isEgo,
    interviewNetworkId,
    handleClick,
  } = props;
  const nodeTypeColor = useSelector(getNodeColorSelector);

  const nodeColor = () => {
    if (isEgo || interviewNetworkId)
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
    type: 'node',
    metadata: { itemType: 'FAMILY_TREE_NODE', placeholderId: placeholderId },
    announcedName: label,
    disabled: !allowDrag,
  });
  return (
    <div
      className="absolute"
      style={{
        top: y,
        left: x,
        width: FAMILY_TREE_CONFIG.nodeContainerWidth,
        height: FAMILY_TREE_CONFIG.nodeContainerHeight,
      }}
      onClick={() => {
        handleClick?.();
      }}
    >
      <div
        className="relative flex flex-col items-center gap-2 text-center"
        {...dragProps}
      >
        <Node
          className="shrink-0"
          style={{
            width: FAMILY_TREE_CONFIG.nodeWidth,
            height: FAMILY_TREE_CONFIG.nodeHeight,
            ...nodeColor(),
          }}
          color="custom"
          label={isEgo ? `You` : ''}
          shape={shape}
        />
        {isEgo && (
          <svg
            viewBox="0 0 300 300"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute right-6 bottom-8 block h-30 w-30"
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
        <div className="flex flex-col gap-0.5 text-white">
          <h4>{name ?? label}</h4>
          <h5 className="!font-normal">{label}</h5>
        </div>
      </div>
    </div>
  );
}
