/* eslint-disable import/prefer-default-export */
import {
  Editor,
  Range,
  Transforms,
} from 'slate';

export const getContainerBlockAtCursor = (editor) => (
  Editor.above(editor, {
    match: (n) => Editor.isBlock(editor, n),
    mode: 'highest',
  })
);

export const getContainerBlocksAtSelection = (editor) => {
  const nodes = Editor.nodes(editor);

  const blocks = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const node of nodes) {
    // Top level nodes only
    if (node[1].length === 1) {
      blocks.push(node);
    }
  }

  return blocks;
};

export const getBlocks = (editor) => {
  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);

  if (isCollapsed) {
    return [getContainerBlockAtCursor(editor)];
  }

  return getContainerBlocksAtSelection(editor);
};

export const insertThematicBreak = (editor) => {
  Transforms.insertNodes(editor, [
    { type: 'thematic_break', children: [{ text: '' }] },
    { type: 'paragraph', children: [{ text: '' }] },
  ]);

  Transforms.move(editor, { unit: 'line', distance: 1 });
};
