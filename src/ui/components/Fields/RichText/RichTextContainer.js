import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { useFocused } from 'slate-react';

const RichTextContainer = ({ children }) => {
  const focused = useFocused();

  return (
    <div className={cx('rich-text', { 'rich-text--is-active': focused })}>
      {children}
    </div>
  );
};

RichTextContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

export default RichTextContainer;
