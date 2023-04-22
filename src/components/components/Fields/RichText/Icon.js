import React from 'react';
import PropTypes from 'prop-types';
import BoldIcon from '@material-ui/icons/FormatBoldRounded';
import ItalicIcon from '@material-ui/icons/FormatItalicRounded';
import QuoteIcon from '@material-ui/icons/FormatQuoteRounded';
import H1Icon from '@material-ui/icons/LooksOneRounded';
import H2Icon from '@material-ui/icons/LooksTwoRounded';
import H3Icon from '@material-ui/icons/Looks3Rounded';
import H4Icon from '@material-ui/icons/Looks4Rounded';
import H5Icon from '@material-ui/icons/Looks5Rounded';
import ULIcon from '@material-ui/icons/FormatListBulletedRounded';
import OLIcon from '@material-ui/icons/FormatListNumberedRounded';
import UndoIcon from '@material-ui/icons/UndoRounded';
import RedoIcon from '@material-ui/icons/RedoRounded';
import HorizontalRuleIcon from '@material-ui/icons/RemoveRounded';

const icons = {
  bold: BoldIcon,
  italic: ItalicIcon,
  quote: QuoteIcon,
  h1: H1Icon,
  h2: H2Icon,
  h3: H3Icon,
  h4: H4Icon,
  h5: H5Icon,
  ul: ULIcon,
  ol: OLIcon,
  undo: UndoIcon,
  redo: RedoIcon,
  hr: HorizontalRuleIcon,
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
