import React from 'react';
import PropTypes from 'prop-types';
import Slider from './Slider';

// eslint-disable-next-line react/jsx-props-no-spreading
const VisualAnalogScale = (props) => <Slider {...props} />;

VisualAnalogScale.propTypes = {
  parameters: PropTypes.shape({
    minLabel: PropTypes.string.isRequired,
    maxLabel: PropTypes.string.isRequired,
  }).isRequired,
};

export default VisualAnalogScale;
