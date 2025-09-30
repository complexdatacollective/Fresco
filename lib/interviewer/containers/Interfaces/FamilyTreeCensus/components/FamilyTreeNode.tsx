import { useDragSource } from '~/lib/dnd';
import { Node } from '~/lib/ui/components';

export default function FamilyTreeNode(props: {
  label: string;
  shape: 'circle' | 'square';
  allowDrag: boolean;
  isEgo?: boolean;
  x: number;
  y: number;
}) {
  const { label, allowDrag, x, y, shape, isEgo } = props;

  const { dragProps } = useDragSource({
    type: 'node',
    metadata: { itemType: 'FAMILY_TREE_NODE' },
    announcedName: label,
    disabled: !allowDrag,
  });
  return (
    <div className="absolute" style={{ top: y, left: x }}>
      <div
        className="flex h-[150px] w-[150px] flex-col items-center gap-2 text-center"
        {...dragProps}
        data-node-container
      >
        <Node
          color="node-color-seq-1"
          size="xxs"
          label=""
          shape={shape}
          data-node-visual="true"
        />
        {isEgo && (
          <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
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
          <h4>{label}</h4>
          <h5 className="!font-normal">{label}</h5>
        </div>
      </div>
    </div>
  );
}
