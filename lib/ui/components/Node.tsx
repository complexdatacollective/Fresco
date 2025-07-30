import classNames from 'classnames';
import { Loader2 } from 'lucide-react';
import { ComponentType, SVGProps, forwardRef } from 'react';

type ShapeComponent = ComponentType<SVGProps<SVGElement>>;

const DefaultCircle: ShapeComponent = (props) => (
  <circle cx="250" cy="250" r="200" {...props} />
);

export const Rectangle: ShapeComponent = (props) => (
  <rect x="100" y="100" width="300" height="300" rx="20" ry="20" {...props} />
);

type UINodeProps = {
  color?: string;
  inactive?: boolean;
  label?: string;
  selected?: boolean;
  selectedColor?: string;
  linking?: boolean;
  loading?: boolean;
  handleClick?: () => void;
  shape?: ShapeComponent;
};

/**
 * Renders a Node.
 */

const Node = forwardRef<HTMLDivElement, UINodeProps>((props, ref) => {
  const {
    label = 'Node',
    color = 'node-color-seq-1',
    inactive = false,
    selected = false,
    selectedColor = '',
    linking = false,
    handleClick,
    loading = false,
    shape = DefaultCircle,
  } = props;

  const Shape = props.shape ?? DefaultCircle;

  const classes = classNames('node', {
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

  return (
    <div className={classes} onClick={() => handleClick?.()} ref={ref}>
      <svg
        viewBox="0 0 500 500"
        xmlns="http://www.w3.org/2000/svg"
        className="node__node"
        preserveAspectRatio="xMidYMid meet"
      >
        <Shape
          className="node__node-shadow"
          opacity="0.25"
          fill={nodeBaseColor}
        />
        <Shape
          className="node__node-outer-trim"
          fill="none"
          stroke="black"
          strokeWidth="4"
        />
        <Shape className="node__node-base" fill={nodeBaseColor} />
        {shape === Rectangle ? (
          <path
            d="M10 10 L10 100 A20 20 10 0 0 20 120 L120 120 L10 20 Z"
            fill={nodeFlashColor}
            className="node__node-flash"
            transform="rotate(-90 200 200) scale(2.65) translate(-10 31)"
          />
        ) : (
          <path
            d="m50,250 a1,1 0 0,0 400,0"
            fill={nodeFlashColor}
            className="node__node-flash"
            transform="rotate(-35 250 250)"
          />
        )}
        <Shape
          className="node__node-trim"
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
      </svg>
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

Node.displayName = 'Node';

export default Node;
