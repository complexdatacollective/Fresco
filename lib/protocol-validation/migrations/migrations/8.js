/**
 * Migration from v7 to v8
 */

const migration = (protocol) => protocol;

// Markdown format
const notes = `
- New interface: "anonymisation interface". Allows the participant to encrypt sensitive/identifiable information, so that it cannot be read by the researcher.
- New interface: "one-to-many dyad-census". Allows the participant to link multiple alters at a time.
- New interface: "Family tree census": Allows the participant to construct hierarchical networks, such as family trees.
- Add new validation options for form fields: \`greaterThanVariable\` and \`lessThanVariable\`.
- Add new comparator options for skip logic and filter: \`contains\` and \`does not contain\`.
- Amplify comparator options \`includes\` and \`excludes\` for ordinal and categorical variables to allow multiple selections.
`;

const v8 = {
  version: 8,
  notes,
  migration,
};

export default v8;
