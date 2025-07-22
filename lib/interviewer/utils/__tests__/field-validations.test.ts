import { type Variables } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type VariableValue,
} from '@codaco/shared-consts';
import { describe, expect, it, vi } from 'vitest';
import {
  tanStackValidations,
  type TanStackValidatorParams,
  type ValidationContext,
} from '~/lib/form/utils/fieldValidation';

vi.mock('../../selectors/interface');
vi.mock('../../selectors/session');
vi.mock('../../selectors/protocol');

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

const mockValidationContext: ValidationContext = {
  codebookVariables: mockCodebookVariables,
  networkEntities: [
    {
      [entityPrimaryKeyProperty]: 'uid1',
      [entityAttributesProperty]: mockOtherFormValues,
    },
  ],
  currentEntityId: undefined,
};

// Helper function to create mock TanStack validator parameters
const createMockValidatorParams = (
  value: VariableValue | undefined,
  fieldName = 'testField',
  formValues: Record<string, VariableValue> = {},
): TanStackValidatorParams => ({
  value,
  fieldApi: {
    form: {
      store: {
        state: {
          values: formValues,
        },
      },
    },
    name: fieldName,
  },
  validationContext: mockValidationContext,
});

describe('TanStack Validations', () => {
  describe('required()', () => {
    const errorMessage = 'You must answer this question before continuing';

    it('handles initialization with boolean or string to determine message', () => {
      const withBooleanMessage = tanStackValidations.required(true);
      const withStringMessage = tanStackValidations.required('Custom message');

      expect(withBooleanMessage(createMockValidatorParams(''))).toBe(
        'You must answer this question before continuing',
      );
      expect(withStringMessage(createMockValidatorParams(''))).toBe(
        'Custom message',
      );
      expect(withStringMessage(createMockValidatorParams('hello'))).toBe(
        undefined,
      );
      expect(withBooleanMessage(createMockValidatorParams('hello'))).toBe(
        undefined,
      );
    });

    it('passes for a string', () => {
      const subject = tanStackValidations.required(true);
      expect(subject(createMockValidatorParams('hello world'))).toBe(undefined);
    });

    it('passes for a numerical value', () => {
      const subject = tanStackValidations.required(true);
      expect(subject(createMockValidatorParams(3))).toBe(undefined);
      expect(subject(createMockValidatorParams(0))).toBe(undefined);
    });

    it('fails for null or undefined', () => {
      const subject = tanStackValidations.required(true);
      expect(subject(createMockValidatorParams(null))).toEqual(errorMessage);
      expect(subject(createMockValidatorParams(undefined))).toEqual(
        errorMessage,
      );
    });

    it('fails for an empty string', () => {
      const subject = tanStackValidations.required(true);
      expect(subject(createMockValidatorParams(''))).toEqual(errorMessage);
    });
  });

  describe('minLength()', () => {
    const errorMessage = 'Your answer must be 5 characters or more';
    const subject = tanStackValidations.minLength(5);

    it('fails for null or undefined', () => {
      expect(subject(createMockValidatorParams(null))).toBe(errorMessage);
      expect(subject(createMockValidatorParams(undefined))).toBe(errorMessage);
    });

    it('fails for a smaller string', () => {
      expect(subject(createMockValidatorParams('hi'))).toBe(errorMessage);
    });

    it('passes for an exactly matching string', () => {
      expect(subject(createMockValidatorParams('hello'))).toBe(undefined);
    });

    it('passes for a larger string', () => {
      expect(subject(createMockValidatorParams('hello world'))).toBe(undefined);
    });
  });

  describe('maxLength()', () => {
    const errorMessage = 'Your answer must be 5 characters or less';
    const subject = tanStackValidations.maxLength(5);

    it('passes for null or undefined', () => {
      expect(subject(createMockValidatorParams(null))).toBe(undefined);
      expect(subject(createMockValidatorParams(undefined))).toBe(undefined);
    });

    it('passes for a smaller string', () => {
      expect(subject(createMockValidatorParams('hi'))).toBe(undefined);
    });

    it('passes for an exactly matching string', () => {
      expect(subject(createMockValidatorParams('hello'))).toBe(undefined);
    });

    it('fails for a larger string', () => {
      expect(subject(createMockValidatorParams('hello world'))).toBe(
        errorMessage,
      );
    });
  });

  describe('minValue()', () => {
    const errorMessage = 'Your answer must be at least 5';
    const subject = tanStackValidations.minValue(5);

    it('passes for null or undefined', () => {
      expect(subject(createMockValidatorParams(null))).toBe(undefined);
      expect(subject(createMockValidatorParams(undefined))).toBe(undefined);
    });

    it('fails for a negative number', () => {
      expect(subject(createMockValidatorParams(-1))).toBe(errorMessage);
    });

    it('fails for 0', () => {
      expect(subject(createMockValidatorParams(0))).toBe(errorMessage);
    });

    it('fails for a smaller value', () => {
      expect(subject(createMockValidatorParams(3))).toBe(errorMessage);
    });

    it('passes for an exactly matching value', () => {
      expect(subject(createMockValidatorParams(5))).toBe(undefined);
    });

    it('passes for a larger value', () => {
      expect(subject(createMockValidatorParams(10))).toBe(undefined);
    });
  });

  describe('maxValue()', () => {
    const errorMessage = 'Your answer must be less than 5';
    const subject = tanStackValidations.maxValue(5);

    it('passes for null or undefined', () => {
      expect(subject(createMockValidatorParams(null))).toBe(undefined);
      expect(subject(createMockValidatorParams(undefined))).toBe(undefined);
    });

    it('passes for a negative number', () => {
      expect(subject(createMockValidatorParams(-1))).toBe(undefined);
    });

    it('passes for 0', () => {
      expect(subject(createMockValidatorParams(0))).toBe(undefined);
    });

    it('passes for a smaller value', () => {
      expect(subject(createMockValidatorParams(3))).toBe(undefined);
    });

    it('passes for an exactly matching value', () => {
      expect(subject(createMockValidatorParams(5))).toBe(undefined);
    });

    it('fails for a larger value', () => {
      expect(subject(createMockValidatorParams(10))).toBe(errorMessage);
    });
  });

  describe('minSelected()', () => {
    const errorMessage = 'You must choose a minimum of 2 option(s)';
    const subject = tanStackValidations.minSelected(2);

    it('fails for null or undefined', () => {
      expect(subject(createMockValidatorParams(null))).toBe(errorMessage);
      expect(subject(createMockValidatorParams(undefined))).toBe(errorMessage);
    });

    it('fails for an empty array', () => {
      expect(subject(createMockValidatorParams([]))).toBe(errorMessage);
    });

    it('fails for a smaller array', () => {
      expect(subject(createMockValidatorParams([1]))).toBe(errorMessage);
    });

    it('passes for an exactly matching array', () => {
      expect(subject(createMockValidatorParams([1, 2]))).toBe(undefined);
    });

    it('passes for a larger array', () => {
      expect(subject(createMockValidatorParams([1, 2, 3]))).toBe(undefined);
    });
  });

  describe('maxSelected()', () => {
    const errorMessage = 'You must choose a maximum of 2 option(s)';
    const subject = tanStackValidations.maxSelected(2);

    it('passes for null or undefined', () => {
      expect(subject(createMockValidatorParams(null))).toBe(undefined);
      expect(subject(createMockValidatorParams(undefined))).toBe(undefined);
    });

    it('passes for an empty array', () => {
      expect(subject(createMockValidatorParams([]))).toBe(undefined);
    });

    it('passes for a smaller array', () => {
      expect(subject(createMockValidatorParams([1]))).toBe(undefined);
    });

    it('correctly handles zero values', () => {
      expect(subject(createMockValidatorParams([0, false, -1]))).toBe(
        errorMessage,
      );
    });

    it('passes for an exactly matching array', () => {
      expect(subject(createMockValidatorParams([1, 2]))).toBe(undefined);
    });

    it('fails for a larger array', () => {
      expect(subject(createMockValidatorParams([1, 2, 3]))).toBe(errorMessage);
    });
  });

  describe('unique()', () => {
    const errorMessage = 'Your answer must be unique';
    const subject = tanStackValidations.unique();

    it('passes for null or undefined', () => {
      expect(subject(createMockValidatorParams(null, 'uid1'))).toBe(undefined);
      expect(subject(createMockValidatorParams(undefined, 'uid1'))).toBe(
        undefined,
      );
    });

    it('passes for a unique number', () => {
      expect(subject(createMockValidatorParams(2, 'uid1'))).toBe(undefined);
    });

    it('fails for a matching number', () => {
      expect(subject(createMockValidatorParams(1, 'uid1'))).toBe(errorMessage);
    });

    it('passes for a unique string', () => {
      expect(subject(createMockValidatorParams('diff', 'uid3'))).toBe(
        undefined,
      );
    });

    it('fails for a matching string', () => {
      expect(subject(createMockValidatorParams('word', 'uid3'))).toBe(
        errorMessage,
      );
    });

    it('passes for a unique array', () => {
      expect(subject(createMockValidatorParams([3, 1], 'uid4'))).toBe(
        undefined,
      );
    });

    it('fails for a matching array', () => {
      expect(
        subject(createMockValidatorParams(mockOtherFormValues.uid4, 'uid4')),
      ).toBe(errorMessage);
    });

    it('passes for a unique boolean', () => {
      expect(subject(createMockValidatorParams(true, 'uid6'))).toBe(undefined);
    });

    it('fails for a matching boolean', () => {
      expect(subject(createMockValidatorParams(false, 'uid6'))).toBe(
        errorMessage,
      );
    });

    it('passes for a unique object', () => {
      expect(
        subject(createMockValidatorParams({ x: 2.1, y: 3.2 }, 'uid5')),
      ).toBe(undefined);
    });

    it('fails for a matching object', () => {
      expect(
        subject(createMockValidatorParams({ y: 2.3, x: 1.2 }, 'uid5')),
      ).toBe(errorMessage);
    });
  });

  describe('differentFrom()', () => {
    const errorMessage = (variable: string) =>
      `Your answer must be different from ${variable}`;

    it('passes for null or undefined', () => {
      const subject1 = tanStackValidations.differentFrom('uid1');
      expect(
        subject1(
          createMockValidatorParams(null, 'testField', mockOtherFormValues),
        ),
      ).toBe(undefined);
      expect(
        subject1(
          createMockValidatorParams(
            undefined,
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(undefined);
    });

    it('passes for a different number', () => {
      const subject1 = tanStackValidations.differentFrom('uid1');
      expect(
        subject1(
          createMockValidatorParams(2, 'testField', mockOtherFormValues),
        ),
      ).toBe(undefined);
    });

    it('fails for a matching number', () => {
      const subject1 = tanStackValidations.differentFrom('uid1');
      expect(
        subject1(
          createMockValidatorParams(1, 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('Variable 1'));
    });

    it('passes for a different boolean', () => {
      const subject2 = tanStackValidations.differentFrom('uid6');
      expect(
        subject2(
          createMockValidatorParams(true, 'testField', mockOtherFormValues),
        ),
      ).toBe(undefined);
    });

    it('fails for a matching boolean', () => {
      const subject2 = tanStackValidations.differentFrom('uid6');
      expect(
        subject2(
          createMockValidatorParams(false, 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('Boolean Variable'));
    });

    it('passes for a different string', () => {
      const subject3 = tanStackValidations.differentFrom('uid3');
      expect(
        subject3(
          createMockValidatorParams('diff', 'testField', mockOtherFormValues),
        ),
      ).toBe(undefined);
    });

    it('fails for a matching string', () => {
      const subject3 = tanStackValidations.differentFrom('uid3');
      expect(
        subject3(
          createMockValidatorParams('word', 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('String Variable'));
    });

    it('passes for a different array', () => {
      const subject4 = tanStackValidations.differentFrom('uid4');
      expect(
        subject4(
          createMockValidatorParams([1, 2], 'testField', mockOtherFormValues),
        ),
      ).toBe(undefined);
    });

    it('fails for a matching array', () => {
      const subject4 = tanStackValidations.differentFrom('uid4');
      expect(
        subject4(
          createMockValidatorParams(
            mockOtherFormValues.uid4,
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(errorMessage('Array Variable'));
    });

    it('passes for a different object', () => {
      const subject5 = tanStackValidations.differentFrom('uid5');
      expect(
        subject5(
          createMockValidatorParams(
            { x: 2.1, y: 3.2 },
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(undefined);
    });

    it('fails for a matching object', () => {
      const subject5 = tanStackValidations.differentFrom('uid5');
      expect(
        subject5(
          createMockValidatorParams(
            { y: 2.3, x: 1.2 },
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(errorMessage('Layout Variable'));
    });
  });

  describe('sameAs()', () => {
    const errorMessage = (value: string) =>
      `Your answer must be the same as the value of "${value}"`;

    it('fails for null or undefined', () => {
      const subject1 = tanStackValidations.sameAs('uid1');
      expect(
        subject1(
          createMockValidatorParams(null, 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('Variable 1'));
      expect(
        subject1(
          createMockValidatorParams(
            undefined,
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(errorMessage('Variable 1'));
    });

    it('passes for a matching number', () => {
      const subject1 = tanStackValidations.sameAs('uid1');
      expect(
        subject1(
          createMockValidatorParams(1, 'testField', mockOtherFormValues),
        ),
      ).toBe(undefined);
    });

    it('fails for a different number', () => {
      const subject1 = tanStackValidations.sameAs('uid1');
      expect(
        subject1(
          createMockValidatorParams(2, 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('Variable 1'));
    });

    it('passes for a matching boolean', () => {
      const subject2 = tanStackValidations.sameAs('uid6');
      expect(
        subject2(
          createMockValidatorParams(false, 'testField', mockOtherFormValues),
        ),
      ).toBe(undefined);
    });

    it('fails for a different boolean', () => {
      const subject2 = tanStackValidations.sameAs('uid6');
      expect(
        subject2(
          createMockValidatorParams(true, 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('Boolean Variable'));
    });

    it('passes for a matching string', () => {
      const subject3 = tanStackValidations.sameAs('uid3');
      expect(
        subject3(
          createMockValidatorParams('word', 'testField', mockOtherFormValues),
        ),
      ).toBe(undefined);
    });

    it('fails for a different string', () => {
      const subject3 = tanStackValidations.sameAs('uid3');
      expect(
        subject3(
          createMockValidatorParams('diff', 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('String Variable'));
    });

    it('passes for a matching array', () => {
      const subject4 = tanStackValidations.sameAs('uid4');
      expect(
        subject4(
          createMockValidatorParams(
            mockOtherFormValues.uid4,
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(undefined);
    });

    it('fails for a different array', () => {
      const subject4 = tanStackValidations.sameAs('uid4');
      expect(
        subject4(
          createMockValidatorParams([1, 2], 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('Array Variable'));
    });

    it('passes for a matching object', () => {
      const subject5 = tanStackValidations.sameAs('uid5');
      expect(
        subject5(
          createMockValidatorParams(
            { y: 2.3, x: 1.2 },
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(undefined);
    });

    it('fails for a different object', () => {
      const subject5 = tanStackValidations.sameAs('uid5');
      expect(
        subject5(
          createMockValidatorParams(
            { x: 2.1, y: 3.2 },
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(errorMessage('Layout Variable'));
    });
  });

  describe('greaterThanVariable()', () => {
    const errorMessage = (value: string) =>
      `Your answer must be greater than the value of "${value}"`;

    it('fails for null or undefined', () => {
      const subject1 = tanStackValidations.greaterThanVariable('uid1');
      expect(
        subject1(
          createMockValidatorParams(null, 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('Variable 1'));
      expect(
        subject1(
          createMockValidatorParams(
            undefined,
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(errorMessage('Variable 1'));
    });

    it('passes if number is greater than', () => {
      const subject1 = tanStackValidations.greaterThanVariable('uid1');
      expect(
        subject1(
          createMockValidatorParams(3, 'testField', mockOtherFormValues),
        ),
      ).toBe(undefined);
    });

    it('fails if number is less than', () => {
      const subject1 = tanStackValidations.greaterThanVariable('uid1');
      expect(
        subject1(
          createMockValidatorParams(0, 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('Variable 1'));
    });

    it('passes if date is greater than', () => {
      const subject2 = tanStackValidations.greaterThanVariable('uid2');
      expect(
        subject2(
          createMockValidatorParams(
            '2012-11-07',
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(undefined);
    });

    it('fails if date is less than', () => {
      const subject2 = tanStackValidations.greaterThanVariable('uid2');
      expect(
        subject2(
          createMockValidatorParams(
            '2012-09-07',
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(errorMessage('Date Variable'));
    });

    it('passes if string is greater than', () => {
      const subject3 = tanStackValidations.greaterThanVariable('uid3');
      expect(
        subject3(
          createMockValidatorParams('zebra', 'testField', mockOtherFormValues),
        ),
      ).toBe(undefined);
    });

    it('fails if string is less than', () => {
      const subject3 = tanStackValidations.greaterThanVariable('uid3');
      expect(
        subject3(
          createMockValidatorParams('diff', 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('String Variable'));
    });
  });

  describe('lessThanVariable()', () => {
    const errorMessage = (value: string) =>
      `Your answer must be less than the value of "${value}"`;

    it('fails for null or undefined', () => {
      const subject1 = tanStackValidations.lessThanVariable('uid1');
      expect(
        subject1(
          createMockValidatorParams(null, 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('Variable 1'));
      expect(
        subject1(
          createMockValidatorParams(
            undefined,
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(errorMessage('Variable 1'));
    });

    it('passes if number is less than', () => {
      const subject1 = tanStackValidations.lessThanVariable('uid1');
      expect(
        subject1(
          createMockValidatorParams(0, 'testField', mockOtherFormValues),
        ),
      ).toBe(undefined);
    });

    it('fails if number is greater than', () => {
      const subject1 = tanStackValidations.lessThanVariable('uid1');
      expect(
        subject1(
          createMockValidatorParams(2, 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('Variable 1'));
    });

    it('passes if date is less than', () => {
      const subject2 = tanStackValidations.lessThanVariable('uid2');
      expect(
        subject2(
          createMockValidatorParams(
            '2012-09-07',
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(undefined);
    });

    it('fails if date is greater than', () => {
      const subject2 = tanStackValidations.lessThanVariable('uid2');
      expect(
        subject2(
          createMockValidatorParams(
            '2012-11-07',
            'testField',
            mockOtherFormValues,
          ),
        ),
      ).toBe(errorMessage('Date Variable'));
    });

    it('passes if string is less than', () => {
      const subject3 = tanStackValidations.lessThanVariable('uid3');
      expect(
        subject3(
          createMockValidatorParams('less', 'testField', mockOtherFormValues),
        ),
      ).toBe(undefined);
    });

    it('fails if string is greater than', () => {
      const subject3 = tanStackValidations.lessThanVariable('uid3');
      expect(
        subject3(
          createMockValidatorParams('zebra', 'testField', mockOtherFormValues),
        ),
      ).toBe(errorMessage('String Variable'));
    });
  });
});
