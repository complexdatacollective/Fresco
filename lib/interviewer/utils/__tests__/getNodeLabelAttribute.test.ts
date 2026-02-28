import { type NodeDefinition } from '@codaco/protocol-validation';
import { describe, expect, it } from 'vitest';
import { getNodeLabelAttribute } from '../getNodeLabelAttribute';

describe('getNodeLabelAttribute', () => {
  it('should return value from variable named "name" in codebook', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'node-color-seq-6',
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
    const result = getNodeLabelAttribute(
      mockCodebook.variables,
      mockNodeAttributes,
    );

    // Verify
    expect(result).toBe('var-123');
  });

  it('should look for "name" in a case-insensitive way', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'node-color-seq-5',
      variables: {
        'var-123': { name: 'NAME', type: 'text' }, // Upper case
      },
    };

    const mockNodeAttributes = {
      'var-123': 'Jane Doe',
    };

    // Execute
    const result = getNodeLabelAttribute(
      mockCodebook.variables,
      mockNodeAttributes,
    );

    // Verify
    expect(result).toBe('var-123');
  });

  it('should return value from attribute named "name" if codebook lookup fails', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'node-color-seq-4',
      variables: {
        'var-456': { name: 'age', type: 'number' },
      },
    };

    const mockNodeAttributes = {
      'name': 'John Smith', // Direct name attribute
      'var-456': 30,
    };

    // Execute
    const result = getNodeLabelAttribute(
      mockCodebook.variables,
      mockNodeAttributes,
    );

    // Verify
    expect(result).toBe('name');
  });

  it('should handle case-insensitive attribute names', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'node-color-seq-3',
      variables: {
        'var-456': { name: 'age', type: 'number' },
      },
    };

    const mockNodeAttributes = {
      'NAME': 'John Smith', // Upper case name attribute
      'var-456': 30,
    };

    // Execute
    const result = getNodeLabelAttribute(
      mockCodebook.variables,
      mockNodeAttributes,
    );

    // Verify
    expect(result).toBe('NAME');
  });

  it('should return value from first text variable with a value if no name found', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'node-color-seq-2',
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
    const result = getNodeLabelAttribute(
      mockCodebook.variables,
      mockNodeAttributes,
    );

    // Verify
    expect(result).toBe('var-456'); // Should return the first text variable with a value
  });

  it('should handle undefined codebook variables', () => {
    const mockCodebook: NodeDefinition['variables'] = undefined;
    const mockNodeAttributes = {
      name: 'John Smith',
    };

    // Execute
    const result = getNodeLabelAttribute(mockCodebook, mockNodeAttributes);

    // Verify
    expect(result).toBe('name');
  });

  it('should handle empty node attributes', () => {
    // Setup
    const mockCodebook: NodeDefinition = {
      name: 'Person',
      color: 'node-color-seq-1',
      variables: {
        'var-123': { name: 'name', type: 'text' },
      },
    };

    const mockNodeAttributes = {};

    // Execute
    const result = getNodeLabelAttribute(
      mockCodebook.variables,
      mockNodeAttributes,
    );

    // Verify
    expect(result).toBe(null);
  });
});
