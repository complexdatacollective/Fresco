import React, { useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import PropTypes from 'prop-types';
import emoji from 'emoji-dictionary';
import { ALLOWED_MARKDOWN_TAGS } from '../../utils/config';
import { escapeAngleBracket } from './RichText/lib/parse';

const emojiTextRenderer = ({ node, ...props }) => (
  <p>
    {props.children.map((child) => {
      if (typeof child === 'string') {
        return child.replace(/:\w+:/gi, (name) => emoji.getUnicode(name));
      }
      return child;
    })}
  </p>
);

const externalLinkRenderer = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

const defaultMarkdownRenderers = {
  p: emojiTextRenderer,
  a: externalLinkRenderer,
};

const Markdown = ({
  label,
  className,
  allowedElements = ALLOWED_MARKDOWN_TAGS,
  markdownRenderers,
}) => {
  const combinedRenderers = useMemo(() => ({
    ...defaultMarkdownRenderers,
    ...markdownRenderers,
  }), [markdownRenderers]);

  const rawText = useMemo(() => {
    if (!label) {
      return null;
    }

    return escapeAngleBracket(label);
  }, [label]);

  return (
    <ReactMarkdown
      className={className}
      allowedElements={allowedElements}
      components={combinedRenderers}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      unwrapDisallowed
    >
      {rawText}
    </ReactMarkdown>
  );
};

Markdown.propTypes = {
  allowedElements: PropTypes.array,
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
  markdownRenderers: PropTypes.object,
};

Markdown.defaultProps = {
  allowedElements: null,
  className: 'markdown',
  markdownRenderers: {},
};

export default memo(Markdown);
