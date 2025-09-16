import PropTypes from 'prop-types';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGemoji from 'remark-gemoji';
import { ALLOWED_MARKDOWN_TAGS } from '../../utils/config';

/**
 * Hack for `>` characters that already exist in some protocols
 * and will be interpreted as block quotes on first load
 * Encoding this way forces slate to treat them as paragraphs.
 *
 * This function is also used by <Markdown> to sanitize incoming
 * strings.
 *
 * This was implemented as two successive 'replace' operations
 * rather than a single regex, because Safari does not support
 * lookbehind.
 */
const escapeAngleBracket = (value = '') =>
  value.replace(/>/g, '&gt;').replace(/<br&gt;/g, '<br>');

const externalLinkRenderer = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

const defaultMarkdownRenderers = {
  a: externalLinkRenderer,
};

const Markdown = ({
  label,
  className = 'markdown',
  allowedElements = ALLOWED_MARKDOWN_TAGS,
  markdownRenderers = {},
}) => {
  const combinedRenderers = useMemo(
    () => ({
      ...defaultMarkdownRenderers,
      ...markdownRenderers,
    }),
    [markdownRenderers],
  );

  const rawText = useMemo(() => {
    if (!label) {
      return null;
    }

    return escapeAngleBracket(label);
  }, [label]);

  return (
    <span className={className}>
      <ReactMarkdown
        allowedElements={allowedElements}
        components={combinedRenderers}
        remarkPlugins={[remarkGemoji]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        unwrapDisallowed
      >
        {rawText}
      </ReactMarkdown>
    </span>
  );
};

Markdown.propTypes = {
  allowedElements: PropTypes.array,
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
  markdownRenderers: PropTypes.object,
};

export default memo(
  Markdown,
  (prevProps, nextProps) => prevProps.label === nextProps.label,
);
