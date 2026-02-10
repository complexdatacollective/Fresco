'use client';

import { type JSONContent } from '@tiptap/react';
import { Fragment, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { headingVariants } from '~/components/typography/Heading';
import { paragraphVariants } from '~/components/typography/Paragraph';

// Get the classes from the typography components
const paragraphClasses = paragraphVariants();
const h1Classes = headingVariants({ level: 'h1' });
const h2Classes = headingVariants({ level: 'h2' });
const h3Classes = headingVariants({ level: 'h3' });
const h4Classes = headingVariants({ level: 'h4' });

const headingClassMap: Record<number, string> = {
  1: h1Classes,
  2: h2Classes,
  3: h3Classes,
  4: h4Classes,
};

const listClasses = {
  bullet: 'ml-8 list-disc [&>li]:not-last:mb-2',
  ordered: 'ml-8 list-decimal [&>li]:not-last:mb-2',
};

type TextMark = {
  type: 'bold' | 'italic' | 'code' | 'strike' | 'underline';
};

type RichTextRendererProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'content'
> & {
  content?: JSONContent;
};

function renderMarks(text: string, marks?: TextMark[]): ReactNode {
  if (!marks || marks.length === 0) {
    return text;
  }

  return marks.reduce<ReactNode>((acc, mark, index) => {
    const key = `mark-${mark.type}-${index}`;
    switch (mark.type) {
      case 'bold':
        return <strong key={key}>{acc}</strong>;
      case 'italic':
        return <em key={key}>{acc}</em>;
      case 'code':
        return (
          <code key={key} className="rounded bg-current/10 px-1 py-0.5">
            {acc}
          </code>
        );
      case 'strike':
        return <s key={key}>{acc}</s>;
      case 'underline':
        return <u key={key}>{acc}</u>;
      default:
        return acc;
    }
  }, text);
}

function renderNode(node: JSONContent, index: number): ReactNode {
  const key = `${node.type}-${index}`;

  switch (node.type) {
    case undefined:
      return null;

    case 'doc':
      return node.content?.map((child, i) => renderNode(child, i));

    case 'paragraph':
      return (
        <p key={key} className={paragraphClasses}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </p>
      );

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      const className = headingClassMap[level] ?? h1Classes;
      return (
        <Tag key={key} className={className}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </Tag>
      );
    }

    case 'bulletList':
      return (
        <ul key={key} className={listClasses.bullet}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol key={key} className={listClasses.ordered}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </ol>
      );

    case 'listItem':
      return (
        <li key={key}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </li>
      );

    case 'text':
      return (
        <Fragment key={key}>
          {renderMarks(node.text ?? '', node.marks as TextMark[] | undefined)}
        </Fragment>
      );

    case 'hardBreak':
      return <br key={key} />;

    default:
      // For unknown node types, try to render children if they exist
      if (node.content) {
        return node.content.map((child, i) => renderNode(child, i));
      }
      return null;
  }
}

export default function RichTextRenderer({
  content,
  className,
  ...props
}: RichTextRendererProps) {
  if (!content) {
    return null;
  }

  return (
    <div className={className} {...props}>
      {renderNode(content, 0)}
    </div>
  );
}
