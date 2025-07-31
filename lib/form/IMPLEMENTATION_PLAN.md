# Form System Implementation Plan

## Overview

A modern form system based on Zustand state management with selective field subscriptions, dynamic field registration, and Zod validation.

## Core Requirements

- Form component with Zustand store state management
- Dynamic field registration/deregistration
- Selective store subscription to avoid performance issues
- Field component that wraps controlled inputs
- Nested field support (e.g., `user.address.street`)
- Field arrays support
- Zod validation (sync and async)
- Async form submission with loading states

## Architecture

### 1. Type Definitions (`lib/form/types/index.ts`)

```typescript
import { z } from 'zod';

export type FieldValue = any;

export type FieldState = {
  value: FieldValue;
  error: string | null;
  isValidating: boolean;
  isTouched: boolean;
  isDirty: boolean;
  isValid: boolean;
};

export type FormState = {
  fields: Record<string, FieldState>;
  isSubmitting: boolean;
  isValidating: boolean;
  submitCount: number;
  isValid: boolean;
};

export type FieldConfig = {
  initialValue?: FieldValue;
  validation?:
    | z.ZodTypeAny
    | ((context: ValidationContext) => z.ZodTypeAny | Promise<z.ZodTypeAny>);
};

export type FormConfig = {
  name: string;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onSubmitInvalid?: (errors: Record<string, string>) => void;
  focusFirstInput?: boolean;
  fieldContext?: any;
};

export type ValidationContext = {
  formContext: any;
  fieldContext: any;
  formValues: Record<string, any>;
};
```

### 2. Zustand Store (`lib/form/store/formStore.ts`)

```typescript
interface FormStore {
  forms: Map<string, FormState>;

  // Form management
  registerForm: (name: string, config: FormConfig) => void;
  unregisterForm: (name: string) => void;

  // Field management
  registerField: (
    formName: string,
    fieldName: string,
    config: FieldConfig,
  ) => void;
  unregisterField: (formName: string, fieldName: string) => void;

  // Field state updates
  setValue: (formName: string, fieldName: string, value: any) => void;
  setError: (formName: string, fieldName: string, error: string | null) => void;
  setTouched: (formName: string, fieldName: string, touched: boolean) => void;
  setDirty: (formName: string, fieldName: string, dirty: boolean) => void;
  setValidating: (
    formName: string,
    fieldName: string,
    validating: boolean,
  ) => void;

  // Getters with selective subscription
  getFieldState: (
    formName: string,
    fieldName: string,
  ) => FieldState | undefined;
  getFormValues: (formName: string) => Record<string, any>;
  getFormState: (formName: string) => FormState | undefined;

  // Validation
  validateField: (
    formName: string,
    fieldName: string,
    context: ValidationContext,
  ) => Promise<void>;
  validateForm: (formName: string) => Promise<boolean>;

  // Form submission
  setSubmitting: (formName: string, submitting: boolean) => void;
  incrementSubmitCount: (formName: string) => void;
}
```

Key implementation details:

- Use immer for immutable updates
- Support nested field paths using estoolkit's get/set
- Selective subscriptions using zustand's subscribe with selector

### 3. Form Context (`lib/form/context/FormContext.tsx`)

```typescript
interface FormContextValue {
  formName: string;
  fieldContext: any;
  focusFirstInput?: boolean;
}

export const FormContext = createContext<FormContextValue | null>(null);
```

### 4. useForm Hook (`lib/form/hooks/useForm.ts`)

Responsibilities:

- Register/unregister form on mount/unmount
- Handle form submission
- Provide form-level methods
- Return props for the form element

```typescript
export function useForm(config: FormConfig) {
  const formId = useId();
  const formName = config.name || formId;

  // Register form on mount
  useEffect(() => {
    registerForm(formName, config);
    return () => unregisterForm(formName);
  }, [formName]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Validate all fields
    // Call onSubmit or onSubmitInvalid
    // Handle async submission
  };

  return {
    formProps: {
      'onSubmit': handleSubmit,
      'data-form-name': formName,
    },
    formName,
    // Additional methods if needed
  };
}
```

### 5. useField Hook (`lib/form/hooks/useField.ts`)

Responsibilities:

- Register/unregister field on mount/unmount
- Subscribe to specific field state (selective subscription)
- Handle validation on change/blur
- Provide field props

```typescript
export function useField(config: {
  name: string;
  initialValue?: any;
  validation?: z.ZodTypeAny | ((context: ValidationContext) => z.ZodTypeAny);
}) {
  const formContext = useContext(FormContext);
  const formName = formContext.formName;

  // Register field
  useEffect(() => {
    registerField(formName, config.name, {
      initialValue: config.initialValue,
      validation: config.validation,
    });
    return () => unregisterField(formName, config.name);
  }, [formName, config.name]);

  // Selective subscription to field state
  const fieldState = useStore(
    formStore,
    (state) => state.getFieldState(formName, config.name),
    shallow,
  );

  const handleChange = (value: any) => {
    setValue(formName, config.name, value);
    // Trigger validation (debounced)
  };

  const handleBlur = () => {
    setTouched(formName, config.name, true);
  };

  return {
    value: fieldState?.value ?? config.initialValue,
    error: fieldState?.error,
    isValid: fieldState?.isValid ?? true,
    isTouched: fieldState?.isTouched ?? false,
    isDirty: fieldState?.isDirty ?? false,
    onChange: handleChange,
    onBlur: handleBlur,
  };
}
```

### 6. Validation System (`lib/form/utils/validation.ts`)

```typescript
export async function validateFieldValue(
  value: any,
  validation: FieldConfig['validation'],
  context: ValidationContext,
): Promise<{ isValid: boolean; error: string | null }> {
  if (!validation) return { isValid: true, error: null };

  try {
    const schema =
      typeof validation === 'function' ? await validation(context) : validation;

    await schema.parseAsync(value);
    return { isValid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || 'Invalid value',
      };
    }
    return { isValid: false, error: 'Validation error' };
  }
}
```

### 7. Field Array Support

Implement utility functions for:

- Adding/removing array items
- Moving items
- Getting array field helpers

```typescript
export function useFieldArray(name: string) {
  const formContext = useContext(FormContext);
  const arrayFields = useStore(/* selective subscription to array fields */);

  return {
    fields: arrayFields,
    append: (value: any) => {
      /* implementation */
    },
    remove: (index: number) => {
      /* implementation */
    },
    move: (from: number, to: number) => {
      /* implementation */
    },
  };
}
```

## Implementation Order

1. **Phase 1: Core Infrastructure**
   - Type definitions
   - Zustand store with basic operations
   - Form context

2. **Phase 2: Basic Functionality**
   - useForm hook (without validation)
   - useField hook (without validation)
   - Update Form.tsx component
   - Create basic InputField example

3. **Phase 3: Validation**
   - Validation utilities
   - Integrate validation into hooks
   - Error handling and display

4. **Phase 4: Advanced Features**
   - Field arrays (useFieldArray)
   - Nested field support
   - Async validation
   - Form submission with loading states

5. **Phase 5: Additional Field Components**
   - TextAreaField
   - SelectField
   - CheckboxField
   - RadioGroupField

6. **Phase 7: Testing & Documentation**
   - Unit tests for store
   - Integration tests for form scenarios
   - Usage documentation

**ONGOING: Storybook Stories**

- Create stories directory structure (`lib/form/stories/`)
- Create stories for each feature as it is implemented. Test using the playwright mcp by visiting <http://localhost:6006>

## Example Usage

```tsx
function UserForm() {
  const handleSubmit = async (data) => {
    await api.saveUser(data);
  };

  return (
    <Form name="user" onSubmit={handleSubmit}>
      <Field
        name="email"
        label="Email"
        Component={InputField}
        validation={z.string().email()}
      />

      <Field
        name="user.profile.name"
        label="Name"
        Component={InputField}
        validation={z.string().min(2)}
      />

      <FieldArray name="hobbies">
        {({ fields, append, remove }) => (
          <>
            {fields.map((field, index) => (
              <Field
                key={field.id}
                name={`hobbies.${index}`}
                label={`Hobby ${index + 1}`}
                Component={InputField}
              />
            ))}
            <button onClick={() => append('')}>Add Hobby</button>
          </>
        )}
      </FieldArray>

      <SubmitButton />
    </Form>
  );
}
```

## Storybook Stories Structure

### Story Files (`lib/form/stories/`)

1. **Form.stories.tsx** - Basic form functionality
   - Default form
   - Form with initial values
   - Form with custom styling
   - Multiple forms on same page
   - Form reset functionality

2. **Validation.stories.tsx** - Validation scenarios
   - Required fields
   - Email validation
   - Number validation with min/max
   - Custom validation rules
   - Async validation (username availability)
   - Cross-field validation
   - Show validation timing (onChange vs onBlur)

3. **FieldTypes.stories.tsx** - Different field components
   - InputField variations
   - TextAreaField
   - SelectField
   - CheckboxField
   - RadioGroupField
   - Custom field components

4. **FieldArrays.stories.tsx** - Dynamic field arrays
   - Simple list of inputs
   - Complex nested objects
   - Add/remove/move operations
   - Validation within arrays
   - Conditional field arrays

5. **NestedFields.stories.tsx** - Nested field structures
   - User profile form (user.name, user.email, user.address.street)
   - Deep nesting examples
   - Dynamic nested structures

6. **FormStates.stories.tsx** - Form state management
   - Loading states during submission
   - Error states
   - Success states
   - Disabled form states
   - Field touched/dirty states visualization

7. **Performance.stories.tsx** - Performance testing
   - Form with 100+ fields
   - Rapid typing simulation
   - Field subscription testing
   - Re-render visualization

8. **Integration.stories.tsx** - Real-world examples
   - User registration form
   - Multi-step form wizard
   - Search form with filters
   - Settings form with sections

### Story Utilities (`lib/form/stories/utils/`)

```typescript
// lib/form/stories/utils/StoryDecorators.tsx
export const FormDecorator = (Story: React.ComponentType) => (
  <div className="p-8 max-w-2xl mx-auto">
    <Story />
  </div>
);

// lib/form/stories/utils/mockHandlers.ts
export const mockSubmitHandler = action('form-submitted');
export const mockAsyncSubmit = (delay = 1000) =>
  new Promise(resolve => setTimeout(resolve, delay));

// lib/form/stories/utils/sampleData.ts
export const sampleUserData = {
  email: 'user@example.com',
  name: 'John Doe',
  age: 25,
};
```

### Example Story Structure

```typescript
// lib/form/stories/Validation.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Form, Field, InputField } from '../components/Form';
import { z } from 'zod';

const meta: Meta<typeof Form> = {
  title: 'Form/Validation',
  component: Form,
  decorators: [FormDecorator],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const RequiredFields: Story = {
  render: () => (
    <Form name="required-fields" onSubmit={mockSubmitHandler}>
      <Field
        name="email"
        label="Email (Required)"
        Component={InputField}
        validation={z.string().email().min(1, 'Email is required')}
      />
      <SubmitButton />
    </Form>
  ),
};

export const AsyncValidation: Story = {
  render: () => (
    <Form name="async-validation" onSubmit={mockSubmitHandler}>
      <Field
        name="username"
        label="Username"
        hint="Checking availability..."
        Component={InputField}
        validation={async ({ formContext }) => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          return z.string().refine(
            (val) => val !== 'admin',
            'Username already taken'
          );
        }}
      />
      <SubmitButton />
    </Form>
  ),
};
```

## Performance Considerations

1. **Selective Subscriptions**: Each field only subscribes to its own state slice
2. **Debounced Validation**: Validation on change is debounced to avoid excessive re-renders
3. **Memoization**: Use React.memo for field components when appropriate
4. **Shallow Comparisons**: Use shallow equality checks for state subscriptions

## Error Handling

1. **Validation Errors**: Show after blur or form submission
2. **Submission Errors**: Handle and display form-level errors
3. **Network Errors**: Proper error boundaries and fallbacks
