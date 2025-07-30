import classNames from 'classnames';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

type UINodeProps = {
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

const FamilyTreeNode = forwardRef<HTMLDivElement, UINodeProps & { shape?: string, xPos: number, yPos: number }>((props, ref) => {
  const {
    label = 'Node',
    color = 'node-color-seq-1',
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
  const classes = classNames('node',
    shape === 'triangle' ? 'triangle' : 'circle', {
    'node--inactive': inactive,
    'node--selected': selected,
    'node--linking': linking,
    [`node--${selectedColor}`]: selected && selectedColor,
  });

  const labelClasses = () => {
    const labelLength = label.length;
    return `node__label-text len-${labelLength}`;
  };

  const nodeBaseColor = `var(--nc-${color})`;
  const nodeFlashColor = `var(--nc-${color}--dark)`;

  const labelWithEllipsis =
    label.length < 22 ? label : `${label.substring(0, 18)}\u{AD}...`; // Add ellipsis for really long labels

  const alterStrokeWidth = 3;

  const nodeStyles = {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    display: 'block',
    top: yPos,
    left: xPos,
  };

  return (
    <div className={classes} onClick={() => handleClick?.()} ref={ref} style={nodeStyles}>
      {(() => {
        switch (shape) {
          case "triangle":
            return (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100">
                <polygon
                  points="50, 18.397 95, 95 5, 95"
                  className="node__node-shadow"
                  fill={nodeBaseColor}
                  opacity="0.25"
                />
                <line x1="50" y1="13.397" x2="95" y2="90" stroke={nodeBaseColor} strokeLinecap="round" strokeWidth={alterStrokeWidth} />
                <line x1="95" y1="90" x2="5" y2="90" stroke={nodeBaseColor} strokeLinecap="round" strokeWidth={alterStrokeWidth} />
                <line x1="5" y1="90" x2="50" y2="13.397" stroke={nodeBaseColor} strokeLinecap="round" strokeWidth={alterStrokeWidth} />
              </svg>
            )
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
                <circle cx="250" cy="250" r="250" className="node__node-outer-trim" />
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
            )
        }
      })()}
      {loading && (
        <div className="absolute flex h-full w-full items-center justify-center">
          <Loader2 className="animate-spin" size={24} />
        </div>
      )}
      {!loading && (
        <div className="node__label">
          <div className={labelClasses()}>{labelWithEllipsis}</div>
        </div>
      )}
    </div>
  );
});

FamilyTreeNode.displayName = 'FamilyTreeNode';

export default FamilyTreeNode;
