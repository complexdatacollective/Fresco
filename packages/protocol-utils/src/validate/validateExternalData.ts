// Variables and option values must respect NMTOKEN rules so that
// they are compatable with XML export formats
const allowedVariableName = (value: string) => {
  if (!/^[a-zA-Z0-9._\-:]+$/.test(value)) {
    return 'Not a valid variable name. Only letters, numbers and the symbols ._-: are supported.';
  }
  return undefined;
};

const validateNames = (items = []) => {
  const errors = items
    .filter(item => allowedVariableName(item) !== undefined);

  if (errors.length === 0) { return false; }

  return `Variable name not allowed ("${errors.join('", "')}"). Only letters, numbers and the symbols ._-: are supported.`;
};

export default {
  validateNames,
}
