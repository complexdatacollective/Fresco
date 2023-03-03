import React from 'react';
import PropTypes from 'prop-types';

const icons = {
  // bold: BoldIcon,
  // italic: ItalicIcon,
  // quote: QuoteIcon,
  // h1: H1Icon,
  // h2: H2Icon,
  // h3: H3Icon,
  // h4: H4Icon,
  // h5: H5Icon,
  // ul: ULIcon,
  // ol: OLIcon,
  // undo: UndoIcon,
  // redo: RedoIcon,
  // hr: HorizontalRuleIcon,
};

const Icon = ({ name }) => {
  const IconComponent = icons[name];
  if (!IconComponent) { return <span>{name}</span>; }
  return <IconComponent style={{ color: 'white' }} />;
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
};

export default Icon;
