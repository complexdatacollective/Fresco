import classNames from 'classnames';
import { forwardRef } from 'react';

/**
 * Renders a connector between ex partners.
 */

const ExPartnerConnector = forwardRef<
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
          y1={yPos}
          x2={xEndPos}
          y2={yPos}
          stroke="#807ea1"
        />
        <line
          x1={(xStartPos + xEndPos) / 2 + 5}
          y1={yPos - 10}
          x2={(xStartPos + xEndPos) / 2 - 15}
          y2={yPos + 10}
          stroke="#807ea1"
        />
        <line
          x1={(xStartPos + xEndPos) / 2 + 15}
          y1={yPos - 10}
          x2={(xStartPos + xEndPos) / 2 - 5}
          y2={yPos + 10}
          stroke="#807ea1"
        />
      </svg>
    </div>
  );
});

ExPartnerConnector.displayName = 'ExPartnerConnector';

export default ExPartnerConnector;
