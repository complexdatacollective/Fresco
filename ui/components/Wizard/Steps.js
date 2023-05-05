import React from 'react';
import PropTypes from 'prop-types';

const Steps = ({ index, children }) => {
  const step = children[index - 1];

  return (
    <>
      {step}
    </>
  );
};

Steps.propTypes = {
  index: PropTypes.number,
  children: PropTypes.node,
};

Steps.defaultProps = {
  index: 1,
  children: null,
};

export default Steps;
