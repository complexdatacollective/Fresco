import { type Codebook } from '@codaco/protocol-validation';
import { entityAttributesProperty, entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { type DocumentFragment as XmlDomDocumentFragment } from '@xmldom/xmldom';
import { describe, expect, it } from 'vitest';
import { type ExportOptions, type NodeWithResequencedID } from '../../../utils/types';
import processAttributes from '../processAttributes';

const mockExportOptions: ExportOptions = {
  exportGraphML: true,
  exportCSV: true,
  globalOptions: {
    useScreenLayoutCoordinates: false,
    screenLayoutHeight: 1080,
    screenLayoutWidth: 1920,
  },
};

// Helper to extract data elements from the document fragment
const getDataElements = (fragment: XmlDomDocumentFragment) => {
  const result: Record<string, string> = {};
  for (const node of Array.from(fragment.childNodes)) {
    const child = node as unknown as Element;
    const key = child.getAttribute?.('key');
    const value = child.textContent;
    if (key) {
      result[key] = value ?? '';
    }
  }
  return result;
};

describe('processAttributes', () => {
  describe('categorical variables', () => {
    it('should not match substring values in categorical options', () => {
      // This test verifies that "male" is NOT matched when only "female" is selected
      const codebook = {
        node: {
          person: {
            name: 'person',
            color: 'color',
            variables: {
              'gender-uuid': {
                name: 'gender',
                type: 'categorical',
                options: [
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ],
              },
            },
          },
        },
      } as unknown as Codebook;

      const node = {
        [entityPrimaryKeyProperty]: '1',
        type: 'person',
        [entityAttributesProperty]: {
          'gender-uuid': ['female'], // Only female is selected
        },
      } as unknown as NodeWithResequencedID;

      const result = processAttributes(node, codebook, mockExportOptions);
      const dataElements = getDataElements(result);

      // The keys are hashed, so we need to find them by looking for true/false values
      // Female should be true, male should be false
      const values = Object.values(dataElements);
      const trueCount = values.filter((v) => v === 'true').length;
      const falseCount = values.filter((v) => v === 'false').length;

      expect(trueCount).toBe(1); // Only female
      expect(falseCount).toBe(1); // male is false
    });

    it('should not do substring matching when categorical data is a string (legacy/edge case)', () => {
      // This test specifically checks for the bug where includes() would do
      // substring matching when the first argument is a string
      const codebook = {
        node: {
          person: {
            name: 'person',
            color: 'color',
            variables: {
              'gender-uuid': {
                name: 'gender',
                type: 'categorical',
                options: [
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ],
              },
            },
          },
        },
      } as unknown as Codebook;

      // Edge case: categorical data stored as a string instead of array
      const node = {
        [entityPrimaryKeyProperty]: '1',
        type: 'person',
        [entityAttributesProperty]: {
          'gender-uuid': 'female', // String instead of array - legacy data format
        },
      } as unknown as NodeWithResequencedID;

      const result = processAttributes(node, codebook, mockExportOptions);
      const dataElements = getDataElements(result);

      // 'male' should NOT be true just because it's a substring of 'female'
      const values = Object.values(dataElements);
      const trueCount = values.filter((v) => v === 'true').length;
      const falseCount = values.filter((v) => v === 'false').length;

      expect(trueCount).toBe(1); // Only female should be true
      expect(falseCount).toBe(1); // male should be false (not true due to substring match)
    });

    it('should handle string categorical data with numeric-like values', () => {
      const codebook = {
        node: {
          person: {
            name: 'person',
            color: 'color',
            variables: {
              'rating-uuid': {
                name: 'rating',
                type: 'categorical',
                options: [
                  { value: '1', label: 'One' },
                  { value: '10', label: 'Ten' },
                  { value: '100', label: 'One Hundred' },
                ],
              },
            },
          },
        },
      } as unknown as Codebook;

      // String value that could match substrings
      const node = {
        [entityPrimaryKeyProperty]: '1',
        type: 'person',
        [entityAttributesProperty]: {
          'rating-uuid': '10', // String '10' contains '1' as substring
        },
      } as unknown as NodeWithResequencedID;

      const result = processAttributes(node, codebook, mockExportOptions);
      const dataElements = getDataElements(result);

      // '1' should NOT match just because '10' contains '1'
      const values = Object.values(dataElements);
      const trueCount = values.filter((v) => v === 'true').length;
      const falseCount = values.filter((v) => v === 'false').length;

      expect(trueCount).toBe(1); // Only '10' should be true
      expect(falseCount).toBe(2); // '1' and '100' should be false
    });
  });
});
