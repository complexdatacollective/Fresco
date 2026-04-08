'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGemoji from 'remark-gemoji';
import { Label as UILabel } from '~/components/ui/Label';

const ALLOWED_MARKDOWN_LABEL_TAGS = ['em', 'strong', 'ul', 'ol', 'li'];

/**
 * Hack for `>` characters that already exist in some protocols
 * and will be interpreted as block quotes on first load
 * Encoding this way forces slate to treat them as paragraphs.
 *
 * This was implemented as two successive 'replace' operations
 * rather than a single regex, because Safari does not support
 * lookbehind.
 */
const escapeAngleBracket = (value = '') =>
  value.replace(/>/g, '&gt;').replace(/<br&gt;/g, '<br>');

const externalLinkRenderer = ({
  href,
  children,
}: {
  href?: string;
  children?: React.ReactNode;
}) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

const defaultMarkdownRenderers = {
  a: externalLinkRenderer,
};

type FieldLabelProps = React.ComponentPropsWithoutRef<typeof UILabel> & {
  required?: boolean;
};

const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ required, children, ...props }, ref) => {
    const processedChildren = React.useMemo(() => {
      if (typeof children === 'string') {
        return escapeAngleBracket(children);
      }
      return children;
    }, [children]);

    return (
      <UILabel ref={ref} {...props}>
        {typeof processedChildren === 'string' ? (
          <ReactMarkdown
            allowedElements={ALLOWED_MARKDOWN_LABEL_TAGS}
            components={defaultMarkdownRenderers}
            remarkPlugins={[remarkGemoji]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
            unwrapDisallowed
          >
            {processedChildren}
          </ReactMarkdown>
        ) : (
          processedChildren
        )}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </UILabel>
    );
  },
);

FieldLabel.displayName = 'FieldLabel';

export { FieldLabel };
