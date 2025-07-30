import classNames from 'classnames';
import { forwardRef } from 'react';

/**
 * Renders a connector between siblings.
 */

const FamilyTreeSiblingConnector = forwardRef<HTMLDivElement, { xStartPos: number, xEndPos: number, yPos: number, color?: string }>((props, ref) => {
  const {
    xStartPos = 0,
    xEndPos = 0,
    yPos = 0,
    color = "#666",
  } = props;
  const classes = classNames('sibling-connector');
  const HEIGHT = 50;
  const width = xEndPos - xStartPos;

  return (
    <div className={classes} ref={ref}>
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg">

        <line x1={xStartPos} y1={yPos} x2={xStartPos} y2={yPos + HEIGHT} stroke={color} strokeLinecap="round" />
        <line x1={xStartPos} y1={yPos} x2={xEndPos} y2={yPos} stroke={color} strokeLinecap="round" />
        <line x1={xStartPos + width} y1={yPos} x2={xStartPos + width} y2={yPos + HEIGHT} stroke={color} strokeLinecap="round" />
      </svg>
    </div>
  );
});

FamilyTreeSiblingConnector.displayName = 'FamilyTreeSiblingConnector';

export default FamilyTreeSiblingConnector;
