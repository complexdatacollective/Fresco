'use client';

import { useRender } from '@base-ui/react/use-render';
import * as React from 'react';
import ReactMarkdown, { type Components, type Options } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGemoji from 'remark-gemoji';
import Heading from './typography/Heading';
import Paragraph from './typography/Paragraph';
import { OrderedList, UnorderedList } from './typography/UnorderedList';
import { NativeLink } from './ui/Link';

const ALLOWED_MARKDOWN_LABEL_TAGS = ['em', 'strong', 'ul', 'ol', 'li'];
export const ALLOWED_MARKDOWN_SECTION_TAGS = [
  ...ALLOWED_MARKDOWN_LABEL_TAGS,
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'br',
  'hr',
  'a',
];

const externalLinkRenderer = ({
  href,
  children,
}: {
  href?: string;
  children?: React.ReactNode;
}) => (
  <NativeLink href={href ?? '#'} target="_blank" rel="noopener noreferrer">
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
  ol: OrderedList,
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
    const markdownContent = React.useMemo(
      () => (
        <ReactMarkdown
          allowedElements={allowedElements ?? ALLOWED_MARKDOWN_LABEL_TAGS}
          components={(components ?? defaultMarkdownRenderers) as Components}
          remarkPlugins={remarkPlugins ?? [remarkGemoji]}
          rehypePlugins={rehypePlugins ?? [rehypeRaw, rehypeSanitize]}
          unwrapDisallowed={unwrapDisallowed ?? true}
          {...props}
        >
          {children}
        </ReactMarkdown>
      ),
      [
        allowedElements,
        children,
        components,
        props,
        rehypePlugins,
        remarkPlugins,
        unwrapDisallowed,
      ],
    );

    return useRender({
      render: render ?? <React.Fragment />,
      props: {
        children: markdownContent,
      },
      ref,
    });
  },
);

RenderMarkdown.displayName = 'RenderMarkdown';

export { RenderMarkdown };
