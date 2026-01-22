import { describe, expect, it } from 'vitest';
import { extractValue, isChangeEvent } from './isChangeEvent';

describe('isChangeEvent', () => {
  it('should return true for valid input change events', () => {
    const event = {
      target: { value: 'test' },
      currentTarget: { value: 'test' },
      type: 'change',
    };

    expect(isChangeEvent(event)).toBe(true);
  });

  it('should return true for minimal change event structure', () => {
    const event = { target: { value: 'hello' } };

    expect(isChangeEvent(event)).toBe(true);
  });

  it('should return false for string values', () => {
    expect(isChangeEvent('test')).toBe(false);
  });

  it('should return false for number values', () => {
    expect(isChangeEvent(42)).toBe(false);
  });

  it('should return false for boolean values', () => {
    expect(isChangeEvent(true)).toBe(false);
    expect(isChangeEvent(false)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isChangeEvent(undefined)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isChangeEvent(null)).toBe(false);
  });

  it('should return false for arrays', () => {
    expect(isChangeEvent(['a', 'b'])).toBe(false);
    expect(isChangeEvent([1, 2, 3])).toBe(false);
  });

  it('should return false for objects without target', () => {
    expect(isChangeEvent({ value: 'test' })).toBe(false);
    expect(isChangeEvent({ data: 'test' })).toBe(false);
  });

  it('should return false for objects with non-object target', () => {
    expect(isChangeEvent({ target: 'string' })).toBe(false);
    expect(isChangeEvent({ target: 123 })).toBe(false);
    expect(isChangeEvent({ target: null })).toBe(false);
  });

  it('should return false for objects with target missing value property', () => {
    expect(isChangeEvent({ target: { name: 'input' } })).toBe(false);
    expect(isChangeEvent({ target: {} })).toBe(false);
  });
});

describe('extractValue', () => {
  it('should extract value from change events', () => {
    const event = {
      target: { value: 'extracted value' },
      currentTarget: { value: 'extracted value' },
      type: 'change',
    } as React.ChangeEvent<HTMLInputElement>;

    expect(extractValue<string>(event)).toBe('extracted value');
  });

  it('should extract numeric string value from change events', () => {
    const event = {
      target: { value: '42' },
    } as React.ChangeEvent<HTMLInputElement>;

    expect(extractValue<string>(event)).toBe('42');
  });

  it('should extract empty string from change events', () => {
    const event = {
      target: { value: '' },
    } as React.ChangeEvent<HTMLInputElement>;

    expect(extractValue<string>(event)).toBe('');
  });

  it('should return direct string values unchanged', () => {
    expect(extractValue<string>('hello')).toBe('hello');
    expect(extractValue<string>('')).toBe('');
  });

  it('should return direct number values unchanged', () => {
    expect(extractValue<number>(42)).toBe(42);
    expect(extractValue<number>(0)).toBe(0);
    expect(extractValue<number>(-10)).toBe(-10);
  });

  it('should return direct boolean values unchanged', () => {
    expect(extractValue<boolean>(true)).toBe(true);
    expect(extractValue<boolean>(false)).toBe(false);
  });

  it('should return undefined unchanged', () => {
    expect(extractValue<undefined>(undefined)).toBe(undefined);
  });

  it('should return direct array values unchanged', () => {
    const arr = ['a', 'b', 'c'];
    expect(extractValue<string[]>(arr)).toBe(arr);
  });

  it('should return direct object values unchanged (non-event objects)', () => {
    const obj = { name: 'test', value: 123 };
    expect(extractValue<typeof obj>(obj)).toBe(obj);
  });
});
