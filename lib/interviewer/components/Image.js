import React from 'react';
import PropTypes from 'prop-types';

const Image = ({ url, alt, ...props }) => (
  <img src={url} alt={alt} {...props} />
);

Image.propTypes = {
  alt: PropTypes.string,
  url: PropTypes.string.isRequired,
};

export default Image;
