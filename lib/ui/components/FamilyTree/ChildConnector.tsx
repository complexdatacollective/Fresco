import classNames from 'classnames';
import { forwardRef } from 'react';

/**
 * Renders a connector between children and their parents' offspring connector.
 */

const FamilyTreeChildConnector = forwardRef<
  HTMLDivElement,
  {
    xStartPos: number;
    xEndPos: number;
    yPos: number;
    height: number;
    color?: string;
  }
>((props, ref) => {
  const {
    xStartPos = 0,
    xEndPos = 0,
    yPos = 0,
    height = 0,
    color = '#807ea1',
  } = props;
  const classes = classNames('child-connector');

  return (
    <div className={classes} ref={ref}>
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
        <line
          x1={xStartPos}
          y1={yPos}
          x2={xStartPos}
          y2={yPos + height}
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <line
          x1={xStartPos}
          y1={yPos}
          x2={xEndPos}
          y2={yPos}
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
});

FamilyTreeChildConnector.displayName = 'FamilyTreeChildConnector';

export default FamilyTreeChildConnector;
