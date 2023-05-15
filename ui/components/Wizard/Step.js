/* eslint-disable react/jsx-props-no-spreading */

import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const Step = ({
  children,
  component: Container,
  ...props
}) => (
  <Container {...props}>
    {children}
  </Container>
);

Step.propTypes = {
  children: PropTypes.node,
  component: PropTypes.object,
};

Step.defaultProps = {
  children: null,
  component: motion.div,
};

export default Step;
