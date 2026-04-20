'use client';

import { cloneElement, type ReactElement, type ReactNode } from 'react';
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
  children?: ReactNode;
}) => (
  <NativeLink href={href ?? '#'} target="_blank" rel="noopener noreferrer">
    {children}
  </NativeLink>
);

const defaultMarkdownRenderers = {
  a: externalLinkRenderer,
  h1: ({ children }: { children?: ReactNode }) => (
    <Heading level="h1">{children}</Heading>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <Heading level="h2">{children}</Heading>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <Heading level="h3">{children}</Heading>
  ),
  h4: ({ children }: { children?: ReactNode }) => (
    <Heading level="h4">{children}</Heading>
  ),
  h5: ({ children }: { children?: ReactNode }) => (
    <Heading level="h4">{children}</Heading>
  ),
  h6: ({ children }: { children?: ReactNode }) => (
    <Heading level="h4">{children}</Heading>
  ),
  p: Paragraph,
  ul: UnorderedList,
  ol: OrderedList,
};

type RenderMarkdownProps = Options & {
  render?: ReactElement;
};

const RenderMarkdown = ({
  children,
  render,
  allowedElements,
  components,
  remarkPlugins,
  rehypePlugins,
  unwrapDisallowed,
  ...props
}: RenderMarkdownProps) => {
  const markdownContent = (
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
  );

  if (render) {
    return cloneElement(render, undefined, markdownContent);
  }

  return markdownContent;
};

export { RenderMarkdown };
