/* eslint-disable no-param-reassign */

const VOID_TYPES = ['thematic_break'];

const withVoids = (editor) => {
  const { isVoid } = editor;
  editor.isVoid = (element) => {
    if (VOID_TYPES.includes(element.type)) { return true; }
    return isVoid(element);
  };

  return editor;
};

export default withVoids;
