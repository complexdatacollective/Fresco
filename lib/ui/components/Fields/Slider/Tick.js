import React from 'react';
import PropTypes from 'prop-types';
import MarkdownLabel from '../MarkdownLabel';

const Tick = ({ tick, getLabelForValue }) => {
  const { value, percent } = tick;
  const label = getLabelForValue(value);

  return (
    <div
      className="form-field-slider__tick"
      style={{
        position: 'absolute',
        left: `${percent}%`,
      }}
    >
      {label && <MarkdownLabel inline label={label} className="form-field-slider__tick-label" />}
    </div>
  );
};

Tick.propTypes = {
  tick: PropTypes.any.isRequired,
  getLabelForValue: PropTypes.func,
};

Tick.defaultProps = {
  getLabelForValue: () => null,
};

export default Tick;
