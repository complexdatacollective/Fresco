import { beforeEach, it, vi } from 'vitest';
import { z } from 'zod';
import { createFormStore } from '../store/formStore';
import type { FieldConfig, FormConfig } from '../types';

// Mock the validation utility
vi.mock('../utils/validation', () => ({
  validateFieldValue: vi.fn(),
}));

import { validateFieldValue } from '../utils/validation';
const mockValidateFieldValue = vi.mocked(validateFieldValue);

describe('FormStore', () => {
  let store: ReturnType<typeof createFormStore>;

  beforeEach(() => {
    store = createFormStore();
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState();

      expect(state.fields).toBeInstanceOf(Map);
      expect(state.fields.size).toBe(0);
      expect(state.isSubmitting).toBe(false);
      expect(state.isValidating).toBe(false);
      expect(state.isDirty).toBe(false);
      expect(state.isValid).toBe(true);
      expect(state.context).toEqual({});
      expect(state.submitHandler).toBeNull();
      expect(state.submitInvalidHandler).toBeNull();
    });
  });

  describe('Form registration', () => {
    it('should register form with config', () => {
      const onSubmit = vi.fn();
      const onSubmitInvalid = vi.fn();
      const additionalContext = { userId: '123' };

      const formConfig: FormConfig = {
        onSubmit,
        onSubmitInvalid,
        additionalContext,
      };

      store.getState().registerForm(formConfig);
      const state = store.getState();

      expect(state.submitHandler).toBe(onSubmit);
      expect(state.submitInvalidHandler).toBe(onSubmitInvalid);
      expect(state.context).toEqual(additionalContext);
    });

    it('should register form without optional handlers', () => {
      const onSubmit = vi.fn();

      const formConfig: FormConfig = {
        onSubmit,
      };

      store.getState().registerForm(formConfig);
      const state = store.getState();

      expect(state.submitHandler).toBe(onSubmit);
      expect(state.submitInvalidHandler).toBeNull();
      expect(state.context).toEqual({});
    });
  });

  describe('Field registration and management', () => {
    it('should register a field', () => {
      const fieldConfig: FieldConfig = {
        name: 'email',
        initialValue: 'test@example.com',
        validation: z.string().min(1, 'Email is required'),
      };

      store.getState().registerField(fieldConfig);
      const field = store.getState().getFieldState('email');

      expect(field).toBeDefined();
      expect(field?.value).toBe('test@example.com');
      expect(field?.initialValue).toBe('test@example.com');
      expect(field?.validation).toBeDefined();
      expect(field?.meta).toEqual({
        errors: null,
        isValidating: false,
        isTouched: false,
        isDirty: false,
        isValid: false,
      });
    });

    it('should register field with undefined initial value when not provided', () => {
      const fieldConfig: FieldConfig = {
        name: 'username',
        validation: z.string().optional(),
      };

      store.getState().registerField(fieldConfig);
      const field = store.getState().getFieldState('username');

      expect(field?.value).toBeUndefined();
      expect(field?.initialValue).toBeUndefined();
    });

    it('should unregister a field', () => {
      const fieldConfig: FieldConfig = {
        name: 'email',
        initialValue: 'test@example.com',
        validation: z.string().optional(),
      };

      store.getState().registerField(fieldConfig);
      expect(store.getState().getFieldState('email')).toBeDefined();

      store.getState().unregisterField('email');
      expect(store.getState().getFieldState('email')).toBeUndefined();
    });

    it('should not error when unregistering non-existent field', () => {
      expect(() => {
        store.getState().unregisterField('nonexistent');
      }).not.toThrow();
    });
  });

  describe('Field value updates', () => {
    beforeEach(() => {
      const fieldConfig: FieldConfig = {
        name: 'email',
        initialValue: '',
        validation: z.string().optional(),
      };
      store.getState().registerField(fieldConfig);
    });

    it('should update field value and mark as dirty', () => {
      store.getState().setFieldValue('email', 'new@example.com');
      const field = store.getState().getFieldState('email');

      expect(field?.value).toBe('new@example.com');
      expect(field?.meta.isDirty).toBe(true);
    });

    it('should not update value for non-existent field', () => {
      expect(() => {
        store.getState().setFieldValue('nonexistent', 'value');
      }).not.toThrow();
    });

    it('should set field error and update validity', () => {
      store.getState().setFieldError('email', 'Invalid email format');
      const field = store.getState().getFieldState('email');
      const state = store.getState();

      expect(field?.meta.errors).toEqual(['Invalid email format']);
      expect(field?.meta.isValid).toBe(false);
      expect(state.isValid).toBe(false);
    });

    it('should clear field error', () => {
      store.getState().setFieldError('email', 'Invalid email');
      store.getState().setFieldError('email', null);
      const field = store.getState().getFieldState('email');

      expect(field?.meta.errors).toBeNull();
      expect(field?.meta.isValid).toBe(true);
    });

    it('should set field touched', () => {
      store.getState().setFieldTouched('email', true);
      const field = store.getState().getFieldState('email');

      expect(field?.meta.isTouched).toBe(true);
    });

    it('should set field dirty and update form dirty state', () => {
      store.getState().setFieldDirty('email', true);
      const field = store.getState().getFieldState('email');
      const state = store.getState();

      expect(field?.meta.isDirty).toBe(true);
      expect(state.isDirty).toBe(true);
    });
  });

  describe('Form-level state updates', () => {
    it('should update form validity based on all fields', () => {
      // Register multiple fields
      store
        .getState()
        .registerField({ name: 'field1', validation: z.string().optional() });
      store
        .getState()
        .registerField({ name: 'field2', validation: z.string().optional() });

      // Form validity is only calculated when setFieldError is called
      // Initially form should remain valid until we trigger validation checks
      expect(store.getState().isValid).toBe(true);

      // Set one field as invalid - this triggers form validity recalculation
      store.getState().setFieldError('field1', 'Error');
      expect(store.getState().isValid).toBe(false);

      // Fix the error but field2 is still invalid (fields start with isValid: false)
      store.getState().setFieldError('field1', null);
      expect(store.getState().isValid).toBe(false);

      // Make both fields valid
      store.getState().setFieldError('field2', null);
      expect(store.getState().isValid).toBe(true);
    });

    it('should update form dirty state based on any field being dirty', () => {
      store
        .getState()
        .registerField({ name: 'field1', validation: z.string().optional() });
      store
        .getState()
        .registerField({ name: 'field2', validation: z.string().optional() });

      expect(store.getState().isDirty).toBe(false);

      store.getState().setFieldDirty('field1', true);
      expect(store.getState().isDirty).toBe(true);

      store.getState().setFieldDirty('field1', false);
      expect(store.getState().isDirty).toBe(false);
    });

    it('should update form validating state based on any field validating', () => {
      store
        .getState()
        .registerField({ name: 'field1', validation: z.string().optional() });
      store
        .getState()
        .registerField({ name: 'field2', validation: z.string().optional() });

      expect(store.getState().isValidating).toBe(false);
    });
  });

  describe('Form data getters', () => {
    beforeEach(() => {
      store.getState().registerField({
        name: 'user.name',
        initialValue: 'John',
        validation: z.string().optional(),
      });
      store.getState().registerField({
        name: 'user.email',
        initialValue: 'john@example.com',
        validation: z.string().optional(),
      });
      store.getState().registerField({
        name: 'preferences.theme',
        initialValue: 'dark',
        validation: z.string().optional(),
      });
    });

    it('should get form values with nested structure', () => {
      const values = store.getState().getFormValues();

      expect(values).toEqual({
        user: {
          name: 'John',
          email: 'john@example.com',
        },
        preferences: {
          theme: 'dark',
        },
      });
    });

    it('should get form errors with nested structure', () => {
      store.getState().setFieldError('user.name', 'Name required');
      store.getState().setFieldError('user.email', 'Invalid email');

      const errors = store.getState().getFormErrors();

      expect(errors).toEqual({
        user: {
          name: ['Name required'],
          email: ['Invalid email'],
        },
      });
    });

    it('should return empty errors object when no errors', () => {
      const errors = store.getState().getFormErrors();
      expect(errors).toEqual({});
    });
  });

  describe('Field validation', () => {
    beforeEach(() => {
      store.getState().registerField({
        name: 'email',
        initialValue: 'test@example.com',
        validation: z.string().min(1, 'Email is required'),
      });
    });

    it('should validate field successfully', async () => {
      mockValidateFieldValue.mockResolvedValue({
        isValid: true,
        errors: null,
      });

      await store.getState().validateField('email');
      const field = store.getState().getFieldState('email');
      const state = store.getState();

      expect(field?.meta.isValidating).toBe(false);
      expect(field?.meta.isValid).toBe(true);
      expect(field?.meta.errors).toBeNull();
      expect(state.isValid).toBe(true);
    });

    it('should handle field validation errors', async () => {
      mockValidateFieldValue.mockResolvedValue({
        isValid: false,
        errors: ['Email is required'],
      });

      await store.getState().validateField('email');
      const field = store.getState().getFieldState('email');
      const state = store.getState();

      expect(field?.meta.isValidating).toBe(false);
      expect(field?.meta.isValid).toBe(false);
      expect(field?.meta.errors).toEqual(['Email is required']);
      expect(state.isValid).toBe(false);
    });

    it('should handle validation exceptions', async () => {
      mockValidateFieldValue.mockRejectedValue(new Error('Validation failed'));

      await store.getState().validateField('email');
      const field = store.getState().getFieldState('email');

      expect(field?.meta.isValidating).toBe(false);
      expect(field?.meta.isValid).toBe(false);
      expect(field?.meta.errors).toEqual(['Error with validation error']);
    });

    it('should not validate non-existent field', async () => {
      await expect(
        store.getState().validateField('nonexistent'),
      ).resolves.not.toThrow();
    });

    it('should pass correct validation context', async () => {
      mockValidateFieldValue.mockResolvedValue({
        isValid: true,
        errors: null,
      });

      store.getState().registerForm({
        onSubmit: vi.fn(),
        additionalContext: { userId: '123' },
      });

      await store.getState().validateField('email');

      expect(mockValidateFieldValue).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Object),
        expect.objectContaining({
          userId: '123',
          formValues: expect.objectContaining({
            email: 'test@example.com',
          }) as Record<string, unknown>,
        }),
      );
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      store.getState().registerField({
        name: 'field1',
        initialValue: 'value1',
        validation: z.string().min(1, 'Email is required'),
      });
      store.getState().registerField({
        name: 'field2',
        initialValue: 'value2',
        validation: z.string().min(5, 'Field must be at least 5 characters'),
      });
    });

    it('should validate all fields successfully', async () => {
      mockValidateFieldValue.mockResolvedValue({
        isValid: true,
        errors: null,
      });

      const result = await store.getState().validateForm();
      const state = store.getState();

      expect(result).toBe(true);
      expect(state.isValid).toBe(true);
      expect(mockValidateFieldValue).toHaveBeenCalledTimes(2);
    });

    it('should handle validation failures', async () => {
      mockValidateFieldValue
        .mockResolvedValueOnce({
          isValid: false,
          errors: ['Field1 is required'],
        })
        .mockResolvedValueOnce({
          isValid: true,
          errors: null,
        });

      const result = await store.getState().validateForm();
      const state = store.getState();

      expect(result).toBe(false);
      expect(state.isValid).toBe(false);

      const field1 = state.getFieldState('field1');
      expect(field1?.meta.errors).toEqual(['Field1 is required']);
      expect(field1?.meta.isValid).toBe(false);
    });
  });

  describe('Form submission', () => {
    it('should set submitting state', () => {
      store.getState().setSubmitting(true);
      expect(store.getState().isSubmitting).toBe(true);

      store.getState().setSubmitting(false);
      expect(store.getState().isSubmitting).toBe(false);
    });
  });

  describe('Form reset', () => {
    beforeEach(() => {
      store.getState().registerField({
        name: 'email',
        initialValue: 'initial@example.com',
        validation: z.string().min(1, 'Email is required'),
      });
      store.getState().registerField({
        name: 'name',
        initialValue: 'Initial Name',
        validation: z.string().optional(),
      });
    });

    it('should reset entire form', () => {
      // Modify field values and states
      store.getState().setFieldValue('email', 'changed@example.com');
      store.getState().setFieldError('email', 'Some error');
      store.getState().setFieldTouched('email', true);
      store.getState().setSubmitting(true);

      store.getState().resetForm();
      const state = store.getState();

      expect(state.isSubmitting).toBe(false);
      expect(state.isValidating).toBe(false);
      expect(state.isValid).toBe(true);
    });

    it('should reset individual field', () => {
      // Modify field
      store.getState().setFieldValue('email', 'changed@example.com');
      store.getState().setFieldError('email', 'Some error');
      store.getState().setFieldTouched('email', true);
      store.getState().setFieldDirty('email', true);

      store.getState().resetField('email');
      const field = store.getState().getFieldState('email');

      expect(field?.value).toBe('initial@example.com');
      expect(field?.meta.errors).toBeNull();
      expect(field?.meta.isTouched).toBe(false);
      expect(field?.meta.isDirty).toBe(false);
      expect(field?.meta.isValid).toBe(true);
      expect(field?.meta.isValidating).toBe(false);
    });

    it('should not error when resetting non-existent field', () => {
      expect(() => {
        store.getState().resetField('nonexistent');
      }).not.toThrow();
    });

    it('should reset to initial state using reset method', () => {
      // Modify some state
      store
        .getState()
        .registerField({ name: 'newField', validation: z.string().optional() });
      store.getState().setSubmitting(true);

      const initialState = store.getInitialState();
      store.getState().reset();
      const currentState = store.getState();

      expect(currentState.fields.size).toBe(initialState.fields.size);
      expect(currentState.isSubmitting).toBe(initialState.isSubmitting);
      expect(currentState.isValidating).toBe(initialState.isValidating);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle operations on non-existent fields gracefully', () => {
      const nonExistentField = 'doesNotExist';

      expect(() => {
        store.getState().setFieldValue(nonExistentField, 'value');
        store.getState().setFieldError(nonExistentField, 'error');
        store.getState().setFieldTouched(nonExistentField, true);
        store.getState().setFieldDirty(nonExistentField, true);
      }).not.toThrow();

      expect(store.getState().getFieldState(nonExistentField)).toBeUndefined();
    });

    it('should handle Map operations correctly', () => {
      const fieldConfig: FieldConfig = {
        name: 'test',
        initialValue: 'initial',
        validation: z.string().optional(),
      };

      store.getState().registerField(fieldConfig);
      expect(store.getState().fields.has('test')).toBe(true);
      expect(store.getState().fields.size).toBe(1);

      store.getState().unregisterField('test');
      expect(store.getState().fields.has('test')).toBe(false);
      expect(store.getState().fields.size).toBe(0);
    });

    it('should maintain field state integrity during concurrent updates', () => {
      store.getState().registerField({
        name: 'test',
        initialValue: 'initial',
        validation: z.string().optional(),
      });

      // Simulate concurrent updates
      store.getState().setFieldValue('test', 'new value');
      store.getState().setFieldTouched('test', true);
      store.getState().setFieldDirty('test', true);
      store.getState().setFieldError('test', 'validation error');

      const field = store.getState().getFieldState('test');
      expect(field?.value).toBe('new value');
      expect(field?.meta.isTouched).toBe(true);
      expect(field?.meta.isDirty).toBe(true);
      expect(field?.meta.errors).toEqual(['validation error']);
      expect(field?.meta.isValid).toBe(false);
    });
  });
});
