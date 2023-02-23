import React from 'react';
import PropTypes from 'prop-types';
import { useSlate } from 'slate-react';
import cx from 'classnames';
import Icon from './Icon';
import {
  toggleBlock,
  toggleMark,
  isMarkActive,
  isBlockActive,
} from './lib/actions';

export const ToolbarButton = ({
  isActive, icon, tooltip, action,
}) => (
  <button
    title={tooltip}
    active={isActive ? 'true' : undefined} // Why undefined and not false, why the ternary?
    onMouseDown={(event) => {
      event.preventDefault();
      action();
    }}
    type="button"
    className={cx(
      'rich-text__button',
      { 'rich-text__button--is-active': isActive },
    )}
  >
    <Icon name={icon} />
  </button>
);

ToolbarButton.propTypes = {
  isActive: PropTypes.bool,
  icon: PropTypes.string.isRequired,
  tooltip: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired,
};

ToolbarButton.defaultProps = {
  isActive: false,
};

export const BlockButton = ({ format, icon, tooltip }) => {
  const editor = useSlate();
  return (
    <ToolbarButton
      isActive={isBlockActive(editor, format)}
      icon={icon}
      tooltip={tooltip}
      action={() => toggleBlock(editor, format)}
    />
  );
};

BlockButton.propTypes = {
  format: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
};

BlockButton.defaultProps = {
  tooltip: null,
};

export const MarkButton = ({ format, icon, tooltip }) => {
  const editor = useSlate();

  return (
    <ToolbarButton
      isActive={isMarkActive(editor, format)}
      icon={icon}
      tooltip={tooltip}
      action={() => toggleMark(editor, format)}
    />
  );
};

MarkButton.propTypes = {
  format: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
};

MarkButton.defaultProps = {
  tooltip: null,
};
