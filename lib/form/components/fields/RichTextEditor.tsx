'use client';

import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { type AnyExtension } from '@tiptap/core';
import BulletList from '@tiptap/extension-bullet-list';
import Heading from '@tiptap/extension-heading';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import { type DOMOutputSpec } from '@tiptap/pm/model';
import {
  EditorContent,
  type JSONContent,
  useEditor,
  useEditorState,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  List,
  ListOrdered,
} from 'lucide-react';
import { type ComponentPropsWithoutRef, useCallback, useEffect } from 'react';
import { headingVariants } from '~/components/typography/Heading';
import { paragraphVariants } from '~/components/typography/Paragraph';
import { iconButtonVariants } from '~/components/ui/Button';
import {
  controlContainerVariants,
  controlStateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';

// Get the classes from the typography components
const paragraphClasses = paragraphVariants();
const h1Classes = headingVariants({ level: 'h1' });
const h2Classes = headingVariants({ level: 'h2' });
const h3Classes = headingVariants({ level: 'h3' });
const h4Classes = headingVariants({ level: 'h4' });

// Factory function to create custom extensions with typography classes
// Using a function with explicit return type to satisfy ESLint's strict type checking
function createCustomExtensions(placeholder: string): AnyExtension[] {
  const CustomParagraph = Paragraph.extend({
    renderHTML({ HTMLAttributes }): DOMOutputSpec {
      return ['p', { ...HTMLAttributes, class: paragraphClasses }, 0];
    },
  });

  const CustomHeading = Heading.extend({
    renderHTML({ node, HTMLAttributes }): DOMOutputSpec {
      const level = node.attrs.level as number;
      const classMap: Record<number, string> = {
        1: h1Classes,
        2: h2Classes,
        3: h3Classes,
        4: h4Classes,
      };
      return [
        `h${level}`,
        { ...HTMLAttributes, class: classMap[level] ?? h1Classes },
        0,
      ];
    },
  });

  const CustomBulletList = BulletList.extend({
    renderHTML({ HTMLAttributes }): DOMOutputSpec {
      return [
        'ul',
        { ...HTMLAttributes, class: 'ml-8 list-disc [&>li]:not-last:mb-2' },
        0,
      ];
    },
  });

  const CustomOrderedList = OrderedList.extend({
    renderHTML({ HTMLAttributes }): DOMOutputSpec {
      return [
        'ol',
        { ...HTMLAttributes, class: 'ml-8 list-decimal [&>li]:not-last:mb-2' },
        0,
      ];
    },
  });

  return [
    StarterKit.configure({
      paragraph: false,
      heading: false,
      bulletList: false,
      orderedList: false,
    }),
    CustomParagraph,
    CustomHeading.configure({
      levels: [1, 2, 3, 4],
    }),
    CustomBulletList,
    CustomOrderedList,
    Placeholder.configure({
      placeholder,
    }),
  ];
}

const editorContainerVariants = compose(
  controlContainerVariants,
  controlStateVariants,
  cva({
    base: 'flex w-full flex-col',
  }),
);

const toolbarStyles = cx(
  'flex w-full flex-wrap items-center gap-1 border-b border-current/10 px-6 py-2',
);

const toolbarGroupStyles = cx('flex items-center');

const toolbarButtonStyles = iconButtonVariants({
  size: 'sm',
  variant: 'text',
});

const toolbarSeparatorStyles = cx('mx-2 h-5 w-px shrink-0 bg-current/20');

const editorContentStyles = cx(
  'min-h-[120px] w-full flex-1 px-6 py-4',
  'outline-none',
  '[&_.tiptap]:min-h-[120px] [&_.tiptap]:outline-none',
  // Placeholder styles
  '[&_.tiptap_p.is-editor-empty:first-child::before]:text-input-contrast/50',
  '[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none',
  '[&_.tiptap_p.is-editor-empty:first-child::before]:float-left',
  '[&_.tiptap_p.is-editor-empty:first-child::before]:h-0',
  '[&_.tiptap_p.is-editor-empty:first-child::before]:italic',
  '[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
);

type RichTextEditorFieldProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'onChange'
> &
  VariantProps<typeof editorContainerVariants> & {
    'value'?: JSONContent;
    'onChange'?: (value: JSONContent) => void;
    'placeholder'?: string;
    'disabled'?: boolean;
    'readOnly'?: boolean;
    'aria-invalid'?: boolean;
  };

export function RichTextEditorField({
  className,
  value,
  onChange,
  placeholder = 'Enter text...',
  disabled,
  readOnly,
  'aria-invalid': ariaInvalid,
  ...props
}: RichTextEditorFieldProps) {
  const editor = useEditor({
    extensions: createCustomExtensions(placeholder),
    content: value,
    editable: !disabled && !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  // Track editor state changes to update toolbar button states
  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      isBold: e?.isActive('bold') ?? false,
      isItalic: e?.isActive('italic') ?? false,
      isH1: e?.isActive('heading', { level: 1 }) ?? false,
      isH2: e?.isActive('heading', { level: 2 }) ?? false,
      isH3: e?.isActive('heading', { level: 3 }) ?? false,
      isH4: e?.isActive('heading', { level: 4 }) ?? false,
      isBulletList: e?.isActive('bulletList') ?? false,
      isOrderedList: e?.isActive('orderedList') ?? false,
    }),
  });

  useEffect(() => {
    if (!editor || !value) return;

    const currentContent = JSON.stringify(editor.getJSON());
    const newContent = JSON.stringify(value);

    if (currentContent !== newContent) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled && !readOnly);
    }
  }, [editor, disabled, readOnly]);

  const getState = useCallback(() => {
    if (disabled) return 'disabled';
    if (readOnly) return 'readOnly';
    if (ariaInvalid) return 'invalid';
    return 'normal';
  }, [disabled, readOnly, ariaInvalid]);

  if (!editor) {
    return null;
  }

  const isDisabled = disabled ?? readOnly ?? false;

  const getActiveFormattingValues = () => {
    const values: string[] = [];
    if (editorState.isBold) values.push('bold');
    if (editorState.isItalic) values.push('italic');
    return values;
  };

  const getActiveHeadingValue = () => {
    if (editorState.isH1) return ['h1'];
    if (editorState.isH2) return ['h2'];
    if (editorState.isH3) return ['h3'];
    return [];
  };

  const getActiveListValue = () => {
    if (editorState.isBulletList) return ['bullet'];
    if (editorState.isOrderedList) return ['ordered'];
    return [];
  };

  return (
    <div
      className={editorContainerVariants({
        state: getState(),
        className,
      })}
      {...props}
    >
      <Toolbar.Root className={toolbarStyles}>
        <Toolbar.Group className={toolbarGroupStyles}>
          <ToggleGroup
            className={toolbarGroupStyles}
            value={getActiveFormattingValues()}
            onValueChange={(values: string[]) => {
              const shouldBeBold = values.includes('bold');
              const shouldBeItalic = values.includes('italic');

              if (shouldBeBold !== editorState.isBold) {
                editor.chain().focus().toggleBold().run();
              }
              if (shouldBeItalic !== editorState.isItalic) {
                editor.chain().focus().toggleItalic().run();
              }
            }}
            multiple
          >
            <Toolbar.Button
              className={toolbarButtonStyles}
              disabled={isDisabled}
              render={<Toggle value="bold" aria-label="Bold" />}
            >
              <Bold />
            </Toolbar.Button>
            <Toolbar.Button
              className={toolbarButtonStyles}
              disabled={isDisabled}
              render={<Toggle value="italic" aria-label="Italic" />}
            >
              <Italic />
            </Toolbar.Button>
          </ToggleGroup>
        </Toolbar.Group>

        <Toolbar.Separator className={toolbarSeparatorStyles} />

        <Toolbar.Group className={toolbarGroupStyles}>
          <ToggleGroup
            className={toolbarGroupStyles}
            value={getActiveHeadingValue()}
            onValueChange={(values: string[]) => {
              const newValue = values[0];
              if (newValue === 'h1') {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              } else if (newValue === 'h2') {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              } else if (newValue === 'h3') {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              } else if (newValue === 'h4') {
                editor.chain().focus().toggleHeading({ level: 4 }).run();
              } else {
                if (editorState.isH1) {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                } else if (editorState.isH2) {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                } else if (editorState.isH3) {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                }
              }
            }}
          >
            <Toolbar.Button
              className={toolbarButtonStyles}
              disabled={isDisabled}
              render={<Toggle value="h1" aria-label="Heading 1" />}
            >
              <Heading1 />
            </Toolbar.Button>
            <Toolbar.Button
              className={toolbarButtonStyles}
              disabled={isDisabled}
              render={<Toggle value="h2" aria-label="Heading 2" />}
            >
              <Heading2 />
            </Toolbar.Button>
            <Toolbar.Button
              className={toolbarButtonStyles}
              disabled={isDisabled}
              render={<Toggle value="h3" aria-label="Heading 3" />}
            >
              <Heading3 />
            </Toolbar.Button>
            <Toolbar.Button
              className={toolbarButtonStyles}
              disabled={isDisabled}
              render={<Toggle value="h4" aria-label="Heading 4" />}
            >
              <Heading4 />
            </Toolbar.Button>
          </ToggleGroup>
        </Toolbar.Group>

        <Toolbar.Separator className={toolbarSeparatorStyles} />

        <Toolbar.Group className={toolbarGroupStyles}>
          <ToggleGroup
            className={toolbarGroupStyles}
            value={getActiveListValue()}
            onValueChange={(values: string[]) => {
              const newValue = values[0];
              if (newValue === 'bullet') {
                if (!editorState.isBulletList) {
                  editor.chain().focus().toggleBulletList().run();
                }
              } else if (newValue === 'ordered') {
                if (!editorState.isOrderedList) {
                  editor.chain().focus().toggleOrderedList().run();
                }
              } else {
                if (editorState.isBulletList) {
                  editor.chain().focus().toggleBulletList().run();
                } else if (editorState.isOrderedList) {
                  editor.chain().focus().toggleOrderedList().run();
                }
              }
            }}
          >
            <Toolbar.Button
              className={toolbarButtonStyles}
              disabled={isDisabled}
              render={<Toggle value="bullet" aria-label="Bullet list" />}
            >
              <List />
            </Toolbar.Button>
            <Toolbar.Button
              className={toolbarButtonStyles}
              disabled={isDisabled}
              render={<Toggle value="ordered" aria-label="Numbered list" />}
            >
              <ListOrdered />
            </Toolbar.Button>
          </ToggleGroup>
        </Toolbar.Group>
      </Toolbar.Root>

      <EditorContent editor={editor} className={editorContentStyles} />
    </div>
  );
}
