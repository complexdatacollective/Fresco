import React from 'react';
import PropTypes from 'prop-types';

const Steps = ({ index = 1, children }) => {
  const step = children[index - 1];

  return <>{step}</>;
};

Steps.propTypes = {
  index: PropTypes.number,
  children: PropTypes.node,
};

export default Steps;
