import React, { forwardRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * Renders a Node.
 */
const Node = forwardRef(function Node({
  label = 'Node',
  color = 'node-color-seq-1',
  inactive = false,
  selected = false,
  selectedColor = '',
  linking = false,
  handleClick,
}, ref) {
  const classes = classNames('node', {
    'node--inactive': inactive,
    'node--selected': selected,
    'node--linking': linking,
    [`node--${selectedColor}`]: selected && selectedColor,
  });

  const labelClasses = useMemo(() => {
    const labelLength = label.length;
    return `node__label-text len-${labelLength}`;
  }, [label.length]);

  const nodeBaseColor = `var(--nc-${color})`;
  const nodeFlashColor = `var(--nc-${color}--dark)`;

  const labelWithEllipsis = useMemo(() => {
    return label.length < 22 ? label : `${label.substring(0, 18)}\u{AD}...`; // Add ellipsis for really long labels
  }, [label]);

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
      <div className="node__label">
        <div className={labelClasses}>
          {labelWithEllipsis}
        </div>
      </div>
    </div>
  );
})

Node.propTypes = {
  color: PropTypes.string,
  inactive: PropTypes.bool,
  label: PropTypes.string,
  selected: PropTypes.bool,
  selectedColor: PropTypes.string,
  linking: PropTypes.bool,
  handleClick: PropTypes.func,
};

export default Node;
