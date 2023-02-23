/* eslint-disable react/jsx-props-no-spreading, no-param-reassign */
import React from 'react';
import PropTypes from 'prop-types';

const withMarks = (content, leaf) => {
  if (leaf.bold) {
    if (leaf.italic) {
      return <strong><em>{content}</em></strong>;
    }

    return <strong>{content}</strong>;
  }

  if (leaf.italic) {
    return <em>{content}</em>;
  }

  return content;
};

const Leaf = ({ attributes, children, leaf }) => (
  <span {...attributes}>{withMarks(children, leaf)}</span>
);

Leaf.propTypes = {
  attributes: PropTypes.object,
  children: PropTypes.node,
  leaf: PropTypes.shape({
    bold: PropTypes.bool,
    italic: PropTypes.bool,
    underline: PropTypes.bool,
  }).isRequired,
};

Leaf.defaultProps = {
  attributes: {},
  children: null,
};

export default Leaf;
