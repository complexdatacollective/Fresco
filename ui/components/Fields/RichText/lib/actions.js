import {
  Element as SlateElement,
  Editor,
  Transforms,
} from 'slate';
import { EditListPlugin } from '@productboard/slate-edit-list';
import { insertThematicBreak } from './utils';
import { BLOCK_TYPES } from './options';

const LIST_TYPES = ['ul_list', 'ol_list'];

const [, , { Transforms: EditListTransforms }] = EditListPlugin();

const getNewType = ({ isActive, isList, format }) => {
  if (isList) { return 'list_item'; }
  // If isActive is set, format already set. Remove it.
  if (isActive) { return 'paragraph'; }
  // Otherwise return the new format ready to apply
  return format;
};

const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => (
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format
    ),
  });

  return !!match;
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  // If we are formatting a list and in one, unwrap
  if (isList && isActive) {
    EditListTransforms.unwrapList(editor, format);
    return; // Important that we do not setNodes() after this
  }

  // If we are formatting a list but not it in one, wrap
  if (isList && !isActive) {
    EditListTransforms.wrapInList(editor, format);
  }

  if (!isList) {
    const newProperties = {
      type: getNewType({ isActive, isList, format }),
    };

    Transforms.setNodes(editor, newProperties);
  }
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const smartInsertThematicBreak = (editor) => {
  const isWithinBlock = BLOCK_TYPES.some((format) => isBlockActive(editor, format));

  if (isWithinBlock) { return; }

  insertThematicBreak(editor);
};

export {
  toggleMark,
  toggleBlock,
  isMarkActive,
  isBlockActive,
  smartInsertThematicBreak,
};
