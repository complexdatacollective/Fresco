import classNames from 'classnames';
import { forwardRef } from 'react';

/**
 * Renders a connector between parents and children.
 */

const FamilyTreeOffspringConnector = forwardRef<
  HTMLDivElement,
  { xPos: number; yStartPos: number; yEndPos: number }
>((props, ref) => {
  const { xPos = 0, yStartPos = 0, yEndPos = 0 } = props;
  const classes = classNames('offspring-connector');

  return (
    <div className={classes} ref={ref}>
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
        <line
          x1={xPos}
          y1={yStartPos + 5}
          x2={xPos}
          y2={yEndPos}
          stroke="#807ea1"
        />
      </svg>
    </div>
  );
});

FamilyTreeOffspringConnector.displayName = 'FamilyTreeOffspringConnector';

export default FamilyTreeOffspringConnector;
