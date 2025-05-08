import { type Variables } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type VariableValue,
} from '@codaco/shared-consts';
import { describe, expect, it, vi } from 'vitest';
import * as protocolSelectors from '../../selectors/protocol';
import * as sessionSelectors from '../../selectors/session';
import { type AppStore } from '../../store';
import {
  differentFrom,
  greaterThanVariable,
  lessThanVariable,
  maxLength,
  maxSelected,
  maxValue,
  minLength,
  minSelected,
  minValue,
  required,
  sameAs,
  unique,
} from '../field-validation';

vi.mock('../../selectors/interface');
vi.mock('../../selectors/session');
vi.mock('../../selectors/protocol');

// Mock store with debugging
const mockStore = {
  getState: () => ({}),
} as AppStore;

const mockOtherFormValues: Record<string, VariableValue> = {
  uid1: 1,
  uid2: '2012-10-07',
  uid3: 'word',
  uid4: [1, 2, 3],
  uid5: { x: 1.2, y: 2.3 },
  uid6: false,
};

const mockCodebookVariables: Variables = {
  uid1: { name: 'Variable 1', type: 'number' },
  uid2: { name: 'Date Variable', type: 'datetime' },
  uid3: { name: 'String Variable', type: 'text' },
  uid4: {
    name: 'Array Variable',
    type: 'ordinal',
    options: [
      {
        label: '1',
        value: 1,
      },
      {
        label: '2',
        value: 2,
      },
      {
        label: '3',
        value: 3,
      },
    ],
  },
  uid5: { name: 'Layout Variable', type: 'layout' },
  uid6: { name: 'Boolean Variable', type: 'boolean' },
};

describe('Validations', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    const getCodebookVarsSubjectMock = vi.fn((_state) => mockCodebookVariables);

    vi.spyOn(
      protocolSelectors,
      'getCodebookVariablesForSubjectType',
    ).mockImplementation(getCodebookVarsSubjectMock);

    const entities = [
      {
        [entityPrimaryKeyProperty]: 'uid1',
        [entityAttributesProperty]: mockOtherFormValues,
      },
    ];

    vi.spyOn(sessionSelectors, 'getNetworkEntitiesForType').mockImplementation(
      () => entities,
    );
  });
  describe('required()', () => {
    const errorMessage = 'You must answer this question before continuing';
    const subject = required(true);

    it('handles initialisation with boolean or string to determine message', () => {
      const withBooleanMessage = required(true);
      const withStringMessage = required('Custom message');

      expect(withBooleanMessage('')).toBe(
        'You must answer this question before continuing',
      );
      expect(withStringMessage('')).toBe('Custom message');
      expect(withStringMessage('hello')).toBe(undefined);
      expect(withBooleanMessage('hello')).toBe(undefined);
    });

    it('passes for a string', () => {
      expect(subject('hello world')).toBe(undefined);
    });

    it('passes for a numerical value', () => {
      expect(subject(3)).toBe(undefined);
      expect(subject(0)).toBe(undefined);
    });

    it('fails for null or undefined', () => {
      expect(subject(null)).toEqual(errorMessage);
      expect(subject(undefined)).toEqual(errorMessage);
    });

    it('fails for an empty string', () => {
      expect(subject('')).toEqual(errorMessage);
    });
  });

  describe('minLength()', () => {
    const errorMessage = 'Your answer must be 5 characters or more';
    const subject = minLength(5);

    it('fails for null or undefined', () => {
      // @ts-expect-error test spec
      expect(subject(null)).toBe(errorMessage);
      // @ts-expect-error test spec
      expect(subject(undefined)).toBe(errorMessage);
    });

    it('fails for a smaller string', () => {
      expect(subject('hi')).toBe(errorMessage);
    });

    it('passes for an exactly matching string', () => {
      expect(subject('hello')).toBe(undefined);
    });

    it('passes for a larger string', () => {
      expect(subject('hello world')).toBe(undefined);
    });
  });

  describe('maxLength()', () => {
    const errorMessage = 'Your answer must be 5 characters or less';
    const subject = maxLength(5);

    it('passes for null or undefined', () => {
      // @ts-expect-error test spec
      expect(subject(null)).toBe(undefined);
      // @ts-expect-error test spec
      expect(subject(undefined)).toBe(undefined);
    });

    it('passes for a smaller string', () => {
      expect(subject('hi')).toBe(undefined);
    });

    it('passes for an exactly matching string', () => {
      expect(subject('hello')).toBe(undefined);
    });

    it('fails for a larger string', () => {
      expect(subject('hello world')).toBe(errorMessage);
    });
  });

  describe('minValue()', () => {
    const errorMessage = 'Your answer must be at least 5';
    const subject = minValue(5);

    it('passes for null or undefined', () => {
      // @ts-expect-error test spec
      expect(subject(null)).toBe(undefined);
      // @ts-expect-error test spec
      expect(subject(undefined)).toBe(undefined);
    });

    it('fails for a negative number', () => {
      expect(subject(-1)).toBe(errorMessage);
    });

    it('fails for 0', () => {
      expect(subject(0)).toBe(errorMessage);
    });

    it('fails for a smaller value', () => {
      expect(subject(3)).toBe(errorMessage);
    });

    it('passes for an exactly matching value', () => {
      expect(subject(5)).toBe(undefined);
    });

    it('passes for a larger value', () => {
      expect(subject(10)).toBe(undefined);
    });
  });

  describe('maxValue()', () => {
    const errorMessage = 'Your answer must be less than 5';
    const subject = maxValue(5);

    it('passes for null or undefined', () => {
      // @ts-expect-error test spec
      expect(subject(null)).toBe(undefined);
      // @ts-expect-error test spec
      expect(subject(undefined)).toBe(undefined);
    });

    it('passes for a negative number', () => {
      expect(subject(-1)).toBe(undefined);
    });

    it('passes for 0', () => {
      expect(subject(0)).toBe(undefined);
    });

    it('passes for a smaller value', () => {
      expect(subject(3)).toBe(undefined);
    });

    it('passes for an exactly matching value', () => {
      expect(subject(5)).toBe(undefined);
    });

    it('fails for a larger value', () => {
      expect(subject(10)).toBe(errorMessage);
    });
  });

  describe('minSelected()', () => {
    const errorMessage = 'You must choose a minimum of 2 option(s)';
    const subject = minSelected(2);

    it('fails for null or undefined', () => {
      expect(subject(null)).toBe(errorMessage);
      expect(subject(undefined)).toBe(errorMessage);
    });

    it('fails for an empty array', () => {
      expect(subject([])).toBe(errorMessage);
    });

    it('fails for a smaller array', () => {
      expect(subject([1])).toBe(errorMessage);
    });

    it('passes for an exactly matching array', () => {
      expect(subject([1, 2])).toBe(undefined);
    });

    it('passes for a larger array', () => {
      expect(subject([1, 2, 3])).toBe(undefined);
    });
  });

  describe('maxSelected()', () => {
    const errorMessage = 'You must choose a maximum of 2 option(s)';
    const subject = maxSelected(2);

    it('passes for null or undefined', () => {
      expect(subject(null)).toBe(undefined);
      expect(subject(undefined)).toBe(undefined);
    });

    it('passes for an empty array', () => {
      expect(subject([])).toBe(undefined);
    });

    it('passes for a smaller array', () => {
      expect(subject([1])).toBe(undefined);
    });

    it('correctly handles zero values', () => {
      expect(subject([0, false, -1])).toBe(errorMessage);
    });

    it('passes for an exactly matching array', () => {
      expect(subject([1, 2])).toBe(undefined);
    });

    it('fails for a larger array', () => {
      expect(subject([1, 2, 3])).toBe(errorMessage);
    });
  });

  describe('unique()', () => {
    const props = {
      validationMeta: {},
    };

    const errorMessage = 'Your answer must be unique';

    it('passes for null or undefined', () => {
      const subject = unique(null, mockStore);
      expect(subject(null, {}, props, 'uid1')).toBe(undefined);
      expect(subject(undefined, {}, props, 'uid1')).toBe(undefined);
    });

    it('passes for a unique number', () => {
      const subject = unique(null, mockStore);
      expect(subject(2, {}, props, 'uid1')).toBe(undefined);
    });

    it('fails for a matching number', () => {
      const subject = unique(null, mockStore);
      expect(subject(1, {}, props, 'uid1')).toBe(errorMessage);
    });

    it('passes for a unique string', () => {
      const subject = unique(null, mockStore);
      expect(subject('diff', {}, props, 'uid3')).toBe(undefined);
    });

    it('fails for a matching string', () => {
      const subject = unique(null, mockStore);
      expect(subject('word', {}, props, 'uid3')).toBe(errorMessage);
    });

    it('passes for a unique array', () => {
      const subject = unique(null, mockStore);
      expect(subject([3, 1], {}, props, 'uid4')).toBe(undefined);
    });

    it('fails for a matching array', () => {
      const subject = unique(null, mockStore);
      expect(subject(mockOtherFormValues.uid4, {}, props, 'uid4')).toBe(
        errorMessage,
      );
    });

    it('passes for a unique boolean', () => {
      const subject = unique(null, mockStore);
      expect(subject(true, {}, props, 'uid6')).toBe(undefined);
    });

    it('fails for a matching boolean', () => {
      const subject = unique(null, mockStore);
      expect(subject(false, {}, props, 'uid6')).toBe(errorMessage);
    });

    it('passes for a unique object', () => {
      const subject = unique(null, mockStore);
      expect(subject({ x: 2.1, y: 3.2 }, {}, props, 'uid5')).toBe(undefined);
    });

    it('fails for a matching object', () => {
      const subject = unique(null, mockStore);
      expect(subject({ y: 2.3, x: 1.2 }, {}, props, 'uid5')).toBe(errorMessage);
    });
  });

  describe('differentFrom()', () => {
    const errorMessage = (variable: string) =>
      `Your answer must be different from ${variable}`;

    it('passes for null or undefined', () => {
      const subject1 = differentFrom('uid1', mockStore);
      expect(subject1(null, mockOtherFormValues)).toBe(undefined);
      expect(subject1(undefined, mockOtherFormValues)).toBe(undefined);
    });

    it('passes for a different number', () => {
      const subject1 = differentFrom('uid1', mockStore);
      expect(subject1(2, mockOtherFormValues)).toBe(undefined);
    });

    it('fails for a matching number', () => {
      const subject1 = differentFrom('uid1', mockStore);
      expect(subject1(1, mockOtherFormValues)).toBe(errorMessage('Variable 1'));
    });

    it('passes for a different boolean', () => {
      const subject2 = differentFrom('uid6', mockStore);
      expect(subject2(true, mockOtherFormValues)).toBe(undefined);
    });

    it('fails for a matching boolean', () => {
      const subject2 = differentFrom('uid6', mockStore);
      expect(subject2(false, mockOtherFormValues)).toBe(
        errorMessage('Boolean Variable'),
      );
    });

    it('passes for a different string', () => {
      const subject3 = differentFrom('uid3', mockStore);
      expect(subject3('diff', mockOtherFormValues)).toBe(undefined);
    });

    it('fails for a matching string', () => {
      const subject3 = differentFrom('uid3', mockStore);
      expect(subject3('word', mockOtherFormValues)).toBe(
        errorMessage('String Variable'),
      );
    });

    it('passes for a different array', () => {
      const subject4 = differentFrom('uid4', mockStore);
      expect(subject4([1, 2], mockOtherFormValues)).toBe(undefined);
    });

    it('fails for a matching array', () => {
      const subject4 = differentFrom('uid4', mockStore);
      expect(subject4(mockOtherFormValues.uid4, mockOtherFormValues)).toBe(
        errorMessage('Array Variable'),
      );
    });

    it('passes for a different object', () => {
      const subject5 = differentFrom('uid5', mockStore);
      expect(subject5({ x: 2.1, y: 3.2 }, mockOtherFormValues)).toBe(undefined);
    });

    it('fails for a matching object', () => {
      const subject5 = differentFrom('uid5', mockStore);
      expect(subject5({ y: 2.3, x: 1.2 }, mockOtherFormValues)).toBe(
        errorMessage('Layout Variable'),
      );
    });
  });

  describe('sameAs()', () => {
    const errorMessage = (value: string) =>
      `Your answer must be the same as the value of "${value}"`;

    it('fails for null or undefined', () => {
      const subject1 = sameAs('uid1', mockStore);
      expect(subject1(null, mockOtherFormValues)).toBe(
        errorMessage('Variable 1'),
      );
      expect(subject1(undefined, mockOtherFormValues)).toBe(
        errorMessage('Variable 1'),
      );
    });

    it('passes for a matching number', () => {
      const subject1 = sameAs('uid1', mockStore);
      expect(subject1(1, mockOtherFormValues)).toBe(undefined);
    });

    it('fails for a different number', () => {
      const subject1 = sameAs('uid1', mockStore);
      expect(subject1(2, mockOtherFormValues)).toBe(errorMessage('Variable 1'));
    });

    it('passes for a matching boolean', () => {
      const subject2 = sameAs('uid6', mockStore);
      expect(subject2(false, mockOtherFormValues)).toBe(undefined);
    });

    it('fails for a different boolean', () => {
      const subject2 = sameAs('uid6', mockStore);
      expect(subject2(true, mockOtherFormValues)).toBe(
        errorMessage('Boolean Variable'),
      );
    });

    it('passes for a matching string', () => {
      const subject3 = sameAs('uid3', mockStore);
      expect(subject3('word', mockOtherFormValues)).toBe(undefined);
    });

    it('fails for a different string', () => {
      const subject3 = sameAs('uid3', mockStore);
      expect(subject3('diff', mockOtherFormValues)).toBe(
        errorMessage('String Variable'),
      );
    });

    it('passes for a matching array', () => {
      const subject4 = sameAs('uid4', mockStore);
      expect(subject4(mockOtherFormValues.uid4, mockOtherFormValues)).toBe(
        undefined,
      );
    });

    it('fails for a different array', () => {
      const subject4 = sameAs('uid4', mockStore);
      expect(subject4([1, 2], mockOtherFormValues)).toBe(
        errorMessage('Array Variable'),
      );
    });

    it('passes for a matching object', () => {
      const subject5 = sameAs('uid5', mockStore);
      expect(subject5({ y: 2.3, x: 1.2 }, mockOtherFormValues)).toBe(undefined);
    });

    it('fails for a different object', () => {
      const subject5 = sameAs('uid5', mockStore);
      expect(subject5({ x: 2.1, y: 3.2 }, mockOtherFormValues)).toBe(
        errorMessage('Layout Variable'),
      );
    });
  });

  describe('greaterThanVariable()', () => {
    const errorMessage = (value: string) =>
      `Your answer must be greater than the value of "${value}"`;

    it('fails for null or undefined', () => {
      const subject1 = greaterThanVariable('uid1', mockStore);
      expect(subject1(null, mockOtherFormValues)).toBe(
        errorMessage('Variable 1'),
      );
      expect(subject1(undefined, mockOtherFormValues)).toBe(
        errorMessage('Variable 1'),
      );
    });

    it('passes if number is greater than', () => {
      const subject1 = greaterThanVariable('uid1', mockStore);
      expect(subject1(3, mockOtherFormValues)).toBe(undefined);
    });

    it('fails if number is less than', () => {
      const subject1 = greaterThanVariable('uid1', mockStore);
      expect(subject1(0, mockOtherFormValues)).toBe(errorMessage('Variable 1'));
    });

    it('passes if date is greater than', () => {
      const subject2 = greaterThanVariable('uid2', mockStore);
      expect(subject2('2012-11-07', mockOtherFormValues)).toBe(undefined);
    });

    it('fails if date is less than', () => {
      const subject2 = greaterThanVariable('uid2', mockStore);
      expect(subject2('2012-09-07', mockOtherFormValues)).toBe(
        errorMessage('Date Variable'),
      );
    });

    it('passes if string is greater than', () => {
      const subject3 = greaterThanVariable('uid3', mockStore);
      expect(subject3('zebra', mockOtherFormValues)).toBe(undefined);
    });

    it('fails if string is less than', () => {
      const subject3 = greaterThanVariable('uid3', mockStore);
      expect(subject3('diff', mockOtherFormValues)).toBe(
        errorMessage('String Variable'),
      );
    });
  });

  describe('lessThanVariable()', () => {
    const errorMessage = (value: string) =>
      `Your answer must be less than the value of "${value}"`;

    it('fails for null or undefined', () => {
      const subject1 = lessThanVariable('uid1', mockStore);
      expect(subject1(null, mockOtherFormValues)).toBe(
        errorMessage('Variable 1'),
      );
      expect(subject1(undefined, mockOtherFormValues)).toBe(
        `${errorMessage('Variable 1')}`,
      );
    });

    it('passes if number is less than', () => {
      const subject1 = lessThanVariable('uid1', mockStore);
      expect(subject1(0, mockOtherFormValues)).toBe(undefined);
    });

    it('fails if number is greater than', () => {
      const subject1 = lessThanVariable('uid1', mockStore);
      expect(subject1(2, mockOtherFormValues)).toBe(errorMessage('Variable 1'));
    });

    it('passes if date is less than', () => {
      const subject2 = lessThanVariable('uid2', mockStore);
      expect(subject2('2012-09-07', mockOtherFormValues)).toBe(undefined);
    });

    it('fails if date is greater than', () => {
      const subject2 = lessThanVariable('uid2', mockStore);
      expect(subject2('2012-11-07', mockOtherFormValues)).toBe(
        errorMessage('Date Variable'),
      );
    });

    it('passes if string is less than', () => {
      const subject3 = lessThanVariable('uid3', mockStore);
      expect(subject3('less', mockOtherFormValues)).toBe(undefined);
    });

    it('fails if string is greater than', () => {
      const subject3 = lessThanVariable('uid3', mockStore);
      expect(subject3('zebra', mockOtherFormValues)).toBe(
        errorMessage('String Variable'),
      );
    });
  });
});
