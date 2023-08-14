import React from 'react';
import PropTypes from 'prop-types';
import BoldIcon from '@mui/icons-material/FormatBoldRounded';
import ItalicIcon from '@mui/icons-material/FormatItalicRounded';
import QuoteIcon from '@mui/icons-material/FormatQuoteRounded';
import H1Icon from '@mui/icons-material/LooksOneRounded';
import H2Icon from '@mui/icons-material/LooksTwoRounded';
import H3Icon from '@mui/icons-material/Looks3Rounded';
import H4Icon from '@mui/icons-material/Looks4Rounded';
import H5Icon from '@mui/icons-material/Looks5Rounded';
import ULIcon from '@mui/icons-material/FormatListBulletedRounded';
import OLIcon from '@mui/icons-material/FormatListNumberedRounded';
import UndoIcon from '@mui/icons-material/UndoRounded';
import RedoIcon from '@mui/icons-material/RedoRounded';
import HorizontalRuleIcon from '@mui/icons-material/RemoveRounded';

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
  if (!IconComponent) {
    return <span>{name}</span>;
  }
  return <IconComponent style={{ color: 'white' }} />;
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
};

export default Icon;
