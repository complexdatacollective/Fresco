import classNames from 'classnames';
import { forwardRef } from 'react';

/**
 * Renders a connector between partners.
 */

const PartnerConnector = forwardRef<
  HTMLDivElement,
  { xStartPos?: number; xEndPos?: number; yPos?: number }
>((props, ref) => {
  const { xStartPos = 0, xEndPos = 0, yPos = 0 } = props;
  const classes = classNames('partner-connector');

  if (xStartPos == 0 && xEndPos == 0 && yPos == 0) {
    return;
  }

  return (
    <div className={classes} ref={ref}>
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
        <line
          x1={xStartPos}
          y1={yPos - 5}
          x2={xEndPos}
          y2={yPos - 5}
          stroke="#807ea1"
        />
        <line
          x1={xStartPos}
          y1={yPos + 5}
          x2={xEndPos}
          y2={yPos + 5}
          stroke="#807ea1"
        />
      </svg>
    </div>
  );
});

PartnerConnector.displayName = 'PartnerConnector';

export default PartnerConnector;
