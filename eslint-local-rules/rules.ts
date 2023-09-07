import type { Rule } from 'eslint';

type CustomRule = Record<string, Rule.RuleModule>;

type CallExpressionNode = Rule.Node & {
  callee: {
    name: string;
  };
};

type MemberExpressionNode = Rule.Node & {
  object: {
    type: string;
    name: string;
  };
};

export default {
  'require-data-mapper': {
    meta: {
      docs: {
        description: 'Require data mapper',
        category: 'Best Practices',
        recommended: true,
      },
      schema: [],
    },
    create: function (context: Rule.RuleContext) {
      let insideSafeLoader = false;

      function reportPrismaUsage(node: Rule.Node) {
        context.report({
          node,
          message: `Avoid using Prisma queries directly. Use the data mapper safeLoader function for querying the database.`,
        });
      }

      return {
        'CallExpression': function (node: CallExpressionNode) {
          if (node.callee.name === 'safeLoader') {
            insideSafeLoader = true;
          }
        },
        'MemberExpression': function (node: MemberExpressionNode) {
          if (
            !insideSafeLoader &&
            node.object.type === 'Identifier' &&
            node.object.name === 'prisma'
          ) {
            reportPrismaUsage(node);
          }
        },
        'CallExpression:exit': function (node: CallExpressionNode) {
          if (node.callee.name === 'safeLoader') {
            insideSafeLoader = false;
          }
        },
      };
    },
  },
} as CustomRule;
