'use client';

import { useRender } from '@base-ui/react/use-render';
import * as React from 'react';
import ReactMarkdown, { type Options } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGemoji from 'remark-gemoji';
import Heading from './typography/Heading';
import Paragraph from './typography/Paragraph';
import UnorderedList from './typography/UnorderedList';
import { NativeLink } from './ui/Link';

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
  href: string;
  children?: React.ReactNode;
}) => (
  <NativeLink href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </NativeLink>
);

const defaultMarkdownRenderers = {
  a: externalLinkRenderer,
  h1: Heading,
  h2: Heading,
  h3: Heading,
  h4: Heading,
  h5: Heading,
  h6: Heading,
  p: Paragraph,
  ul: UnorderedList,
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
      defaultTagName: 'fragment',
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
