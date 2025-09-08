import classNames from 'classnames';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

export const NodeColors = [
  'node-color-seq-1',
  'node-color-seq-2',
  'node-color-seq-3',
  'node-color-seq-4',
  'node-color-seq-5',
  'node-color-seq-6',
  'node-color-seq-7',
  'node-color-seq-8',
] as const;

export type NodeColorSequence = (typeof NodeColors)[number];

type UINodeProps = {
  color?: NodeColorSequence;
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
  } = props;
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
