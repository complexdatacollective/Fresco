import { describe, expect, it } from 'vitest';
import {
  createApiTokenSchema,
  deleteApiTokenSchema,
  updateApiTokenSchema,
} from '../apiTokens';

describe('API Token Schema Validators', () => {
  describe('createApiTokenSchema', () => {
    it('should parse valid data with description', () => {
      const validData = {
        description: 'Test token',
      };

      const result = createApiTokenSchema.parse(validData);
      expect(result.description).toBe('Test token');
    });

    it('should allow undefined description', () => {
      const validData = {};

      const result = createApiTokenSchema.parse(validData);
      expect(result.description).toBeUndefined();
    });

    it('should reject non-string description', () => {
      const invalidData = {
        description: 123,
      };

      expect(() => createApiTokenSchema.parse(invalidData)).toThrow();
    });
  });

  describe('updateApiTokenSchema', () => {
    it('should parse valid data with all fields', () => {
      const validData = {
        id: 'token-123',
        description: 'Updated token',
        isActive: false,
      };

      const result = updateApiTokenSchema.parse(validData);
      expect(result.id).toBe('token-123');
      expect(result.description).toBe('Updated token');
      expect(result.isActive).toBe(false);
    });

    it('should parse valid data with only id', () => {
      const validData = {
        id: 'token-123',
      };

      const result = updateApiTokenSchema.parse(validData);
      expect(result.id).toBe('token-123');
      expect(result.description).toBeUndefined();
      expect(result.isActive).toBeUndefined();
    });

    it('should require id field', () => {
      const invalidData = {
        description: 'Updated token',
      };

      expect(() => updateApiTokenSchema.parse(invalidData)).toThrow();
    });

    it('should reject non-boolean isActive', () => {
      const invalidData = {
        id: 'token-123',
        isActive: 'true',
      };

      expect(() => updateApiTokenSchema.parse(invalidData)).toThrow();
    });
  });

  describe('deleteApiTokenSchema', () => {
    it('should parse valid data with id', () => {
      const validData = {
        id: 'token-123',
      };

      const result = deleteApiTokenSchema.parse(validData);
      expect(result.id).toBe('token-123');
    });

    it('should require id field', () => {
      const invalidData = {};

      expect(() => deleteApiTokenSchema.parse(invalidData)).toThrow();
    });

    it('should reject non-string id', () => {
      const invalidData = {
        id: 123,
      };

      expect(() => deleteApiTokenSchema.parse(invalidData)).toThrow();
    });
  });
});
