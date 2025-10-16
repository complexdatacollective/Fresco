# Unified Error Store Usage Guide

## Overview

The form store now uses a unified error store that consolidates both field-level and form-level errors from all sources (validation and submission). This approach provides better consistency and allows for efficient subscriptions to specific field errors.

## Key Changes

### 1. Single Error Store

Instead of separate `formErrors` and field-level `meta.errors`, all errors are now stored in a single `errors: ZodError | null` property.

### 2. Error Extraction Methods

#### Get Form-Level Errors

```typescript
// Returns errors with empty path (form-level errors)
const formErrors = store.getFormErrors();
// Returns: string[] | null
```

#### Get Field-Specific Errors

```typescript
// Returns errors for a specific field based on path matching
const fieldErrors = store.getFieldErrors('username');
// Returns: string[] | null
```

## Usage Examples

### Setting Errors from Validation or Submission

```typescript
import { z } from 'zod';

// From validation
const validationResult = await schema.safeParseAsync(formValues);
if (!validationResult.success) {
  store.setErrors(validationResult.error);
}

// From submission handler
const handleSubmit: FormSubmitHandler = async (values) => {
  try {
    await submitToAPI(values);
    return { success: true };
  } catch (error) {
    // Return ZodError for field and form errors
    const zodError = new z.ZodError([
      {
        path: [], // Form-level error
        message: 'Failed to submit form',
        code: z.ZodIssueCode.custom,
      },
      {
        path: ['email'], // Field-level error
        message: 'Email already exists',
        code: z.ZodIssueCode.custom,
      },
    ]);

    store.setErrors(zodError);
    return { success: false, errors: zodError };
  }
};
```

### Subscribing to Field Errors in Components

```typescript
import { useStore } from 'zustand';

function Field({ name, formStore }) {
  // Subscribe only to this field's errors
  const fieldErrors = useStore(
    formStore,
    (state) => state.getFieldErrors(name)
  );

  return (
    <div>
      <input name={name} />
      {fieldErrors?.map((error, i) => (
        <span key={i} className="error">{error}</span>
      ))}
    </div>
  );
}
```

### Subscribing to Form Errors

```typescript
function FormErrors({ formStore }) {
  const formErrors = useStore(
    formStore,
    (state) => state.getFormErrors()
  );

  if (!formErrors) return null;

  return (
    <div className="form-errors">
      {formErrors.map((error, i) => (
        <div key={i}>{error}</div>
      ))}
    </div>
  );
}
```

## Benefits

1. **Single Source of Truth**: All errors (validation and submission) are in one place
2. **Efficient Subscriptions**: Components can subscribe to specific field errors without re-rendering on unrelated changes
3. **Path-Based Organization**: Leverages Zod's path system for natural error organization
4. **Flexible Error Handling**: Can handle both simple and complex nested field structures
5. **Type Safety**: Maintains full TypeScript support with ZodError type

## Migration Notes

If migrating from the previous dual-error system:

1. Replace `formErrors` property access with `getFormErrors()` method
2. Replace direct field `meta.errors` access with `getFieldErrors(fieldName)` method
3. Update `setFormErrors()` calls to `setErrors()`
4. Ensure submission handlers return ZodError instances for consistent error handling
