/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import PropTypes from 'prop-types';

const Audio = ({ url, description, ...props }) => <audio src={url} {...props}>{description}</audio>;

Audio.propTypes = {
  description: PropTypes.string,
  url: PropTypes.string.isRequired,
};

export default Audio;
