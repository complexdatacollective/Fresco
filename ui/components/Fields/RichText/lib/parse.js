import slate from 'remark-slate';
import unified from 'unified';
import markdown from 'remark-parse';
import { isEmpty } from 'lodash';

export const defaultValue = [{
  type: 'paragraph',
  children: [
    { text: '' },
  ],
}];

/**
 * Hack for `>` characters that already exist in some protocols
 * and will be interpreted as block quotes on first load
 * Encoding this way forces slate to treat them as paragraphs.
 *
 * This function is also used by <Markdown> to sanitize incoming
 * strings.
 *
 * This was implemented as two successive 'replace' operations
 * rather than a single regex, because Safari does not support
 * lookbehind.
 */
export const escapeAngleBracket = (value = '') => value.replace(/>/g, '&gt;').replace(/<br&gt;/g, '<br>');

// TODO: Can we make this synchronous? JM - yes, use `processSync` below
const parse = (value) => {
  // If for some reason we encounter 'content' with no content,
  // Slate rendering will be messed up. Instead, return a
  // 'proper' empty node.
  //
  // The regex tests for presence of only space/tab/break
  if (!value || isEmpty(value) || !/\S/.test(value)) {
    return Promise.resolve(defaultValue);
  }

  return unified()
    .use(markdown)
    .use(slate)
    .process(escapeAngleBracket(value))
    .then(({ result }) => (result));
};

export default parse;
