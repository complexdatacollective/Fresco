import { serialize } from 'remark-slate';

// Escape any characters that could cause markdown to be generated
const escapeMarkdownChars = (string) => string
  .replace(/\\/g, '\\\\')
  .replace(/(^\d+)+(\.)/g, '$1\\$2')
  .replace(/\*/g, '\\*')
  .replace(/_/g, '\\_')
  .replace(/-/g, '\\-')
  .replace(/(\s*)#+(\s)/g, '$1\\#$2')
  .replace(/`/g, '\\`')
  .replace(/\[/g, '\\[')
  .replace(/\]/g, '\\]');

const escapeNode = (node) => {
  if (node.children) {
    return {
      ...node,
      children: node.children.map((child) => escapeNode(child)),
    };
  }

  if (node.text) {
    return {
      ...node,
      text: escapeMarkdownChars(node.text),
    };
  }

  return node;
};

const serializeNodes = (nodes) => (
  nodes.map((n) => serialize(escapeNode(n))).join('\n')
);

export default serializeNodes;
