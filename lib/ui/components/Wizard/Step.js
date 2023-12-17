import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const Step = ({ children, component: Container = motion.div, ...props }) => (
  <Container {...props}>{children}</Container>
);

Step.propTypes = {
  children: PropTypes.node,
  component: PropTypes.object,
};

export default Step;
