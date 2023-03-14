import { memo } from 'react';
import PropTypes from 'prop-types';
import { ALLOWED_MARKDOWN_LABEL_TAGS, ALLOWED_MARKDOWN_INLINE_LABEL_TAGS } from '@/utils/config';
import Markdown from '@/components/Markdown/Markdown';

const MarkdownLabel = ({ label, className, inline }) => (
  <Markdown
    className={className}
    allowedElements={inline ? ALLOWED_MARKDOWN_INLINE_LABEL_TAGS : ALLOWED_MARKDOWN_LABEL_TAGS}
    label={label}
  />
);

MarkdownLabel.propTypes = {
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
  inline: PropTypes.bool,
};

MarkdownLabel.defaultProps = {
  className: 'form-field-label',
  inline: false,
};

export default memo(MarkdownLabel);
