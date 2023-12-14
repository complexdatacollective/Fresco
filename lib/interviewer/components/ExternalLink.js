import React from 'react';
import PropTypes from 'prop-types';
import { isElectron } from '../utils/Environment';

export const openExternalLink = (href) => {
  if (isElectron()) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { shell } = require('electron');
    shell.openExternal(href);
    return false;
  }

  window.cordova.InAppBrowser.open(href, '_system', 'location=yes');
  return false;
};

const ExternalLink = ({ children, href }) => {
  const handleClick = (event) => {
    event.preventDefault();
    openExternalLink(href);
  };

  return (
    <a href="#" onClick={handleClick}>
      {children}
    </a>
  );
};

ExternalLink.propTypes = {
  children: PropTypes.node.isRequired,
  href: PropTypes.string.isRequired,
};

export { ExternalLink };

export default ExternalLink;