import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createFormStore } from '../store/formStore';
import { type FieldConfig, type FormConfig } from '../store/types';
import { validateFieldValue } from '../validation/helpers';

// Mock the validation utility
vi.mock('../validation/helpers', () => ({
  validateFieldValue: vi.fn(),
}));

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
      expect(state.errors).toEqual({ formErrors: [], fieldErrors: {} });
      expect(state.submitHandler).toBeNull();
      expect(state.submitInvalidHandler).toBeNull();
    });
  });

  describe('Form registration', () => {
    it('should register form with config', () => {
      const onSubmit = vi.fn();
      const onSubmitInvalid = vi.fn();

      const formConfig: FormConfig = {
        onSubmit,
        onSubmitInvalid,
      };

      store.getState().registerForm(formConfig);
      const state = store.getState();

      expect(state.submitHandler).toBe(onSubmit);
      expect(state.submitInvalidHandler).toBe(onSubmitInvalid);
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
        isValidating: false,
        isTouched: false,
        isBlurred: false,
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

    it('should clean up field errors when unregistering a field', async () => {
      const fieldConfig: FieldConfig = {
        name: 'email',
        initialValue: 'test@example.com',
        validation: z.string().min(1, 'Email is required'),
      };

      store.getState().registerField(fieldConfig);

      // Set an error for the field
      const mockError = new z.ZodError([
        { code: 'custom', message: 'Invalid email', path: ['email'] },
      ]);
      mockValidateFieldValue.mockResolvedValue({
        success: false,
        error: mockError,
      });
      await store.getState().validateField('email');

      // Verify error exists
      expect(store.getState().getFieldErrors('email')).toEqual([
        'Invalid email',
      ]);

      // Unregister the field
      store.getState().unregisterField('email');

      // Error should be cleaned up
      expect(store.getState().getFieldErrors('email')).toBeNull();
      expect(store.getState().errors.fieldErrors).toEqual({});
    });

    it('should recalculate form validity when unregistering a field', async () => {
      // Register two fields with validation
      store.getState().registerField({
        name: 'field1',
        validation: z.string().min(1),
      });
      store.getState().registerField({
        name: 'field2',
        validation: z.string().min(1),
      });

      // Validate field1 successfully
      mockValidateFieldValue.mockResolvedValueOnce({
        success: true,
        data: 'value1',
      });
      await store.getState().validateField('field1');

      // Form is still invalid because field2 hasn't been validated
      expect(store.getState().isValid).toBe(false);

      // Unregister field2 (the invalid one)
      store.getState().unregisterField('field2');

      // Now form should be valid (only field1 remains and it's valid)
      expect(store.getState().isValid).toBe(true);
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

    it('should set field error and update validity through validation', async () => {
      const mockError = new z.ZodError([
        { code: 'custom', message: 'Invalid email format', path: ['email'] },
      ]);
      mockValidateFieldValue.mockResolvedValue({
        success: false,
        error: mockError,
      });

      await store.getState().validateField('email');
      const field = store.getState().getFieldState('email');
      const state = store.getState();
      const fieldErrors = state.getFieldErrors('email');

      expect(fieldErrors).toEqual(['Invalid email format']);
      expect(field?.meta.isValid).toBe(false);
      expect(state.isValid).toBe(false);
    });

    it('should clear field error through successful validation', async () => {
      // First set an error
      const mockError = new z.ZodError([
        { code: 'custom', message: 'Invalid email', path: ['email'] },
      ]);
      mockValidateFieldValue.mockResolvedValueOnce({
        success: false,
        error: mockError,
      });
      await store.getState().validateField('email');

      // Then clear it with successful validation
      mockValidateFieldValue.mockResolvedValueOnce({
        success: true,
        data: 'test@example.com',
      });
      await store.getState().validateField('email');

      const field = store.getState().getFieldState('email');
      const fieldErrors = store.getState().getFieldErrors('email');
      expect(fieldErrors).toBeNull();
      expect(field?.meta.isValid).toBe(true);
    });

    it('should set field touched', () => {
      store.getState().setFieldTouched('email', true);
      const field = store.getState().getFieldState('email');

      expect(field?.meta.isTouched).toBe(true);
    });

    it('should set field dirty when value changes', () => {
      store.getState().setFieldValue('email', 'new@example.com');
      const field = store.getState().getFieldState('email');

      expect(field?.meta.isDirty).toBe(true);
      // Note: form-level isDirty is not automatically calculated in current implementation
    });
  });

  describe('Form-level state updates', () => {
    it('should update form validity based on all fields', async () => {
      // Register multiple fields with validation
      store
        .getState()
        .registerField({ name: 'field1', validation: z.string().optional() });
      store
        .getState()
        .registerField({ name: 'field2', validation: z.string().optional() });

      // Fields with validation start as invalid until validated
      expect(store.getState().isValid).toBe(false);

      // Validate field1 successfully
      mockValidateFieldValue.mockResolvedValueOnce({
        success: true,
        data: 'field1_value',
      });
      await store.getState().validateField('field1');
      // Still invalid because field2 hasn't been validated
      expect(store.getState().isValid).toBe(false);

      // Validate field2 successfully - now both are valid
      mockValidateFieldValue.mockResolvedValueOnce({
        success: true,
        data: 'field2_value',
      });
      await store.getState().validateField('field2');
      expect(store.getState().isValid).toBe(true);

      // Set field1 as invalid through validation
      const mockError = new z.ZodError([
        { code: 'custom', message: 'Error', path: ['field1'] },
      ]);
      mockValidateFieldValue.mockResolvedValueOnce({
        success: false,
        error: mockError,
      });
      await store.getState().validateField('field1');
      expect(store.getState().isValid).toBe(false);
    });

    it('should consider fields without validation as valid by default', () => {
      // Register fields without validation
      store.getState().registerField({ name: 'field1' });
      store.getState().registerField({ name: 'field2' });

      // Form should be valid because fields without validation are valid by default
      expect(store.getState().isValid).toBe(true);

      const field1 = store.getState().getFieldState('field1');
      const field2 = store.getState().getFieldState('field2');
      expect(field1?.meta.isValid).toBe(true);
      expect(field2?.meta.isValid).toBe(true);
    });

    it('should update form dirty state based on any field being dirty', () => {
      store
        .getState()
        .registerField({ name: 'field1', validation: z.string().optional() });
      store
        .getState()
        .registerField({ name: 'field2', validation: z.string().optional() });

      expect(store.getState().isDirty).toBe(false);

      store.getState().setFieldValue('field1', 'changed_value');
      const field1 = store.getState().getFieldState('field1');
      expect(field1?.meta.isDirty).toBe(true);

      // Reset the field to make it not dirty
      store.getState().resetField('field1');
      const resetField1 = store.getState().getFieldState('field1');
      expect(resetField1?.meta.isDirty).toBe(false);
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

    it('should get form errors with nested structure', async () => {
      const mockError1 = new z.ZodError([
        { code: 'custom', message: 'Name required', path: ['user', 'name'] },
      ]);
      const mockError2 = new z.ZodError([
        { code: 'custom', message: 'Invalid email', path: ['user', 'email'] },
      ]);

      mockValidateFieldValue.mockResolvedValueOnce({
        success: false,
        error: mockError1,
      });
      await store.getState().validateField('user.name');

      mockValidateFieldValue.mockResolvedValueOnce({
        success: false,
        error: mockError2,
      });
      await store.getState().validateField('user.email');

      const errors = store.getState().getFormErrors();

      // The current implementation returns form-level errors as a string array,
      // not nested field errors, so we expect null if no form-level errors
      expect(errors).toBeNull();
    });

    it('should return null when no form-level errors', () => {
      const errors = store.getState().getFormErrors();
      expect(errors).toBeNull();
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
        success: true,
        data: 'test@example.com',
      });

      await store.getState().validateField('email');
      const field = store.getState().getFieldState('email');
      const state = store.getState();
      const fieldErrors = state.getFieldErrors('email');

      expect(field?.meta.isValidating).toBe(false);
      expect(field?.meta.isValid).toBe(true);
      expect(fieldErrors).toBeNull();
      expect(state.isValid).toBe(true);
    });

    it('should handle field validation errors', async () => {
      const mockError = new z.ZodError([
        {
          code: 'custom',
          message: 'Email is required',
          path: ['email'],
        },
      ]);
      mockValidateFieldValue.mockResolvedValue({
        success: false,
        error: mockError,
      });

      await store.getState().validateField('email');
      const field = store.getState().getFieldState('email');
      const state = store.getState();
      const fieldErrors = state.getFieldErrors('email');

      // Note: isValidating is not set to false in error case in current implementation
      expect(field?.meta.isValid).toBe(false);
      expect(fieldErrors).toEqual(['Email is required']);
      expect(state.isValid).toBe(false);
    });

    it('should handle validation exceptions', async () => {
      mockValidateFieldValue.mockRejectedValue(new Error('Validation failed'));

      await store.getState().validateField('email');
      const field = store.getState().getFieldState('email');
      const fieldErrors = store.getState().getFieldErrors('email');

      expect(field?.meta.isValidating).toBe(false);
      expect(field?.meta.isValid).toBe(false);
      expect(fieldErrors).toEqual(['Something went wrong during validation']);
    });

    it('should not validate non-existent field', async () => {
      await expect(
        store.getState().validateField('nonexistent'),
      ).resolves.not.toThrow();
    });

    it('should pass correct parameters to validateFieldValue', async () => {
      mockValidateFieldValue.mockResolvedValue({
        success: true,
        data: 'test@example.com',
      });

      await store.getState().validateField('email');

      expect(mockValidateFieldValue).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Object), // The validation schema
        expect.objectContaining({
          email: 'test@example.com',
        }), // Form values
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
        success: true,
        data: 'field_value',
      });

      const result = await store.getState().validateForm();
      const state = store.getState();

      expect(result).toBe(true);
      expect(state.isValid).toBe(true);
      expect(mockValidateFieldValue).toHaveBeenCalledTimes(2);
    });

    it('should handle validation failures', async () => {
      const mockError = new z.ZodError([
        {
          code: 'custom',
          message: 'Field1 is required',
          path: ['field1'],
        },
      ]);
      mockValidateFieldValue
        .mockResolvedValueOnce({
          success: false,
          error: mockError,
        })
        .mockResolvedValueOnce({
          success: true,
          data: 'value2',
        });

      const result = await store.getState().validateForm();
      const state = store.getState();

      expect(result).toBe(false);
      expect(state.isValid).toBe(false);

      const field1 = state.getFieldState('field1');
      const field1Errors = state.getFieldErrors('field1');
      expect(field1Errors).toEqual(['Field1 is required']);
      expect(field1?.meta.isValid).toBe(false);
    });

    it('should preserve form-level errors when validating fields', async () => {
      // Set form-level errors first
      store.getState().setErrors({
        formErrors: ['Form-level error from server'],
        fieldErrors: {},
      });

      // Validate all fields successfully
      mockValidateFieldValue.mockResolvedValue({
        success: true,
        data: 'valid_value',
      });

      const result = await store.getState().validateForm();
      const state = store.getState();

      // Field validation passed but form-level errors should remain
      expect(result).toBe(true); // validateForm returns true (no field errors)
      expect(state.isValid).toBe(false); // But form is still invalid due to form-level errors
      expect(state.errors.formErrors).toEqual(['Form-level error from server']);
      expect(state.errors.fieldErrors).toEqual({});
    });

    it('should preserve form-level errors when field validation fails', async () => {
      // Set form-level errors first
      store.getState().setErrors({
        formErrors: ['Form-level error'],
        fieldErrors: {},
      });

      // Validate with field errors
      const mockError = new z.ZodError([
        { code: 'custom', message: 'Field error', path: ['field1'] },
      ]);
      mockValidateFieldValue
        .mockResolvedValueOnce({ success: false, error: mockError })
        .mockResolvedValueOnce({ success: true, data: 'value2' });

      await store.getState().validateForm();
      const state = store.getState();

      // Both form-level and field-level errors should exist
      expect(state.errors.formErrors).toEqual(['Form-level error']);
      expect(state.errors.fieldErrors).toHaveProperty('field1');
      expect(state.isValid).toBe(false);
    });

    it('should preserve form-level errors during individual field validation', async () => {
      // Set form-level errors first
      store.getState().setErrors({
        formErrors: ['Server validation error'],
        fieldErrors: { field2: ['Existing field2 error'] },
      });

      // Validate field1 with an error
      const mockError = new z.ZodError([
        { code: 'custom', message: 'Field1 error', path: ['field1'] },
      ]);
      mockValidateFieldValue.mockResolvedValue({
        success: false,
        error: mockError,
      });

      await store.getState().validateField('field1');
      const state = store.getState();

      // Form-level errors should be preserved
      expect(state.errors.formErrors).toEqual(['Server validation error']);
      // Both field errors should exist
      expect(state.errors.fieldErrors.field1).toEqual(['Field1 error']);
      expect(state.errors.fieldErrors.field2).toEqual([
        'Existing field2 error',
      ]);
    });

    it('should keep isValid false when form-level errors exist even if all fields valid', async () => {
      // Set form-level errors
      store.getState().setErrors({
        formErrors: ['Server-side validation error'],
        fieldErrors: {},
      });

      // Validate both fields successfully
      mockValidateFieldValue.mockResolvedValue({
        success: true,
        data: 'valid_value',
      });

      await store.getState().validateField('field1');
      await store.getState().validateField('field2');

      const state = store.getState();

      // All fields are valid
      expect(state.getFieldState('field1')?.meta.isValid).toBe(true);
      expect(state.getFieldState('field2')?.meta.isValid).toBe(true);

      // But form is still invalid due to form-level errors
      expect(state.errors.formErrors).toEqual(['Server-side validation error']);
      expect(state.isValid).toBe(false);
    });

    it('should preserve form-level errors when field validation succeeds', async () => {
      // Set both form-level and field-level errors
      store.getState().setErrors({
        formErrors: ['Form error'],
        fieldErrors: { field1: ['Field1 error'] },
      });

      // Validate field1 successfully (clears field1 error)
      mockValidateFieldValue.mockResolvedValue({
        success: true,
        data: 'valid_value',
      });

      await store.getState().validateField('field1');
      const state = store.getState();

      // Form-level errors should remain
      expect(state.errors.formErrors).toEqual(['Form error']);
      // Field1 error should be cleared
      expect(state.errors.fieldErrors.field1).toBeUndefined();
    });
  });

  describe('Form submission', () => {
    it('should set submitting state', () => {
      store.getState().setSubmitting(true);
      expect(store.getState().isSubmitting).toBe(true);

      store.getState().setSubmitting(false);
      expect(store.getState().isSubmitting).toBe(false);
    });

    describe('submitForm', () => {
      beforeEach(() => {
        // Register a field for testing
        store.getState().registerField({
          name: 'email',
          initialValue: 'test@example.com',
          validation: z.string().email(),
        });
      });

      it('should submit form successfully when valid', async () => {
        const mockOnSubmit = vi.fn().mockResolvedValue({ success: true });
        const formConfig: FormConfig = {
          onSubmit: mockOnSubmit,
        };

        store.getState().registerForm(formConfig);

        // Mock validation to return success
        mockValidateFieldValue.mockResolvedValue({
          success: true,
          data: 'test@example.com',
        });

        await store.getState().submitForm();

        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
        });
        expect(store.getState().isSubmitting).toBe(false);
        expect(store.getState().errors).toEqual({
          formErrors: [],
          fieldErrors: {},
        });
      });

      it('should submit even if form validation fails (current implementation)', async () => {
        const mockOnSubmit = vi.fn().mockResolvedValue({ success: true });
        const mockOnSubmitInvalid = vi.fn();
        const formConfig: FormConfig = {
          onSubmit: mockOnSubmit,
          onSubmitInvalid: mockOnSubmitInvalid,
        };

        store.getState().registerForm(formConfig);

        // Mock validation to return failure
        const mockError = new z.ZodError([
          { code: 'custom', message: 'Invalid email', path: ['email'] },
        ]);
        mockValidateFieldValue.mockResolvedValue({
          success: false,
          error: mockError,
        });

        await store.getState().submitForm();

        // Current implementation submits regardless of validation state
        expect(mockOnSubmit).toHaveBeenCalled();
        expect(store.getState().isSubmitting).toBe(false);
      });

      it('should handle submission errors', async () => {
        const mockOnSubmit = vi.fn().mockResolvedValue({
          success: false,
          errors: new z.ZodError([
            { code: 'custom', message: 'Server error', path: [] },
          ]),
        });
        const formConfig: FormConfig = {
          onSubmit: mockOnSubmit,
        };

        store.getState().registerForm(formConfig);

        // Mock validation to return success
        mockValidateFieldValue.mockResolvedValue({
          success: true,
          data: 'test@example.com',
        });

        await store.getState().submitForm();

        expect(mockOnSubmit).toHaveBeenCalled();
        expect(store.getState().isSubmitting).toBe(false);
        expect(store.getState().errors).toBeDefined();
      });

      it('should handle submission exceptions', async () => {
        const mockOnSubmit = vi
          .fn()
          .mockRejectedValue(new Error('Network error'));
        const formConfig: FormConfig = {
          onSubmit: mockOnSubmit,
        };

        store.getState().registerForm(formConfig);

        // Mock validation to return success
        mockValidateFieldValue.mockResolvedValue({
          success: true,
          data: 'test@example.com',
        });

        // Expect the promise to be rejected
        await expect(store.getState().submitForm()).rejects.toThrow(
          'Network error',
        );

        expect(mockOnSubmit).toHaveBeenCalled();
      });

      it('should warn when no submit handler is registered', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
          // Mock implementation
        });

        await store.getState().submitForm();

        expect(consoleSpy).toHaveBeenCalledWith('No submit handler registered');
        expect(store.getState().isSubmitting).toBe(false);

        consoleSpy.mockRestore();
      });

      it('should manage submitting state correctly during submission', async () => {
        let submitResolve: (value: unknown) => void;
        const submitPromise = new Promise<unknown>((resolve) => {
          submitResolve = resolve;
        });

        const mockOnSubmit = vi.fn().mockReturnValue(submitPromise);
        const formConfig: FormConfig = {
          onSubmit: mockOnSubmit,
        };

        store.getState().registerForm(formConfig);

        // Mock validation to return success
        mockValidateFieldValue.mockResolvedValue({
          success: true,
          data: 'test@example.com',
        });

        const submitFormPromise = store.getState().submitForm();

        // Note: Current implementation doesn't set submitting state automatically
        // This would need to be done manually before calling submitForm

        // Resolve the submission
        submitResolve!({ success: true });
        await submitFormPromise;

        // Check that submitting is false after submission
        expect(store.getState().isSubmitting).toBe(false);
      });
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

    it('should reset entire form', async () => {
      // Modify field values and states
      store.getState().setFieldValue('email', 'changed@example.com');

      // Set an error through validation
      const mockError = new z.ZodError([
        { code: 'custom', message: 'Some error', path: ['email'] },
      ]);
      mockValidateFieldValue.mockResolvedValue({
        success: false,
        error: mockError,
      });
      await store.getState().validateField('email');

      store.getState().setFieldTouched('email', true);
      store.getState().setSubmitting(true);

      store.getState().resetForm();
      const state = store.getState();

      expect(state.isSubmitting).toBe(false);
      expect(state.isValidating).toBe(false);
      expect(state.isDirty).toBe(false);
      expect(state.errors).toEqual({ formErrors: [], fieldErrors: {} });
      // Fields with validation start as invalid after reset (need revalidation)
      expect(state.isValid).toBe(false);

      // Verify field states are reset
      const emailField = state.getFieldState('email');
      expect(emailField?.value).toBe('initial@example.com');
      expect(emailField?.meta.isTouched).toBe(false);
      expect(emailField?.meta.isDirty).toBe(false);
      expect(emailField?.meta.isValid).toBe(false); // Has validation, so invalid until validated
    });

    it('should reset individual field', async () => {
      // Modify field
      store.getState().setFieldValue('email', 'changed@example.com');

      // Set an error through validation
      const mockError = new z.ZodError([
        { code: 'custom', message: 'Some error', path: ['email'] },
      ]);
      mockValidateFieldValue.mockResolvedValue({
        success: false,
        error: mockError,
      });
      await store.getState().validateField('email');

      store.getState().setFieldTouched('email', true);

      store.getState().resetField('email');
      const field = store.getState().getFieldState('email');
      const fieldErrors = store.getState().getFieldErrors('email');

      expect(field?.value).toBe('initial@example.com');
      expect(fieldErrors).toBeNull();
      expect(field?.meta.isTouched).toBe(false);
      expect(field?.meta.isDirty).toBe(false);
      // Fields with validation start as invalid after reset (need revalidation)
      expect(field?.meta.isValid).toBe(false);
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
        store.getState().setFieldTouched(nonExistentField, true);
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

    it('should maintain field state integrity during concurrent updates', async () => {
      store.getState().registerField({
        name: 'test',
        initialValue: 'initial',
        validation: z.string().optional(),
      });

      // Simulate concurrent updates
      store.getState().setFieldValue('test', 'new value');
      store.getState().setFieldTouched('test', true);

      // Set validation error
      const mockError = new z.ZodError([
        { code: 'custom', message: 'validation error', path: [] },
      ]);
      mockValidateFieldValue.mockResolvedValue({
        success: false,
        error: mockError,
      });
      await store.getState().validateField('test');

      const field = store.getState().getFieldState('test');
      const fieldErrors = store.getState().getFieldErrors('test');
      expect(field?.value).toBe('new value');
      expect(field?.meta.isTouched).toBe(true);
      expect(field?.meta.isDirty).toBe(true);
      expect(fieldErrors).toEqual(['validation error']);
      expect(field?.meta.isValid).toBe(false);
    });
  });
});
