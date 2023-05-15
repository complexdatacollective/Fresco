export const BLOCKS = [
  'headings',
  'lists',
  'thematic_break',
];

export const MARKS = [
  'bold',
  'italic',
];

export const HISTORY = [
  'history',
];

export const MODES = {
  full: 'full',
  inline: 'inline',
};

export const ALWAYS_DISALLOWED = ['strike', 'code'];

export const TOOLBAR_ITEMS = [...BLOCKS, ...MARKS, ...HISTORY];

export const INLINE_DISALLOWED_ITEMS = [...BLOCKS];

export const LIST_TYPES = [
  'ol_list',
  'ul_list',
];

export const HEADING_TYPES = [
  'heading_one',
  'heading_two',
  'heading_three',
  'heading_four',
  'heading_five',
];

export const BLOCK_TYPES = [
  ...LIST_TYPES,
  ...HEADING_TYPES,
  'code_block',
];
