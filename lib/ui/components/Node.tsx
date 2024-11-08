import classNames from 'classnames';
import { Loader2 } from 'lucide-react';

/**
 * Renders a Node.
 */

export default function Node(props: {
  label?: string;
  color?: string;
  inactive?: boolean;
  selected?: boolean;
  selectedColor?: string;
  linking?: boolean;
  loading?: boolean;
  handleClick?: () => void;
}) {
  const {
    label,
    color = 'node-color-seq-1',
    inactive = false,
    selected = false,
    loading = false,
    selectedColor = '',
    linking = false,
    handleClick,
  } = props;

  const classes = classNames('node', {
    'node--inactive': inactive,
    'node--selected': selected,
    'node--linking': linking,
    [`node--${selectedColor}`]: selected && selectedColor,
  });

  const nodeBaseColor = `var(--nc-${color})`;
  const nodeFlashColor = `var(--nc-${color}--dark)`;

  const labelWithEllipsis =
    (label?.length ?? 0 < 22) ? label : `${label?.substring(0, 18)}\u{AD}...`; // Add ellipsis for really long labels

  return (
    <div className={classes} onClick={handleClick}>
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
      <div className="node__label">
        {loading && <Loader2 className="animate-spin" />}
        {label && labelWithEllipsis}
      </div>
    </div>
  );
}
