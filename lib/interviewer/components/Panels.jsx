import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

/**
 * Renders a pane container.
 */
const Panels = ({ children, minimize = false }) => {
  const panelsClasses = cx('panels', { 'panels--minimize': minimize });
  return <div className={panelsClasses}>{children}</div>;
};

Panels.propTypes = {
  children: PropTypes.any,
  minimize: PropTypes.bool,
};

export default Panels;
