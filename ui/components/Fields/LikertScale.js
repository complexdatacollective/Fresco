import React from 'react';
import PropTypes from 'prop-types';
import Slider from './Slider';

// eslint-disable-next-line react/jsx-props-no-spreading
const LikertScale = (props) => <Slider {...props} />;

LikertScale.propTypes = {
  options: PropTypes.array.isRequired,
};

export default LikertScale;
