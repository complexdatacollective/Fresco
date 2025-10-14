'use client';

import * as React from 'react';
import { useRender } from '@base-ui-components/react/use-render';
import ReactMarkdown, { type Options } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGemoji from 'remark-gemoji';

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

type RenderMarkdownProps = Options & {
  render?: useRender.RenderProp;
};

const RenderMarkdown = React.forwardRef<HTMLSpanElement, RenderMarkdownProps>(
  (
    {
      children,
      render,
      allowedElements,
      components,
      remarkPlugins,
      rehypePlugins,
      unwrapDisallowed,
      ...props
    },
    ref,
  ) => {
    const processedChildren = React.useMemo(() => {
      if (typeof children === 'string') {
        return escapeAngleBracket(children);
      }
      return children;
    }, [children]);

    const markdownContent = React.useMemo(
      () =>
        typeof processedChildren === 'string' ? (
          <ReactMarkdown
            allowedElements={allowedElements ?? ALLOWED_MARKDOWN_LABEL_TAGS}
            components={components ?? defaultMarkdownRenderers}
            remarkPlugins={remarkPlugins ?? [remarkGemoji]}
            rehypePlugins={rehypePlugins ?? [rehypeRaw, rehypeSanitize]}
            unwrapDisallowed={unwrapDisallowed ?? true}
            {...props}
          >
            {processedChildren}
          </ReactMarkdown>
        ) : (
          processedChildren
        ),
      [
        processedChildren,
        allowedElements,
        components,
        remarkPlugins,
        rehypePlugins,
        unwrapDisallowed,
        props,
      ],
    );

    return useRender({
      defaultTagName: 'span',
      render,
      props: {
        children: markdownContent,
      },
      ref,
    });
  },
);

RenderMarkdown.displayName = 'RenderMarkdown';

export { RenderMarkdown };
