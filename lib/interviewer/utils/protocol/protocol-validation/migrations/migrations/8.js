/**
 * Migration from v7 to v8
 */


/**
 * If the stage is a sociogram, move the layout and sort order into the stage
 * level.
 *
 * Also make stage.subject a collection.
 */
const migrateStages = (stages = []) => stages.map((stage) => {
  if (stage.type !== 'Sociogram') {
    return stage;
  }

  return {
    ...stage,
    subject: [stage.subject],
    layout: {
      [stage.subject.type]: stage.prompts[0].layout.layoutVariable,
    },
    sortOrder: stage.prompts[0].sortOrder,
    prompts: stage.prompts.map(({ layout, sortOrder, ...prompt }) => ({
      ...prompt,
    })),
  };
});

const migration = protocol => ({
  ...protocol,
  stages: migrateStages(protocol.stages),
});

// Markdown format
const notes = `
- Introduce two-mode capabilities to the sociogram. As a result, the layout and initial (unplaced) sortOrder properties are moved to the stage level. This process is handled automatically by the migration script. In situations where different prompts 
  have different layouts, the layout will be set to the value from the first prompt.
- Add new validation options for form fields: \`greaterThanVariable\` and \`lessThanVariable\`.
- Add new comparator options for skip logic and filter: \`contains\` and \`does not contain\`.
- Amplify comparator options \`includes\` and \`excludes\` for ordinal and categorical variables to allow multiple selections.
`;

const v8 = {
  version: 8,
  notes,
  migration,
};

module.exports = v8;
