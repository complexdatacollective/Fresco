/* eslint-env jest */
const predicate = require('../predicate').default;
const operators = require('../predicate').operators;
const countOperators = require('../predicate').countOperators;

/**
 * Should cover all variable types:
 * - number
 * - string
 * - date
 * - boolean
 * - categorical
 * - ordinal
 * - scalar
 */

describe('predicate', () => {
  it('default', () => {
    expect(predicate(null)({ value: null, other: null })).toBe(false);
  });

  describe('operators', () => {
    describe('GREATER_THAN', () => {
      it('number', () => {
        expect(
          predicate(operators.GREATER_THAN)({ value: 1.5, other: 1 }),
        ).toBe(true);
        expect(
          predicate(operators.GREATER_THAN)({ value: 2, other: 2 }),
        ).toBe(false);
      });
      it('date', () => {
        expect(
          predicate(operators.GREATER_THAN)({ value: '2018-01-01', other: '2017-01-01' }),
        ).toBe(true);
        expect(
          predicate(operators.GREATER_THAN)({ value: '2018-01-01', other: '2018-01-01' }),
        ).toBe(false);
      });

      it('scalar', () => {
        expect(
          predicate(operators.GREATER_THAN)({ value: 0.5, other: 0.3 }),
        ).toBe(true);
        expect(
          predicate(operators.GREATER_THAN)({ value: 0.1, other: 0.2 }),
        ).toBe(false);
      });
    });

    describe('LESS_THAN', () => {
      it('number', () => {
        expect(
          predicate(operators.LESS_THAN)({ value: 1, other: 1.5 }),
        ).toBe(true);
        expect(
          predicate(operators.LESS_THAN)({ value: 2, other: 2 }),
        ).toBe(false);
      });
      it('date', () => {
        expect(
          predicate(operators.LESS_THAN)({ value: '2017-01-01', other: '2018-01-01' }),
        ).toBe(true);
        expect(
          predicate(operators.LESS_THAN)({ value: '2018-01-01', other: '2018-01-01' }),
        ).toBe(false);
      });

      it('scalar', () => {
        expect(
          predicate(operators.LESS_THAN)({ value: 0.3, other: 0.5 }),
        ).toBe(true);
        expect(
          predicate(operators.LESS_THAN)({ value: 0.2, other: 0.1 }),
        ).toBe(false);
      });
    });

    describe('GREATER_THAN_OR_EQUAL', () => {
      it('number', () => {
        expect(
          predicate(operators.GREATER_THAN_OR_EQUAL)({ value: 1.5, other: 1 }),
        ).toBe(true);
        expect(
          predicate(operators.GREATER_THAN_OR_EQUAL)({ value: 2, other: 2 }),
        ).toBe(true);
        expect(
          predicate(operators.GREATER_THAN_OR_EQUAL)({ value: 2, other: 3 }),
        ).toBe(false);
      });
      it('date', () => {
        expect(
          predicate(operators.GREATER_THAN_OR_EQUAL)({ value: '2018-01-01', other: '2017-01-01' }),
        ).toBe(true);
        expect(
          predicate(operators.GREATER_THAN_OR_EQUAL)({ value: '2018-01-01', other: '2018-01-01' }),
        ).toBe(true);
        expect(
          predicate(operators.GREATER_THAN_OR_EQUAL)({ value: '2018-01-01', other: '2019-01-01' }),
        ).toBe(false);
      });

      it('scalar', () => {
        expect(
          predicate(operators.GREATER_THAN_OR_EQUAL)({ value: 0.5, other: 0.3 }),
        ).toBe(true);
        expect(
          predicate(operators.GREATER_THAN_OR_EQUAL)({ value: 0.2, other: 0.2 }),
        ).toBe(true);
        expect(
          predicate(operators.GREATER_THAN_OR_EQUAL)({ value: 0.1, other: 0.2 }),
        ).toBe(false);
      });
    });

    describe('LESS_THAN_OR_EQUAL', () => {
      it('number', () => {
        expect(
          predicate(operators.LESS_THAN_OR_EQUAL)({ value: 1, other: 1.5 }),
        ).toBe(true);
        expect(
          predicate(operators.LESS_THAN_OR_EQUAL)({ value: 2, other: 2 }),
        ).toBe(true);
        expect(
          predicate(operators.LESS_THAN_OR_EQUAL)({ value: 3, other: 2 }),
        ).toBe(false);
      });

      it('date', () => {
        expect(
          predicate(operators.LESS_THAN_OR_EQUAL)({ value: '2017-01-01', other: '2018-01-01' }),
        ).toBe(true);
        expect(
          predicate(operators.LESS_THAN_OR_EQUAL)({ value: '2018-01-01', other: '2018-01-01' }),
        ).toBe(true);
        expect(
          predicate(operators.LESS_THAN_OR_EQUAL)({ value: '2019-01-01', other: '2018-01-01' }),
        ).toBe(false);
      });

      it('scalar', () => {
        expect(
          predicate(operators.LESS_THAN_OR_EQUAL)({ value: 0.3, other: 0.5 }),
        ).toBe(true);
        expect(
          predicate(operators.LESS_THAN_OR_EQUAL)({ value: 0.2, other: 0.2 }),
        ).toBe(true);
        expect(
          predicate(operators.LESS_THAN_OR_EQUAL)({ value: 0.2, other: 0.1 }),
        ).toBe(false);
      });
    });

    describe('EXACTLY', () => {
      it('number', () => {
        expect(
          predicate(operators.EXACTLY)({ value: 1, other: 1 }),
        ).toBe(true);
        expect(
          predicate(operators.EXACTLY)({ value: 2, other: 1 }),
        ).toBe(false);
        expect(
          predicate(operators.EXACTLY)({ value: null, other: 0 }),
        ).toBe(false);
      });
      it('string', () => {
        expect(
          predicate(operators.EXACTLY)({ value: 'word', other: 'word' }),
        ).toBe(true);
        expect(
          predicate(operators.EXACTLY)({ value: 'not word', other: 'word' }),
        ).toBe(false);
        expect(
          predicate(operators.EXACTLY)({ value: null, other: 'word' }),
        ).toBe(false);
      });
      it('boolean', () => {
        expect(
          predicate(operators.EXACTLY)({ value: true, other: true }),
        ).toBe(true);
        expect(
          predicate(operators.EXACTLY)({ value: false, other: true }),
        ).toBe(false);
        expect(
          predicate(operators.EXACTLY)({ value: null, other: true }),
        ).toBe(false);
        expect(
          predicate(operators.EXACTLY)({ value: true, other: false }),
        ).toBe(false);
        expect(
          predicate(operators.EXACTLY)({ value: false, other: false }),
        ).toBe(true);
        expect(
          predicate(operators.EXACTLY)({ value: null, other: false }),
        ).toBe(false);
        expect(
          predicate(operators.EXACTLY)({ value: false, other: null }),
        ).toBe(false);
      });

      it('categorical', () => {
        expect(
          predicate(operators.EXACTLY)({ value: ['f'], other: ['f'] }),
        ).toBe(true);

        expect(
          predicate(operators.EXACTLY)({ value: ['f'], other: ['f', 'm'] }),
        ).toBe(false);

        // Order shouldn't matter
        expect(
          predicate(operators.EXACTLY)({ value: ['f', 'm'], other: ['f', 'm'] }),
        ).toBe(true);

        expect(
          predicate(operators.EXACTLY)({ value: ['m', 'f'], other: ['f', 'm'] }),
        ).toBe(true);

        expect(
          predicate(operators.EXACTLY)({ value: [1], other: [1] }),
        ).toBe(true);

        expect(
          predicate(operators.EXACTLY)({ value: [1], other: [1, 2] }),
        ).toBe(false);

        /**
         * Expect true when value is an array with a single item
         * and varaiableValue is that single item
         *
         * Expect false if value is an array with multiple items
         * and variableValue is a single item
         *
         * Expect false if value is an array with single item
         * and variableValue is a different single item
         *
         * This checks that the categorical variable skip logic bugfix in predicate is working
         */
        expect(
          predicate(operators.EXACTLY)({ value: ['f'], other: 'f' }),
        ).toBe(true);

        expect(
          predicate(operators.EXACTLY)({ value: ['f'], other: 'm' }),
        ).toBe(false);

        expect(
          predicate(operators.EXACTLY)({ value: [1], other: 1 }),
        ).toBe(true);

        expect(
          predicate(operators.EXACTLY)({ value: [1], other: 2 }),
        ).toBe(false);

        expect(
          predicate(operators.EXACTLY)({ value: ['f', 'm'], other: 'f' }),
        ).toBe(false);

        expect(
          predicate(operators.EXACTLY)({ value: [1, 2], other: 1 }),
        ).toBe(false);
      });

      it('ordinal', () => {
        expect(
          predicate(operators.EXACTLY)({ value: 'f', other: 'f' }),
        ).toBe(true);

        expect(
          predicate(operators.EXACTLY)({ value: 'f', other: 'm' }),
        ).toBe(false);

        expect(
          predicate(operators.EXACTLY)({ value: 1, other: 1 }),
        ).toBe(true);

        expect(
          predicate(operators.EXACTLY)({ value: 1, other: 2 }),
        ).toBe(false);

        expect(
          predicate(operators.EXACTLY)({ value: true, other: true }),
        ).toBe(true);

        expect(
          predicate(operators.EXACTLY)({ value: true, other: false }),
        ).toBe(false);
      });

      it('scalar', () => {
        expect(
          predicate(operators.EXACTLY)({ value: 1, other: 1 }),
        ).toBe(true);
        expect(
          predicate(operators.EXACTLY)({ value: 0.5, other: 1 }),
        ).toBe(false);
      });

      it('date', () => {
        expect(
          predicate(operators.EXACTLY)({ value: '2012-05-18', other: '2012-05-18' }),
        ).toBe(true);

        expect(
          predicate(operators.EXACTLY)({ value: '2012-05-18', other: '2012-05-19' }),
        ).toBe(false);
      });
    });

    describe('NOT', () => {
      it('number', () => {
        expect(
          predicate(operators.NOT)({ value: 1, other: 1 }),
        ).toBe(false);
        expect(
          predicate(operators.NOT)({ value: 2, other: 1 }),
        ).toBe(true);
        expect(
          predicate(operators.NOT)({ value: null, other: 0 }),
        ).toBe(true);
      });

      it('string', () => {
        expect(
          predicate(operators.NOT)({ value: 'word', other: 'word' }),
        ).toBe(false);
        expect(
          predicate(operators.NOT)({ value: 'not word', other: 'word' }),
        ).toBe(true);
        expect(
          predicate(operators.NOT)({ value: null, other: 'word' }),
        ).toBe(true);
      });

      it('boolean', () => {
        expect(
          predicate(operators.NOT)({ value: true, other: true }),
        ).toBe(false);
        expect(
          predicate(operators.NOT)({ value: false, other: true }),
        ).toBe(true);
        expect(
          predicate(operators.NOT)({ value: null, other: true }),
        ).toBe(true);
        expect(
          predicate(operators.NOT)({ value: true, other: false }),
        ).toBe(true);
        expect(
          predicate(operators.NOT)({ value: false, other: false }),
        ).toBe(false);
        expect(
          predicate(operators.NOT)({ value: null, other: false }),
        ).toBe(true);
        expect(
          predicate(operators.NOT)({ value: false, other: null }),
        ).toBe(true);
      });

      it('categorical', () => {
        expect(
          predicate(operators.NOT)({ value: ['f'], other: ['f'] }),
        ).toBe(false);

        expect(
          predicate(operators.NOT)({ value: ['f'], other: ['f', 'm'] }),
        ).toBe(true);

        // Order shouldn't matter
        expect(
          predicate(operators.NOT)({ value: ['f', 'm'], other: ['f', 'm'] }),
        ).toBe(false);

        expect(
          predicate(operators.NOT)({ value: ['m', 'f'], other: ['f', 'm'] }),
        ).toBe(false);

        expect(
          predicate(operators.NOT)({ value: [1], other: [1] }),
        ).toBe(false);

        expect(
          predicate(operators.NOT)({ value: [1], other: [1, 2] }),
        ).toBe(true);
      });

      it('ordinal', () => {
        expect(
          predicate(operators.NOT)({ value: 'f', other: 'f' }),
        ).toBe(false);

        expect(
          predicate(operators.NOT)({ value: 'f', other: 'm' }),
        ).toBe(true);

        expect(
          predicate(operators.NOT)({ value: 1, other: 1 }),
        ).toBe(false);

        expect(
          predicate(operators.NOT)({ value: 1, other: 2 }),
        ).toBe(true);

        expect(
          predicate(operators.NOT)({ value: true, other: true }),
        ).toBe(false);

        expect(
          predicate(operators.NOT)({ value: true, other: false }),
        ).toBe(true);
      });

      it('scalar', () => {
        expect(
          predicate(operators.NOT)({ value: 1, other: 1 }),
        ).toBe(false);
        expect(
          predicate(operators.NOT)({ value: 0.5, other: 1 }),
        ).toBe(true);
      });

      it('date', () => {
        expect(
          predicate(operators.NOT)({ value: '2012-05-18', other: '2012-05-18' }),
        ).toBe(false);

        expect(
          predicate(operators.NOT)({ value: '2012-05-18', other: '2012-05-19' }),
        ).toBe(true);
      });
    });

    describe('CONTAINS', () => {
      it('string', () => {
        expect(
          predicate(operators.CONTAINS)({ value: 'word', other: 'wo' }),
        ).toBe(true);
        expect(
          predicate(operators.CONTAINS)({ value: 'word', other: '^w' }),
        ).toBe(true);
        expect(
          predicate(operators.CONTAINS)({ value: 'word', other: '^g' }),
        ).toBe(false);
      });
    });

    describe('DOES_NOT_CONTAIN', () => {
      it('string', () => {
        expect(
          predicate(operators.DOES_NOT_CONTAIN)({ value: 'word', other: 'go' }),
        ).toBe(true);
        expect(
          predicate(operators.DOES_NOT_CONTAIN)({ value: 'word', other: '^g' }),
        ).toBe(true);
        expect(
          predicate(operators.DOES_NOT_CONTAIN)({ value: 'word', other: '^w' }),
        ).toBe(false);
      });
    });

    it('EXISTS', () => {
      expect(
        predicate(operators.EXISTS)({ value: null }),
      ).toBe(false);
      expect(
        predicate(operators.EXISTS)({ value: 1 }),
      ).toBe(true);
    });

    it('NOT_EXISTS', () => {
      expect(
        predicate(operators.NOT_EXISTS)({ value: 1 }),
      ).toBe(false);
      expect(
        predicate(operators.NOT_EXISTS)({ value: null }),
      ).toBe(true);
    });

    describe('INCLUDES', () => {
      it('Other = string', () => {
        expect(
          predicate(operators.INCLUDES)({ value: ['a'], other: 'a' }),
        ).toBe(true);
        expect(
          predicate(operators.INCLUDES)({ value: ['a', 'b'], other: 'a' }),
        ).toBe(true);
        expect(
          predicate(operators.INCLUDES)({ value: ['c', 'd'], other: 'a' }),
        ).toBe(false);
        expect(
          predicate(operators.INCLUDES)({ value: ['d'], other: 'a' }),
        ).toBe(false);
        expect(
          predicate(operators.INCLUDES)({ value: 'a', other: 'a' }),
        ).toBe(true);
        expect(
          predicate(operators.INCLUDES)({ value: 'a', other: 'aa' }),
        ).toBe(false);
        expect(
          predicate(operators.INCLUDES)({ value: 6, other: 'a' }),
        ).toBe(false);
      });

      it('Other = array', () => {
        expect(
          predicate(operators.INCLUDES)({ value: ['a'], other: ['a', 'b'] }),
        ).toBe(false);
        expect(
          predicate(operators.INCLUDES)({ value: ['a', 'b'], other: ['a', 'b'] }),
        ).toBe(true);
        expect(
          predicate(operators.INCLUDES)({ value: ['c', 'd'], other: ['a', 'b'] }),
        ).toBe(false);
        expect(
          predicate(operators.INCLUDES)({ value: ['d'], other: ['a', 'b'] }),
        ).toBe(false);
        expect(
          predicate(operators.INCLUDES)({ value: 'a', other: ['a', 'b'] }),
        ).toBe(true);
        expect(
          predicate(operators.INCLUDES)({ value: 6, other: ['a', 'b'] }),
        ).toBe(false);
      });

      it('Other = integer', () => {
        expect(
          predicate(operators.INCLUDES)({ value: ['a'], other: 6 }),
        ).toBe(false);
        expect(
          predicate(operators.INCLUDES)({ value: ['a', 'b'], other: 6 }),
        ).toBe(false);
        expect(
          predicate(operators.INCLUDES)({ value: ['c', 'd'], other: 6 }),
        ).toBe(false);
        expect(
          predicate(operators.INCLUDES)({ value: ['d'], other: 6 }),
        ).toBe(false);
        expect(
          predicate(operators.INCLUDES)({ value: 'a', other: 6 }),
        ).toBe(false);
        expect(
          predicate(operators.INCLUDES)({ value: 6, other: 6 }),
        ).toBe(true);
      });
    });

    // True if other is not included in value
    describe('EXCLUDES', () => {
      it('Other = string', () => {
        expect(
          predicate(operators.EXCLUDES)({ value: ['a'], other: 'a' }),
        ).toBe(false);
        expect(
          predicate(operators.EXCLUDES)({ value: ['a', 'b'], other: 'a' }),
        ).toBe(false);
        expect(
          predicate(operators.EXCLUDES)({ value: ['a', 'c', 'd'], other: 'a' }),
        ).toBe(false);
        expect(
          predicate(operators.EXCLUDES)({ value: ['d'], other: 'a' }),
        ).toBe(true);
        expect(
          predicate(operators.EXCLUDES)({ value: 'a', other: 'a' }),
        ).toBe(false);
        expect(
          predicate(operators.EXCLUDES)({ value: 'a', other: 'aa' }),
        ).toBe(true);
        expect(
          predicate(operators.EXCLUDES)({ value: 6, other: 'a' }),
        ).toBe(true);
      });

      it('Other = array', () => {
        expect(
          predicate(operators.EXCLUDES)({ value: ['a'], other: ['a', 'b'] }),
        ).toBe(false);
        expect(
          predicate(operators.EXCLUDES)({ value: ['a', 'b'], other: ['a', 'b'] }),
        ).toBe(false);
        expect(
          predicate(operators.EXCLUDES)({ value: ['a', 'c', 'd'], other: ['a', 'b'] }),
        ).toBe(false);
        expect(
          predicate(operators.EXCLUDES)({ value: ['d'], other: ['a', 'b'] }),
        ).toBe(true);
        expect(
          predicate(operators.EXCLUDES)({ value: 'a', other: ['a', 'b'] }),
        ).toBe(false);
        expect(
          predicate(operators.EXCLUDES)({ value: 6, other: ['a', 'b'] }),
        ).toBe(true);
      });

      it('Other = integer', () => {
        expect(
          predicate(operators.EXCLUDES)({ value: ['a'], other: 6 }),
        ).toBe(true);
        expect(
          predicate(operators.EXCLUDES)({ value: ['a', 'b'], other: 6 }),
        ).toBe(true);
        expect(
          predicate(operators.EXCLUDES)({ value: ['a', 'c', 'd'], other: 6 }),
        ).toBe(true);
        expect(
          predicate(operators.EXCLUDES)({ value: ['d'], other: 6 }),
        ).toBe(true);
        expect(
          predicate(operators.EXCLUDES)({ value: 'a', other: 6 }),
        ).toBe(true);
        expect(
          predicate(operators.EXCLUDES)({ value: 6, other: 6 }),
        ).toBe(false);
      });
    });

    it('OPTIONS_GREATER_THAN', () => {
      const other = 2;
      const value1 = ['a', 'b'];
      const value2 = ['a', 'c', 'd'];

      expect(
        predicate(operators.OPTIONS_GREATER_THAN)({ value: value1, other }),
      ).toBe(false);
      expect(
        predicate(operators.OPTIONS_GREATER_THAN)({ value: value2, other }),
      ).toBe(true);
    });

    it('OPTIONS_LESS_THAN', () => {
      const other = 2;
      const value1 = ['a'];
      const value2 = ['a', 'c', 'd'];

      expect(
        predicate(operators.OPTIONS_LESS_THAN)({ value: value1, other }),
      ).toBe(true);
      expect(
        predicate(operators.OPTIONS_LESS_THAN)({ value: value2, other }),
      ).toBe(false);
    });


    it('OPTIONS_EQUALS', () => {
      const other = 2;
      const value1 = ['a', 'b'];
      const value2 = ['a', 'c', 'd'];

      expect(
        predicate(operators.OPTIONS_EQUALS)({ value: value1, other }),
      ).toBe(true);
      expect(
        predicate(operators.OPTIONS_EQUALS)({ value: value2, other }),
      ).toBe(false);
    });

    it('OPTIONS_NOT_EQUALS', () => {
      const other = 2;
      const value1 = ['a', 'b'];
      const value2 = ['a', 'c', 'd'];

      expect(
        predicate(operators.OPTIONS_NOT_EQUALS)({ value: value1, other }),
      ).toBe(false);
      expect(
        predicate(operators.OPTIONS_NOT_EQUALS)({ value: value2, other }),
      ).toBe(true);
    });
  });

  describe('Count operators', () => {
    it('COUNT_GREATER_THAN', () => {
      expect(
        predicate(countOperators.COUNT_GREATER_THAN)({ value: 1.5, other: 1 }),
      ).toBe(true);
      expect(
        predicate(countOperators.COUNT_GREATER_THAN)({ value: 2, other: 2 }),
      ).toBe(false);
    });

    it('COUNT_LESS_THAN', () => {
      expect(
        predicate(countOperators.COUNT_LESS_THAN)({ value: 1, other: 1.5 }),
      ).toBe(true);
      expect(
        predicate(countOperators.COUNT_LESS_THAN)({ value: 2, other: 2 }),
      ).toBe(false);
    });

    it('COUNT_GREATER_THAN_OR_EQUAL', () => {
      expect(
        predicate(countOperators.COUNT_GREATER_THAN_OR_EQUAL)({ value: 1.5, other: 1 }),
      ).toBe(true);
      expect(
        predicate(countOperators.COUNT_GREATER_THAN_OR_EQUAL)({ value: 2, other: 2 }),
      ).toBe(true);
      expect(
        predicate(countOperators.COUNT_GREATER_THAN_OR_EQUAL)({ value: 2, other: 3 }),
      ).toBe(false);
    });

    it('COUNT_LESS_THAN_OR_EQUAL', () => {
      expect(
        predicate(countOperators.COUNT_LESS_THAN_OR_EQUAL)({ value: 1, other: 1.5 }),
      ).toBe(true);
      expect(
        predicate(countOperators.COUNT_LESS_THAN_OR_EQUAL)({ value: 2, other: 2 }),
      ).toBe(true);
      expect(
        predicate(countOperators.COUNT_LESS_THAN_OR_EQUAL)({ value: 3, other: 2 }),
      ).toBe(false);
    });

    it('COUNT', () => {
      expect(
        predicate(countOperators.COUNT)({ value: 1, other: 1 }),
      ).toBe(true);
      expect(
        predicate(countOperators.COUNT)({ value: 2, other: 1 }),
      ).toBe(false);
    });

    it('COUNT_NOT', () => {
      expect(
        predicate(countOperators.COUNT_NOT)({ value: 1, other: 1 }),
      ).toBe(false);
      expect(
        predicate(countOperators.COUNT_NOT)({ value: 2, other: 1 }),
      ).toBe(true);
    });

    it('COUNT_ANY', () => {
      expect(
        predicate(countOperators.COUNT_ANY)({ value: 0 }),
      ).toBe(false);
      expect(
        predicate(countOperators.COUNT_ANY)({ value: 100 }),
      ).toBe(true);
    });

    it('COUNT_NONE', () => {
      expect(
        predicate(countOperators.COUNT_NONE)({ value: 100 }),
      ).toBe(false);
      expect(
        predicate(countOperators.COUNT_NONE)({ value: 0 }),
      ).toBe(true);
    });
  });
});
