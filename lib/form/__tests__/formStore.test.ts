import { describe, it, expect, beforeEach } from 'vitest';
import { useFormStore } from '../store/formStore';
import type { FormConfig, FieldConfig } from '../types';

describe('FormStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useFormStore.setState({
      forms: new Map(),
      formConfigs: new Map(),
      fieldConfigs: new Map(),
    });
  });

  describe('Form Management', () => {
    it('should register a form', () => {
      const { registerForm, getFormState } = useFormStore.getState();

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
      const { registerForm, unregisterForm, getFormState } =
        useFormStore.getState();

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
      const { registerForm } = useFormStore.getState();
      registerForm('test-form', {
        name: 'test-form',
        onSubmit: () => {
          /* no-op */
        },
      });
    });

    it('should register a field', () => {
      const { registerField, getFieldState } = useFormStore.getState();

      const fieldConfig: FieldConfig = {
        initialValue: 'test value',
      };

      registerField('test-form', 'test-field', fieldConfig);

      const fieldState = getFieldState('test-form', 'test-field');
      expect(fieldState).toBeDefined();
      expect(fieldState?.value).toBe('test value');
      expect(fieldState?.error).toBe(null);
      expect(fieldState?.isValidating).toBe(false);
      expect(fieldState?.isTouched).toBe(false);
      expect(fieldState?.isDirty).toBe(false);
      expect(fieldState?.isValid).toBe(true);
    });

    it('should unregister a field', () => {
      const { registerField, unregisterField, getFieldState } =
        useFormStore.getState();

      registerField('test-form', 'test-field', { initialValue: 'test' });
      expect(getFieldState('test-form', 'test-field')).toBeDefined();

      unregisterField('test-form', 'test-field');
      expect(getFieldState('test-form', 'test-field')).toBeUndefined();
    });

    it('should set field value', () => {
      const { registerField, setValue, getFieldState } =
        useFormStore.getState();

      registerField('test-form', 'test-field', { initialValue: 'initial' });
      setValue('test-form', 'test-field', 'new value');

      const fieldState = getFieldState('test-form', 'test-field');
      expect(fieldState?.value).toBe('new value');
      expect(fieldState?.isDirty).toBe(true);
    });

    it('should set field error', () => {
      const { registerField, setError, getFieldState, getFormState } =
        useFormStore.getState();

      registerField('test-form', 'test-field', { initialValue: 'test' });
      setError('test-form', 'test-field', 'Test error');

      const fieldState = getFieldState('test-form', 'test-field');
      const formState = getFormState('test-form');

      expect(fieldState?.error).toBe('Test error');
      expect(fieldState?.isValid).toBe(false);
      expect(formState?.isValid).toBe(false);
    });

    it('should set field touched', () => {
      const { registerField, setTouched, getFieldState } =
        useFormStore.getState();

      registerField('test-form', 'test-field', { initialValue: 'test' });
      setTouched('test-form', 'test-field', true);

      const fieldState = getFieldState('test-form', 'test-field');
      expect(fieldState?.isTouched).toBe(true);
    });

    it('should set field validating state', () => {
      const { registerField, setValidating, getFieldState, getFormState } =
        useFormStore.getState();

      registerField('test-form', 'test-field', { initialValue: 'test' });
      setValidating('test-form', 'test-field', true);

      const fieldState = getFieldState('test-form', 'test-field');
      const formState = getFormState('test-form');

      expect(fieldState?.isValidating).toBe(true);
      expect(formState?.isValidating).toBe(true);
    });
  });

  describe('Form Values', () => {
    beforeEach(() => {
      const { registerForm } = useFormStore.getState();
      registerForm('test-form', {
        name: 'test-form',
        onSubmit: () => {
          /* no-op */
        },
      });
    });

    it('should get form values', () => {
      const { registerField, setValue, getFormValues } =
        useFormStore.getState();

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
      const { registerField, getFormValues } = useFormStore.getState();

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
      } = useFormStore.getState();

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
      const { resetForm, getFieldState, getFormState } =
        useFormStore.getState();

      resetForm('test-form');

      const field1State = getFieldState('test-form', 'field1');
      const field2State = getFieldState('test-form', 'field2');
      const formState = getFormState('test-form');

      expect(field1State?.value).toBe('initial1');
      expect(field1State?.error).toBe(null);
      expect(field1State?.isTouched).toBe(false);
      expect(field1State?.isDirty).toBe(false);
      expect(field1State?.isValid).toBe(true);

      expect(field2State?.value).toBe('initial2');
      expect(formState?.isValid).toBe(true);
      expect(formState?.submitCount).toBe(0);
    });

    it('should reset individual field', () => {
      const { resetField, getFieldState } = useFormStore.getState();

      resetField('test-form', 'field1');

      const field1State = getFieldState('test-form', 'field1');
      const field2State = getFieldState('test-form', 'field2');

      expect(field1State?.value).toBe('initial1');
      expect(field1State?.error).toBe(null);
      expect(field1State?.isTouched).toBe(false);
      expect(field1State?.isDirty).toBe(false);
      expect(field1State?.isValid).toBe(true);

      // field2 should remain unchanged
      expect(field2State?.value).toBe('initial2');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      const { registerForm } = useFormStore.getState();
      registerForm('test-form', {
        name: 'test-form',
        onSubmit: () => {
          /* no-op */
        },
      });
    });

    it('should set submitting state', () => {
      const { setSubmitting, getFormState } = useFormStore.getState();

      setSubmitting('test-form', true);
      expect(getFormState('test-form')?.isSubmitting).toBe(true);

      setSubmitting('test-form', false);
      expect(getFormState('test-form')?.isSubmitting).toBe(false);
    });

    it('should increment submit count', () => {
      const { incrementSubmitCount, getFormState } = useFormStore.getState();

      expect(getFormState('test-form')?.submitCount).toBe(0);

      incrementSubmitCount('test-form');
      expect(getFormState('test-form')?.submitCount).toBe(1);

      incrementSubmitCount('test-form');
      expect(getFormState('test-form')?.submitCount).toBe(2);
    });
  });
});
