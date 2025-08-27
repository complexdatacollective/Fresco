import classNames from 'classnames';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

type UINodeProps = {
  isEgo: boolean;
  color?: string;
  inactive?: boolean;
  label?: string;
  selected?: boolean;
  selectedColor?: string;
  linking?: boolean;
  loading?: boolean;
  handleClick?: () => void;
};

/**
 * Renders a Node.
 */

const FamilyTreeNode = forwardRef<
  HTMLDivElement,
  UINodeProps & { shape?: string; xPos: number; yPos: number }
>((props, ref) => {
  const {
    isEgo,
    label = 'Node',
    color = 'neon-coral',
    shape = 'circle',
    xPos = 0,
    yPos = 0,
    inactive = false,
    selected = false,
    selectedColor = '',
    linking = false,
    handleClick,
    loading = false,
  } = props;
  const classes = classNames('node', shape === 'square' ? 'square' : 'circle', {
    'node--inactive': inactive,
    'node--selected': selected,
    'node--linking': linking,
    [`node--${selectedColor}`]: selected && selectedColor,
  });

  const labelClasses = () => {
    const labelLength = label.length;
    return `node__label-text len-${labelLength}`;
  };

  const nodeBaseColor = `var(--color-${color})`;
  const nodeFlashColor = `var(--color-${color}--dark)`;

  const labelWithEllipsis =
    label.length < 22 ? label : `${label.substring(0, 18)}\u{AD}...`; // Add ellipsis for really long labels

  return (
    <div
      className={classes}
      onClick={() => handleClick?.()}
      ref={ref}
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        display: 'block',
        fontSize: '96px',
        top: yPos,
        left: xPos,
      }}
    >
      {(() => {
        switch (shape) {
          case 'square':
            return (
              <svg
                viewBox="0 0 500 500"
                xmlns="http://www.w3.org/2000/svg"
                className="node__node"
                preserveAspectRatio="xMidYMid meet"
              >
                <rect
                  x="50"
                  y="70"
                  width="400"
                  height="400"
                  rx="16"
                  className="node__node-shadow"
                  opacity="0.25"
                />
                <rect
                  x="50"
                  y="50"
                  width="500"
                  height="500"
                  rx="16"
                  className="node__node-outer-trim"
                />
                <rect
                  x="50"
                  y="50"
                  width="400"
                  height="400"
                  rx="16"
                  fill={nodeBaseColor}
                  className="node__node-base"
                />
                <path
                  d="M54, 50 L446,446 L446,50 Z"
                  fill={nodeFlashColor}
                  className="node__node-flash"
                />
                <rect
                  x="50"
                  y="50"
                  width="400"
                  height="400"
                  className="node__node-trim"
                />
              </svg>
            );
          default:
            return (
              <svg
                viewBox="0 0 500 500"
                xmlns="http://www.w3.org/2000/svg"
                className="node__node"
                preserveAspectRatio="xMidYMid meet"
              >
                <circle
                  cx="250"
                  cy="270"
                  r="200"
                  className="node__node-shadow"
                  opacity="0.25"
                />
                <circle
                  cx="250"
                  cy="250"
                  r="250"
                  className="node__node-outer-trim"
                />
                <circle
                  cx="250"
                  cy="250"
                  r="200"
                  fill={nodeBaseColor}
                  className="node__node-base"
                />
                <path
                  d="m50,250 a1,1 0 0,0 400,0"
                  fill={nodeFlashColor}
                  className="node__node-flash"
                  transform="rotate(-35 250 250)"
                />
                <circle cx="250" cy="250" r="200" className="node__node-trim" />
              </svg>
            );
        }
      })()}
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
            marker-end="url(#arrow)"
            stroke-width="20"
          ></line>
        </svg>
      )}
      {loading && (
        <div className="absolute flex h-full w-full items-center justify-center">
          <Loader2 className="animate-spin" size={24} />
        </div>
      )}
      {!loading && (
        <div
          className="node__label"
          style={{ top: '100%', padding: '0', height: 'fit-content' }}
        >
          <div className={labelClasses()} style={{ alignItems: 'start' }}>
            {labelWithEllipsis}
          </div>
        </div>
      )}
    </div>
  );
});

FamilyTreeNode.displayName = 'FamilyTreeNode';

export default FamilyTreeNode;
