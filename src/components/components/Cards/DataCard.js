import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { noop } from 'lodash';

const DataCard = ({
  label,
  data,
  onClick,
  allowDrag,
}) => {
  const classes = cx(
    'data-card',
    {
      'data-card--can-drag': allowDrag,
      'data-card--can-click': onClick !== noop,
    },
  );

  return (
    <div
      className={classes}
      onClick={onClick}
    >
      <div className="data-card__label">
        <h2>{label}</h2>
      </div>
      { data && Object.keys(data).length > 0 && (
        <div className="data-card__data">
          {Object.keys(data).map((dataLabel) => (
            <div className="data-card__data-item" key={dataLabel}>
              <div className="data-card__data-label">{dataLabel}</div>
              <div className="data-card__data-value">{data[dataLabel]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

DataCard.defaultProps = {
  data: {},
  onClick: noop,
  allowDrag: false,
};

DataCard.propTypes = {
  data: PropTypes.object,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  allowDrag: PropTypes.bool,
};

export default DataCard;
