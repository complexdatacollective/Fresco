import { type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGemoji from 'remark-gemoji';
import { ALLOWED_MARKDOWN_FIELD_TAGS } from '~/lib/form/components/FieldLabel';

export default function Hint({
  id,
  text,
  children,
}: {
  id: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div id={id} className="text-sm text-current/70">
      {text && (
        <ReactMarkdown
          allowedElements={ALLOWED_MARKDOWN_FIELD_TAGS}
          remarkPlugins={[remarkGemoji]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          unwrapDisallowed
        >
          {text}
        </ReactMarkdown>
      )}
      {children}
    </div>
  );
}
