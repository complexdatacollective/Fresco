import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { Editable, withReact, Slate } from 'slate-react';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import isHotkey from 'is-hotkey';
import { compose, isEmpty } from 'lodash/fp';
import { EditListPlugin } from '@productboard/slate-edit-list';
import withNormalize from './lib/withNormalize';
import withVoids from './lib/withVoids';
import { toggleMark } from './lib/actions';
import serialize from './lib/serialize';
import parse, { defaultValue } from './lib/parse';
import { INLINE_DISALLOWED_ITEMS, ALWAYS_DISALLOWED } from './lib/options';
import Element from './Element';
import Leaf from './Leaf';
import Toolbar from './Toolbar';
import RichTextContainer from './RichTextContainer';

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
};

const [withEditList, listOnKeyDown, { Editor, Transforms }] = EditListPlugin({
  maxDepth: 1, // Restrict list depth to one, for now.
});

const hotkeyOnKeyDown = (editor) => (event) => {
  Object.keys(HOTKEYS).forEach((hotkey) => {
    if (isHotkey(hotkey, event)) {
      event.preventDefault();
      const mark = HOTKEYS[hotkey];
      toggleMark(editor, mark, Transforms, Editor);
    }
  });
};

/**
 * This rich text component is UI for editing markdown.
 *
 * It uses the `slate` library to manage the document,
 * which uses it's own tree-like structure internally,
 * and parse and serialize methods to read and set the
 * value externally.
 *
 * Slate's internal tree is not specific to markdown,
 * the element types and leaf types are arbitrary - in
 * this case we are using the types provided by our
 * very opinionated serialize/parse library `remark-slate`.
 *
 * The other notable feature is our normalizer. When
 * document is updated, this method is run for each node
 * and is how we restrict block types and force single
 * line mode.
 *
 * This editor has two props that set its operation:
 * - 'inline' (bool):
 *   determines if elements that would cause a line
 *   break or block level element can be created.
 *   Default is false.
 *
 * - 'disallowedTypes' (array):
 *   Array containing any 'type' listed in options.js
 *   which will then be excluded from the toolbar and
 *   markdown shortcuts.
 *
 * @param {bool} autoFocus Focus input automatically when
 * rendered.
 * @param {bool} inline determines if elements that would
 * cause a line break or block level element can be created.
 * @param {array} disallowedTypes Array containing any
 * 'type' listed in options.js which will then be excluded
 * from the toolbar and markdown shortcuts.
 * @param {func} onChange Will receive a markdown value when
 * the document changes
 * @param {string} value Expects a value which will be used
 * as the *starting* value for the field, will not be used
 * subsequently as state is managed internally.
 */

const RichText = ({
  autoFocus,
  inline,
  disallowedTypes,
  onChange,
  value: initialValue,
  placeholder,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [lastChange, setLastChange] = useState(initialValue);

  // Use the inline prop to optionally merge additional disallowed items
  const disallowedTypesWithDefaults = [
    ...disallowedTypes,
    ...[...(inline ? INLINE_DISALLOWED_ITEMS : [])],
    ...ALWAYS_DISALLOWED,
  ];

  const withOptions = (e) => Object.assign(e, {
    inline,
    disallowedTypes: disallowedTypesWithDefaults,
  });

  const editor = useMemo(
    () => compose(
      withVoids,
      withNormalize,
      withOptions,
      withEditList,
      withHistory,
      withReact,
    )(createEditor()),
    [disallowedTypesWithDefaults.join()],
  );

  // Test if there is no text content in the tree
  const childrenAreEmpty = (children) => children.every((child) => {
    // Thematic break has no text, but still counts as content.
    if (child.type === 'thematic_break') {
      return false;
    }

    if (child.children) {
      return childrenAreEmpty(child.children);
    }

    // The regexp here means that content only containing spaces or
    // tabs will be considered empty!
    return isEmpty(child.text) || !/\S/.test(child.text);
  });

  const getSerializedValue = () => {
    if (childrenAreEmpty(editor.children)) {
      return '';
    }
    return serialize(value);
  };

  const setInitialValue = () => parse(initialValue)
    .then((parsedValue) => {
      // we need to reset the cursor state because the value length may have changed
      Transforms.deselect(editor);
      setValue(parsedValue);
    });

  // Set starting state from prop value on start up
  useEffect(() => {
    setInitialValue()
      .then(() => setIsInitialized(true));
  }, []);

  // Set value again when initial value changes
  useEffect(() => {
    // If value matches the last reported change do not set value;
    if (initialValue === lastChange) { return; }
    setInitialValue();
  }, [initialValue]);

  // Update upstream on change
  useEffect(() => {
    if (!isInitialized) { return; }

    const nextValue = getSerializedValue();

    // Is this optimization necessary?
    if (nextValue === lastChange) {
      return;
    }

    setLastChange(nextValue);
    onChange(nextValue);
  }, [value]);

  const handleKeyDown = useCallback((event) => {
    hotkeyOnKeyDown(editor)(event);
    listOnKeyDown(editor)(event);
  }, [editor]);

  return (
    <Slate editor={editor} value={value} onChange={setValue}>
      <RichTextContainer>
        <Toolbar />
        <div className={`rich-text__editable ${inline ? 'rich-text__editable--inline' : ''}`}>
          <Editable
            renderElement={Element}
            renderLeaf={Leaf}
            placeholder={(<em style={{ userSelect: 'none' }}>{placeholder}</em>)}
            spellCheck
            autoFocus={autoFocus}
            onKeyDown={handleKeyDown}
          />
        </div>
      </RichTextContainer>
    </Slate>
  );
};

RichText.propTypes = {
  value: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  inline: PropTypes.bool,
  disallowedTypes: PropTypes.array,
  autoFocus: PropTypes.bool,
};

RichText.defaultProps = {
  value: '',
  placeholder: 'Enter some text...',
  onChange: () => {},
  inline: false,
  disallowedTypes: [],
  autoFocus: false,
};

export default RichText;
