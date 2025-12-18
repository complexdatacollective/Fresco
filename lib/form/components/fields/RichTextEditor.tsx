'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toolbar } from '@base-ui/react/toolbar';
import { type AnyExtension } from '@tiptap/core';
import BulletList from '@tiptap/extension-bullet-list';
import Heading from '@tiptap/extension-heading';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
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
  Redo,
  Undo,
} from 'lucide-react';
import { type ComponentPropsWithoutRef, useEffect } from 'react';
import { headingVariants } from '~/components/typography/Heading';
import { paragraphVariants } from '~/components/typography/Paragraph';
import { iconButtonVariants } from '~/components/ui/Button';
import {
  controlVariants,
  inputControlVariants,
  multilineContentVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';

const ToolbarButton = (props: Toolbar.Button.Props) => {
  return <Toolbar.Button {...props} render={<Toggle />} />;
};

// Get the classes from the typography components
const paragraphClasses = paragraphVariants();
const h1Classes = headingVariants({ level: 'h1' });
const h2Classes = headingVariants({ level: 'h2' });
const h3Classes = headingVariants({ level: 'h3' });
const h4Classes = headingVariants({ level: 'h4' });

type ExtensionOptions = {
  headingLevels: (1 | 2 | 3 | 4)[];
  enableBulletList: boolean;
  enableOrderedList: boolean;
};

// Factory function to create custom extensions with typography classes
// Using a function with explicit return type to satisfy ESLint's strict type checking
function createCustomExtensions({
  headingLevels,
  enableBulletList,
  enableOrderedList,
}: ExtensionOptions): AnyExtension[] {
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

  const extensions: AnyExtension[] = [
    StarterKit.configure({
      paragraph: false,
      heading: false,
      bulletList: false,
      orderedList: false,
    }),
    CustomParagraph,
  ];

  if (headingLevels.length > 0) {
    extensions.push(
      CustomHeading.configure({
        levels: headingLevels,
      }),
    );
  }

  if (enableBulletList) {
    extensions.push(CustomBulletList);
  }

  if (enableOrderedList) {
    extensions.push(CustomOrderedList);
  }

  return extensions;
}

const editorContainerVariants = compose(
  controlVariants,
  inputControlVariants,
  stateVariants,
  cva({
    base: 'flex h-auto w-full flex-col',
  }),
);

const toolbarStyles = cx(
  'bg-surface-1 text-surface-1-contrast publish-colors order-1 flex w-full items-center gap-1 border-b border-current/10 px-6 py-2',
);

const toolbarGroupStyles = cx('flex items-center');

const toolbarButtonStyles = iconButtonVariants({
  size: 'sm',
  variant: 'text',
});

const toolbarSeparatorStyles = cx('mx-2 h-5 w-px shrink-0 bg-current/20');

const editorContentStyles = cx(
  multilineContentVariants(),
  'order-2 flex-1',
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

export type ToolbarOptions = {
  bold?: boolean;
  italic?: boolean;
  headings?:
    | boolean
    | { h1?: boolean; h2?: boolean; h3?: boolean; h4?: boolean };
  lists?: boolean | { bullet?: boolean; ordered?: boolean };
  history?: boolean;
};

const defaultToolbarOptions: Required<ToolbarOptions> = {
  bold: true,
  italic: true,
  headings: true,
  lists: true,
  history: true,
};

type RichTextEditorFieldProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'onChange'
> &
  VariantProps<typeof editorContainerVariants> & {
    'id': string;
    'name': string;
    'value'?: JSONContent;
    'onChange'?: (value: JSONContent) => void;
    'placeholder'?: string;
    'disabled'?: boolean;
    'readOnly'?: boolean;
    'aria-invalid'?: boolean;
    'aria-describedby': string;
    'toolbarOptions'?: ToolbarOptions;
  };

// Helper to normalize toolbar options into a flat structure
function normalizeToolbarOptions(options?: ToolbarOptions) {
  const merged = { ...defaultToolbarOptions, ...options };

  const headings =
    typeof merged.headings === 'boolean'
      ? {
          h1: merged.headings,
          h2: merged.headings,
          h3: merged.headings,
          h4: merged.headings,
        }
      : { h1: true, h2: true, h3: true, h4: true, ...merged.headings };

  const lists =
    typeof merged.lists === 'boolean'
      ? { bullet: merged.lists, ordered: merged.lists }
      : { bullet: true, ordered: true, ...merged.lists };

  return {
    bold: merged.bold ?? true,
    italic: merged.italic ?? true,
    headings,
    lists,
    history: merged.history ?? true,
  };
}

export function RichTextEditorField({
  id,
  name,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  toolbarOptions,
  ...props
}: RichTextEditorFieldProps) {
  const options = normalizeToolbarOptions(toolbarOptions);

  // Compute which heading levels are enabled
  const headingLevels = (
    [
      options.headings.h1 && 1,
      options.headings.h2 && 2,
      options.headings.h3 && 3,
      options.headings.h4 && 4,
    ] as const
  ).filter((level): level is 1 | 2 | 3 | 4 => typeof level === 'number');

  const editor = useEditor({
    editorProps: {
      attributes: {
        'role': 'textbox',
        'aria-label': name,
        'aria-describedby': props['aria-describedby'],
        'name': name,
        'id': id,
      },
    },
    extensions: createCustomExtensions({
      headingLevels,
      enableBulletList: options.lists.bullet,
      enableOrderedList: options.lists.ordered,
    }),
    content: value,
    editable: !disabled && !readOnly,
    onBlur: ({ editor }) => {
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
      canUndo: e?.can().undo() ?? false,
      canRedo: e?.can().redo() ?? false,
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
    if (editorState.isH4) return ['h4'];
    return [];
  };

  const getActiveListValue = () => {
    if (editorState.isBulletList) return ['bullet'];
    if (editorState.isOrderedList) return ['ordered'];
    return [];
  };

  const showTextFormatting = options.bold || options.italic;
  const showHeadings = headingLevels.length > 0;
  const showLists = options.lists.bullet || options.lists.ordered;
  const showHistory = options.history;

  // Track which groups are visible for separator logic
  const visibleGroups = [
    showTextFormatting,
    showHeadings,
    showLists,
    showHistory,
  ].filter(Boolean);
  const hasToolbar = visibleGroups.length > 0;

  return (
    <div className={editorContainerVariants()}>
      <EditorContent
        editor={editor}
        className={editorContentStyles}
        onBlur={onBlur}
      />
      {hasToolbar && (
        <Toolbar.Root className={toolbarStyles}>
          {showTextFormatting && (
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
                {options.bold && (
                  <ToolbarButton
                    className={toolbarButtonStyles}
                    disabled={isDisabled}
                    value="bold"
                    aria-label="Bold"
                  >
                    <Bold />
                  </ToolbarButton>
                )}
                {options.italic && (
                  <ToolbarButton
                    className={toolbarButtonStyles}
                    disabled={isDisabled}
                    value="italic"
                    aria-label="Italic"
                  >
                    <Italic />
                  </ToolbarButton>
                )}
              </ToggleGroup>
            </Toolbar.Group>
          )}

          {showTextFormatting && showHeadings && (
            <Toolbar.Separator className={toolbarSeparatorStyles} />
          )}

          {showHeadings && (
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
                    } else if (editorState.isH4) {
                      editor.chain().focus().toggleHeading({ level: 4 }).run();
                    }
                  }
                }}
              >
                {options.headings.h1 && (
                  <ToolbarButton
                    className={toolbarButtonStyles}
                    disabled={isDisabled}
                    value="h1"
                    aria-label="Heading 1"
                  >
                    <Heading1 />
                  </ToolbarButton>
                )}
                {options.headings.h2 && (
                  <ToolbarButton
                    className={toolbarButtonStyles}
                    disabled={isDisabled}
                    value="h2"
                    aria-label="Heading 2"
                  >
                    <Heading2 />
                  </ToolbarButton>
                )}
                {options.headings.h3 && (
                  <ToolbarButton
                    className={toolbarButtonStyles}
                    disabled={isDisabled}
                    value="h3"
                    aria-label="Heading 3"
                  >
                    <Heading3 />
                  </ToolbarButton>
                )}
                {options.headings.h4 && (
                  <ToolbarButton
                    className={toolbarButtonStyles}
                    disabled={isDisabled}
                    value="h4"
                    aria-label="Heading 4"
                  >
                    <Heading4 />
                  </ToolbarButton>
                )}
              </ToggleGroup>
            </Toolbar.Group>
          )}

          {(showTextFormatting || showHeadings) && showLists && (
            <Toolbar.Separator className={toolbarSeparatorStyles} />
          )}

          {showLists && (
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
                {options.lists.bullet && (
                  <ToolbarButton
                    className={toolbarButtonStyles}
                    disabled={isDisabled}
                    value="bullet"
                    aria-label="Bullet list"
                  >
                    <List />
                  </ToolbarButton>
                )}
                {options.lists.ordered && (
                  <ToolbarButton
                    className={toolbarButtonStyles}
                    disabled={isDisabled}
                    value="ordered"
                    aria-label="Numbered list"
                  >
                    <ListOrdered />
                  </ToolbarButton>
                )}
              </ToggleGroup>
            </Toolbar.Group>
          )}

          {(showTextFormatting || showHeadings || showLists) && showHistory && (
            <Toolbar.Separator className={toolbarSeparatorStyles} />
          )}

          {showHistory && (
            <Toolbar.Group className={toolbarGroupStyles}>
              <ToolbarButton
                className={toolbarButtonStyles}
                disabled={isDisabled || !editorState.canUndo}
                aria-label="Undo"
                onClick={() => editor.chain().focus().undo().run()}
              >
                <Undo />
              </ToolbarButton>
              <ToolbarButton
                className={toolbarButtonStyles}
                disabled={isDisabled || !editorState.canRedo}
                aria-label="Redo"
                onClick={() => editor.chain().focus().redo().run()}
              >
                <Redo />
              </ToolbarButton>
            </Toolbar.Group>
          )}
        </Toolbar.Root>
      )}
    </div>
  );
}
