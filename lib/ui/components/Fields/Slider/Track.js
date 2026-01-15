import React from 'react';
import PropTypes from 'prop-types';

const Track = ({ source, target, getTrackProps }) => (
  <div
    className="form-field-slider__track"
    style={{
      left: `${source.percent}%`,
      width: `${target.percent - source.percent}%`,
    }}
     
    {...getTrackProps()}
  >
    <div className="form-field-slider__track-line" />
  </div>
);

Track.propTypes = {
  source: PropTypes.object.isRequired,
  target: PropTypes.object.isRequired,
  getTrackProps: PropTypes.func.isRequired,
};

export default Track;
