import React from 'react';
import PropTypes from 'prop-types';
import Slider from './Slider';

const LikertScale = (props) => <Slider {...props} />;

LikertScale.propTypes = {
  options: PropTypes.array.isRequired,
};

export default LikertScale;
