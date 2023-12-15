import React from 'react';
import PropTypes from 'prop-types';

const BackgroundImage = ({ style = {}, url, ...props }) => (
  <div
    style={{ ...style, backgroundImage: `url(${url})` }}
    {...props}
  />
);

BackgroundImage.propTypes = {
  style: PropTypes.object,
  url: PropTypes.string.isRequired,
};

export default BackgroundImage;

