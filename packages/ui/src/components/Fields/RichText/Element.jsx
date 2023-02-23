/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import PropTypes from 'prop-types';

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'ul_list':
      return <ul {...attributes}>{children}</ul>;
    case 'ol_list':
      return <ol {...attributes}>{children}</ol>;
    case 'heading_one':
      return <h1 {...attributes}>{children}</h1>;
    case 'heading_two':
      return <h2 {...attributes}>{children}</h2>;
    case 'heading_three':
      return <h3 {...attributes}>{children}</h3>;
    case 'heading_four':
      return <h4 {...attributes}>{children}</h4>;
    case 'list_item':
      return <li {...attributes}>{children}</li>;
    case 'thematic_break':
      return (
        <div {...attributes}>
          <hr />
          {children}
        </div>
      );
    default:
      return <p {...attributes}>{children}</p>;
  }
};

Element.propTypes = {
  attributes: PropTypes.object,
  children: PropTypes.node,
  element: PropTypes.shape({
    type: PropTypes.string,
  }).isRequired,
};

Element.defaultProps = {
  attributes: {},
  children: null,
};

export default Element;
