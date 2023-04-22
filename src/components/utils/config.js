const ALLOWED_MARKDOWN_TAGS = [
  'br',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'p',
  'strong',
  'hr',
];

const ALLOWED_MARKDOWN_PROMPT_TAGS = [
  'p',
  'em',
  'strong',
];

const ALLOWED_MARKDOWN_LABEL_TAGS = [
  'br',
  'p',
  'em',
  'strong',
  'ul',
  'ol',
  'li',
];

const ALLOWED_MARKDOWN_INLINE_LABEL_TAGS = [
  'em',
  'strong',
];

module.exports = {
  ALLOWED_MARKDOWN_TAGS,
  ALLOWED_MARKDOWN_PROMPT_TAGS,
  ALLOWED_MARKDOWN_LABEL_TAGS,
  ALLOWED_MARKDOWN_INLINE_LABEL_TAGS,
};
