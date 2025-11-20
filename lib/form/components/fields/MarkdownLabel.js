import PropTypes from 'prop-types';
import { memo } from 'react';
import {
  ALLOWED_MARKDOWN_INLINE_LABEL_TAGS,
  ALLOWED_MARKDOWN_LABEL_TAGS,
} from '~/lib/ui/utils/config';
import Markdown from './Markdown';

const MarkdownLabel = ({
  label,
  className = 'form-field-label',
  inline = false,
}) => (
  <Markdown
    className={className}
    allowedElements={
      inline ? ALLOWED_MARKDOWN_INLINE_LABEL_TAGS : ALLOWED_MARKDOWN_LABEL_TAGS
    }
    label={label}
  />
);

MarkdownLabel.propTypes = {
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
  inline: PropTypes.bool,
};

export default memo(MarkdownLabel);
