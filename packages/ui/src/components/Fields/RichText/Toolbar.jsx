import React from 'react';
import { useSlate } from 'slate-react';
import { isBlockActive, smartInsertThematicBreak } from './lib/actions';
import { toggleBlockquote } from './lib/blockquotes';
import { MarkButton, BlockButton, ToolbarButton } from './ToolbarButton';
import { TOOLBAR_ITEMS } from './lib/options';

const Toolbar = () => {
  const editor = useSlate();
  const { disallowedTypes } = editor;
  const filteredItems = TOOLBAR_ITEMS.filter((item) => !disallowedTypes.includes(item));

  return (
    <div className="rich-text__toolbar">
      {filteredItems.includes('bold') && <MarkButton format="bold" icon="bold" tooltip="Bold" />}
      {filteredItems.includes('italic') && <MarkButton format="italic" icon="italic" tooltip="Italic" />}
      {filteredItems.includes('headings') && (
        <>
          <div className="toolbar-spacer" />
          <BlockButton format="heading_one" icon="h1" tooltip="Heading One" />
          <BlockButton format="heading_two" icon="h2" tooltip="Heading Two" />
          <BlockButton format="heading_three" icon="h3" tooltip="Heading Three" />
          <BlockButton format="heading_four" icon="h4" tooltip="Heading Four" />
        </>
      )}
      {filteredItems.includes('quote') && (
        <>
          <div className="toolbar-spacer" />
          <ToolbarButton
            icon="quote"
            tooltip="Quote"
            isActive={isBlockActive(editor, 'block_quote')}
            action={() => toggleBlockquote(editor)}
          />
        </>
      )}
      {filteredItems.includes('lists') && (
        <>
          <div className="toolbar-spacer" />
          <BlockButton format="ol_list" icon="ol" tooltip="Numbered List" />
          <BlockButton format="ul_list" icon="ul" tooltip="Bulleted List" />
        </>
      )}
      {filteredItems.includes('thematic_break') && (
        <>
          <div className="toolbar-spacer" />
          <ToolbarButton action={() => smartInsertThematicBreak(editor)} icon="hr" tooltip="Thematic Break" />
        </>
      )}
      {filteredItems.includes('history') && (
        <>
          <div className="toolbar-spacer" />
          <ToolbarButton
            icon="undo"
            tooltip="Undo"
            action={editor.undo}
          />
          <ToolbarButton
            icon="redo"
            tooltip="Redo"
            action={editor.redo}
          />
        </>
      )}
    </div>
  );
};

export default Toolbar;
