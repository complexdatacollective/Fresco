import { type NodeDefinition } from '@codaco/protocol-validation';
import { describe, expect, it } from 'vitest';
import { labelLogic } from '../session';

describe('labelLogic', () => {
  it('should return value from variable named "name" in codebook', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'red',
      variables: {
        'var-123': { name: 'name', type: 'text' },
        'var-456': { name: 'age', type: 'number' },
      },
    };

    const mockNodeAttributes = {
      'var-123': 'John Doe',
      'var-456': 30,
    };

    // Execute
    const result = labelLogic(mockCodebook, mockNodeAttributes);

    // Verify
    expect(result).toBe('John Doe');
  });

  it('should look for "name" in a case-insensitive way', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'red',
      variables: {
        'var-123': { name: 'NAME', type: 'text' }, // Upper case
      },
    };

    const mockNodeAttributes = {
      'var-123': 'Jane Doe',
    };

    // Execute
    const result = labelLogic(mockCodebook, mockNodeAttributes);

    // Verify
    expect(result).toBe('Jane Doe');
  });

  it('should return value from attribute named "name" if codebook lookup fails', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'red',
      variables: {
        'var-456': { name: 'age', type: 'number' },
      },
    };

    const mockNodeAttributes = {
      'name': 'John Smith', // Direct name attribute
      'var-456': 30,
    };

    // Execute
    const result = labelLogic(mockCodebook, mockNodeAttributes);

    // Verify
    expect(result).toBe('John Smith');
  });

  it('should handle case-insensitive attribute names', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'red',
      variables: {
        'var-456': { name: 'age', type: 'number' },
      },
    };

    const mockNodeAttributes = {
      'NAME': 'John Smith', // Upper case name attribute
      'var-456': 30,
    };

    // Execute
    const result = labelLogic(mockCodebook, mockNodeAttributes);

    // Verify
    expect(result).toBe('John Smith');
  });

  it('should return value from first text variable with a value if no name found', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'red',
      variables: {
        'var-123': { name: 'firstName', type: 'text' },
        'var-456': { name: 'lastName', type: 'text' },
        'var-789': { name: 'age', type: 'number' },
      },
    };

    const mockNodeAttributes = {
      'var-123': '', // Empty value
      'var-456': 'Smith',
      'var-789': 30,
    };

    // Execute
    const result = labelLogic(mockCodebook, mockNodeAttributes);

    // Verify
    expect(result).toBe('Smith');
  });

  it('should return node type name as last resort', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'red',
      variables: {
        'var-123': { name: 'firstName', type: 'text' },
        'var-456': { name: 'age', type: 'number' },
      },
    };

    const mockNodeAttributes = {
      'var-123': '', // Empty value
      'var-456': 30,
    };

    // Execute
    const result = labelLogic(mockCodebook, mockNodeAttributes);

    // Verify
    expect(result).toBe('Person');
  });

  it('should handle undefined codebook', () => {
    // @ts-expect-error
    const mockCodebook: NodeDefinition = undefined;
    const mockNodeAttributes = {
      name: 'John Smith',
    };

    // Execute
    const result = labelLogic(mockCodebook, mockNodeAttributes);

    // Verify
    expect(result).toBe('John Smith');
  });

  it('should handle undefined codebook variables', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'red',
      // No variables property
    };

    const mockNodeAttributes = {
      name: 'John Smith',
    };

    // Execute
    const result = labelLogic(mockCodebook, mockNodeAttributes);

    // Verify
    expect(result).toBe('John Smith');
  });

  it('should handle non-string values in attributes', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'red',
      variables: {},
    };

    const mockNodeAttributes = {
      name: 42, // Number instead of string
    };

    // Execute
    const result = labelLogic(mockCodebook, mockNodeAttributes);

    // Verify
    expect(result).toBe('42'); // Should convert to string
  });

  it('should handle empty node attributes', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'red',
      variables: {
        'var-123': { name: 'name', type: 'text' },
      },
    };

    const mockNodeAttributes = {};

    // Execute
    const result = labelLogic(mockCodebook, mockNodeAttributes);

    // Verify
    expect(result).toBe('Person');
  });
});
