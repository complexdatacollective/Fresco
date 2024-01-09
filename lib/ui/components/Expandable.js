import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

const Expandable = ({ open = false, children, className }) => {
  const classes = cx(className, 'expandable', { 'expandable--open': open });

  return <div className={classes}>{children}</div>;
};

Expandable.propTypes = {
  open: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.any,
};

export default Expandable;
