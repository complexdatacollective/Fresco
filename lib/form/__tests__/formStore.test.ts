import { describe, it, expect, beforeEach } from 'vitest';
import { createFormStore } from '../store/formStore';
import type { FormConfig, FieldConfig } from '../types';

describe('FormStore', () => {
  let store: ReturnType<typeof createFormStore>;

  beforeEach(() => {
    // Create a fresh store for each test
    store = createFormStore();
  });

  describe('Form Management', () => {
    it('should register a form', () => {
      const { registerForm, getFormState } = store.getState();

      const config: FormConfig = {
        name: 'test-form',
        onSubmit: () => {
          /* no-op */
        },
      };

      registerForm('test-form', config);

      const formState = getFormState('test-form');
      expect(formState).toBeDefined();
      expect(formState?.fields).toEqual({});
      expect(formState?.isSubmitting).toBe(false);
      expect(formState?.isValidating).toBe(false);
      expect(formState?.submitCount).toBe(0);
      expect(formState?.isValid).toBe(true);
    });

    it('should unregister a form', () => {
      const { registerForm, unregisterForm, getFormState } = store.getState();

      const config: FormConfig = {
        name: 'test-form',
        onSubmit: () => {
          /* no-op */
        },
      };

      registerForm('test-form', config);
      expect(getFormState('test-form')).toBeDefined();

      unregisterForm('test-form');
      expect(getFormState('test-form')).toBeUndefined();
    });
  });

  describe('Field Management', () => {
    beforeEach(() => {
      const { registerForm } = store.getState();
      registerForm('test-form', {
        name: 'test-form',
        onSubmit: () => {
          /* no-op */
        },
      });
    });

    it('should register a field', () => {
      const { registerField, getFieldState } = store.getState();

      const fieldConfig: FieldConfig = {
        initialValue: 'test value',
      };

      registerField('test-form', 'test-field', fieldConfig);

      const fieldState = getFieldState('test-form', 'test-field');
      expect(fieldState).toBeDefined();
      expect(fieldState?.value).toBe('test value');
      expect(fieldState?.meta.error).toBe(null);
      expect(fieldState?.meta.isValidating).toBe(false);
      expect(fieldState?.meta.isTouched).toBe(false);
      expect(fieldState?.meta.isDirty).toBe(false);
      expect(fieldState?.meta.isValid).toBe(false);
    });

    it('should unregister a field', () => {
      const { registerField, unregisterField, getFieldState } =
        store.getState();

      registerField('test-form', 'test-field', { initialValue: 'test' });
      expect(getFieldState('test-form', 'test-field')).toBeDefined();

      unregisterField('test-form', 'test-field');
      expect(getFieldState('test-form', 'test-field')).toBeUndefined();
    });

    it('should set field value', () => {
      const { registerField, setValue, getFieldState } = store.getState();

      registerField('test-form', 'test-field', { initialValue: 'initial' });
      setValue('test-form', 'test-field', 'new value');

      const fieldState = getFieldState('test-form', 'test-field');
      expect(fieldState?.value).toBe('new value');
      expect(fieldState?.meta.isDirty).toBe(true);
    });

    it('should set field error', () => {
      const { registerField, setError, getFieldState, getFormState } =
        store.getState();

      registerField('test-form', 'test-field', { initialValue: 'test' });
      setError('test-form', 'test-field', 'Test error');

      const fieldState = getFieldState('test-form', 'test-field');
      const formState = getFormState('test-form');

      expect(fieldState?.meta.error).toBe('Test error');
      expect(fieldState?.meta.isValid).toBe(false);
      expect(formState?.isValid).toBe(false);
    });

    it('should set field touched', () => {
      const { registerField, setTouched, getFieldState } = store.getState();

      registerField('test-form', 'test-field', { initialValue: 'test' });
      setTouched('test-form', 'test-field', true);

      const fieldState = getFieldState('test-form', 'test-field');
      expect(fieldState?.meta.isTouched).toBe(true);
    });

    it('should set field validating state', () => {
      const { registerField, setValidating, getFieldState, getFormState } =
        store.getState();

      registerField('test-form', 'test-field', { initialValue: 'test' });
      setValidating('test-form', 'test-field', true);

      const fieldState = getFieldState('test-form', 'test-field');
      const formState = getFormState('test-form');

      expect(fieldState?.meta.isValidating).toBe(true);
      expect(formState?.isValidating).toBe(true);
    });
  });

  describe('Form Values', () => {
    beforeEach(() => {
      const { registerForm } = store.getState();
      registerForm('test-form', {
        name: 'test-form',
        onSubmit: () => {
          /* no-op */
        },
      });
    });

    it('should get form values', () => {
      const { registerField, setValue, getFormValues } = store.getState();

      registerField('test-form', 'field1', { initialValue: 'value1' });
      registerField('test-form', 'field2', { initialValue: 'value2' });
      setValue('test-form', 'field1', 'updated1');

      const values = getFormValues('test-form');
      expect(values).toEqual({
        field1: 'updated1',
        field2: 'value2',
      });
    });

    it('should handle nested field values', () => {
      const { registerField, getFormValues } = store.getState();

      registerField('test-form', 'user.name', { initialValue: 'John' });
      registerField('test-form', 'user.email', {
        initialValue: 'john@example.com',
      });

      const values = getFormValues('test-form');
      expect(values).toEqual({
        user: {
          name: 'John',
          email: 'john@example.com',
        },
      });
    });
  });

  describe('Form Reset', () => {
    beforeEach(() => {
      const {
        registerForm,
        registerField,
        setValue,
        setError,
        setTouched,
        setDirty,
      } = store.getState();

      registerForm('test-form', {
        name: 'test-form',
        onSubmit: () => {
          /* no-op */
        },
      });

      registerField('test-form', 'field1', { initialValue: 'initial1' });
      registerField('test-form', 'field2', { initialValue: 'initial2' });

      // Modify field states
      setValue('test-form', 'field1', 'modified1');
      setError('test-form', 'field1', 'Test error');
      setTouched('test-form', 'field1', true);
      setDirty('test-form', 'field1', true);
    });

    it('should reset entire form', () => {
      const { resetForm, getFieldState, getFormState } = store.getState();

      resetForm('test-form');

      const field1State = getFieldState('test-form', 'field1');
      const field2State = getFieldState('test-form', 'field2');
      const formState = getFormState('test-form');

      expect(field1State?.value).toBe('initial1');
      expect(field1State?.meta.error).toBe(null);
      expect(field1State?.meta.isTouched).toBe(false);
      expect(field1State?.meta.isDirty).toBe(false);
      expect(field1State?.meta.isValid).toBe(true);

      expect(field2State?.value).toBe('initial2');
      expect(formState?.isValid).toBe(true);
      expect(formState?.submitCount).toBe(0);
    });

    it('should reset individual field', () => {
      const { resetField, getFieldState } = store.getState();

      resetField('test-form', 'field1');

      const field1State = getFieldState('test-form', 'field1');
      const field2State = getFieldState('test-form', 'field2');

      expect(field1State?.value).toBe('initial1');
      expect(field1State?.meta.error).toBe(null);
      expect(field1State?.meta.isTouched).toBe(false);
      expect(field1State?.meta.isDirty).toBe(false);
      expect(field1State?.meta.isValid).toBe(true);

      // field2 should remain unchanged
      expect(field2State?.value).toBe('initial2');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      const { registerForm } = store.getState();
      registerForm('test-form', {
        name: 'test-form',
        onSubmit: () => {
          /* no-op */
        },
      });
    });

    it('should set submitting state', () => {
      const { setSubmitting, getFormState } = store.getState();

      setSubmitting('test-form', true);
      expect(getFormState('test-form')?.isSubmitting).toBe(true);

      setSubmitting('test-form', false);
      expect(getFormState('test-form')?.isSubmitting).toBe(false);
    });

    it('should increment submit count', () => {
      const { incrementSubmitCount, getFormState } = store.getState();

      expect(getFormState('test-form')?.submitCount).toBe(0);

      incrementSubmitCount('test-form');
      expect(getFormState('test-form')?.submitCount).toBe(1);

      incrementSubmitCount('test-form');
      expect(getFormState('test-form')?.submitCount).toBe(2);
    });
  });
});
