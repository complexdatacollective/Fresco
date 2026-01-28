import { type Codebook } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { describe, expect, it } from 'vitest';
import { type ExportOptions } from '../../../utils/types';
import processEntityVariables from '../processEntityVariables';

const mockExportOptions: ExportOptions = {
  exportGraphML: true,
  exportCSV: true,
  globalOptions: {
    useScreenLayoutCoordinates: false,
    screenLayoutHeight: 1080,
    screenLayoutWidth: 1920,
  },
};

describe('processEntityVariables', () => {
  describe('categorical variables', () => {
    it('should not match substring values in categorical options', () => {
      // This test verifies that "male" is NOT matched when only "female" is selected
      // This is the bug: includes() was doing substring matching, so "male" in "female" was true
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
                  { value: 'non-binary', label: 'Non-binary' },
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
      } as unknown as NcNode;

      const result = processEntityVariables(
        node,
        'node',
        codebook,
        mockExportOptions,
      );

      // female should be true, male and non-binary should be false
      expect(result.attributes).toEqual({
        gender_male: false,
        gender_female: true,
        'gender_non-binary': false,
      });
    });

    it('should correctly match multiple selected categorical values', () => {
      const codebook = {
        node: {
          person: {
            name: 'person',
            color: 'color',
            variables: {
              'color-uuid': {
                name: 'favoriteColors',
                type: 'categorical',
                options: [
                  { value: 'red', label: 'Red' },
                  { value: 'redish', label: 'Redish' },
                  { value: 'blue', label: 'Blue' },
                  { value: 'blueberry', label: 'Blueberry' },
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
          'color-uuid': ['red', 'blue'], // Only red and blue selected, not redish or blueberry
        },
      } as unknown as NcNode;

      const result = processEntityVariables(
        node,
        'node',
        codebook,
        mockExportOptions,
      );

      expect(result.attributes).toEqual({
        favoriteColors_red: true,
        favoriteColors_redish: false,
        favoriteColors_blue: true,
        favoriteColors_blueberry: false,
      });
    });

    it('should handle numeric categorical values correctly', () => {
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
                  { value: 1, label: 'One' },
                  { value: 10, label: 'Ten' },
                  { value: 100, label: 'One Hundred' },
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
          'rating-uuid': [10], // Only 10 selected
        },
      } as unknown as NcNode;

      const result = processEntityVariables(
        node,
        'node',
        codebook,
        mockExportOptions,
      );

      // 10 should be true, 1 and 100 should be false (not substring matched)
      expect(result.attributes).toEqual({
        rating_1: false,
        rating_10: true,
        rating_100: false,
      });
    });

    it('should handle empty categorical selection', () => {
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
          'gender-uuid': [], // Nothing selected
        },
      } as unknown as NcNode;

      const result = processEntityVariables(
        node,
        'node',
        codebook,
        mockExportOptions,
      );

      expect(result.attributes).toEqual({
        gender_male: false,
        gender_female: false,
      });
    });

    it('should handle null categorical data', () => {
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
          'gender-uuid': null,
        },
      } as unknown as NcNode;

      const result = processEntityVariables(
        node,
        'node',
        codebook,
        mockExportOptions,
      );

      expect(result.attributes).toEqual({
        gender_male: false,
        gender_female: false,
      });
    });

    it('should not do substring matching when categorical data is a string (legacy/edge case)', () => {
      // This test specifically checks for the bug where es-toolkit/compat includes()
      // does substring matching when the first argument is a string
      // e.g., includes('female', 'male') returns true because 'male' is in 'female'
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
      } as unknown as NcNode;

      const result = processEntityVariables(
        node,
        'node',
        codebook,
        mockExportOptions,
      );

      // 'male' should NOT be true just because it's a substring of 'female'
      expect(result.attributes).toEqual({
        gender_male: false,
        gender_female: true,
      });
    });

    it('should handle string categorical data with numeric-like values', () => {
      // Test case where numeric values could be compared as strings
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
      } as unknown as NcNode;

      const result = processEntityVariables(
        node,
        'node',
        codebook,
        mockExportOptions,
      );

      // '1' should NOT match just because '10' contains '1'
      expect(result.attributes).toEqual({
        rating_1: false,
        rating_10: true,
        rating_100: false,
      });
    });
  });
});
