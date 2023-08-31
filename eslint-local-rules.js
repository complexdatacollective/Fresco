// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use strict';

module.exports = {
  'require-data-mapper': {
    meta: {
      docs: {
        description: 'Require data mapper',
        category: 'Best Practices',
        recommended: true,
      },
      schema: [],
    },
    create: function (context) {
      return {
        MemberExpression: function (node) {
          const objectName = node.object.name;

          if (objectName === 'prisma') {
            context.report({
              node,
              message: `Avoid using Prisma queries directly. Use the data mapper safeLoader instead.`,
            });
          }
        },
      };
    },
  },
};
