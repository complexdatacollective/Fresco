import { describe, test, expect, beforeEach, afterAll, vi } from 'vitest';
import { isDOMElement, validateElementRef, assertDOMElement } from '../utils/domValidation';

// Mock console methods to test warnings/errors
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('domValidation', () => {
  beforeEach(() => {
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('isDOMElement', () => {
    test('validates real DOM elements', () => {
      const div = document.createElement('div');
      expect(isDOMElement(div)).toBe(true);
    });

    test('rejects null and undefined', () => {
      expect(isDOMElement(null)).toBe(false);
      expect(isDOMElement(undefined)).toBe(false);
    });

    test('rejects plain objects', () => {
      expect(isDOMElement({})).toBe(false);
      expect(isDOMElement({ nodeType: 1 })).toBe(false);
    });

    test('rejects objects without required methods', () => {
      expect(isDOMElement({ 
        nodeType: Node.ELEMENT_NODE,
        getBoundingClientRect: 'not a function' 
      })).toBe(false);
      
      expect(isDOMElement({ 
        nodeType: Node.ELEMENT_NODE,
        getBoundingClientRect: () => {},
        addEventListener: 'not a function'
      })).toBe(false);
    });

    test('rejects React component instances', () => {
      const fakeComponent = {
        props: {},
        state: {},
        render: () => {},
      };
      expect(isDOMElement(fakeComponent)).toBe(false);
    });
  });

  describe('validateElementRef', () => {
    test('returns element for valid DOM element ref', () => {
      const div = document.createElement('div');
      const ref = { current: div };
      
      const result = validateElementRef(ref, 'TestComponent');
      
      expect(result).toBe(div);
      expect(mockConsoleWarn).not.toHaveBeenCalled();
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('warns and returns null for null ref', () => {
      const ref = { current: null };
      
      const result = validateElementRef(ref, 'TestComponent');
      
      expect(result).toBe(null);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'TestComponent: elementRef.current is null'
      );
    });

    test('errors and returns null for non-DOM element', () => {
      const ref = { current: { nodeType: 'not a number' } };
      
      const result = validateElementRef(ref, 'TestComponent');
      
      expect(result).toBe(null);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('TestComponent: elementRef.current is not a DOM element')
      );
    });

    test('provides helpful error message with type info', () => {
      const fakeComponent = { props: {}, render: () => {} };
      const ref = { current: fakeComponent };
      
      validateElementRef(ref, 'TestComponent');
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Got: object, nodeType: undefined')
      );
    });
  });

  describe('assertDOMElement', () => {
    test('returns element for valid DOM element', () => {
      const div = document.createElement('div');
      
      const result = assertDOMElement(div, 'test context');
      
      expect(result).toBe(div);
    });

    test('throws error for invalid element', () => {
      const invalidElement = { nodeType: 'invalid' };
      
      expect(() => {
        assertDOMElement(invalidElement, 'test context');
      }).toThrow('test context: Expected DOM element but got object');
    });

    test('throws error for null', () => {
      expect(() => {
        assertDOMElement(null, 'test context');
      }).toThrow('test context: Expected DOM element but got object');
    });
  });
});