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
      let insideSafeLoader = false;

      function reportPrismaUsage(node) {
        context.report({
          node,
          message: `Avoid using Prisma queries directly. Use the data mapper safeLoader function for querying the database.`,
        });
      }

      return {
        'CallExpression': function (node) {
          if (node.callee.name === 'safeLoader') {
            insideSafeLoader = true;
          }
        },
        'MemberExpression': function (node) {
          if (!insideSafeLoader && node.object.name === 'prisma') {
            reportPrismaUsage(node);
          }
        },
        'CallExpression:exit': function (node) {
          if (node.callee.name === 'safeLoader') {
            insideSafeLoader = false;
          }
        },
      };
    },
  },
};
