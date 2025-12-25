'use client';

/**
 * # Fresco Form System
 *
 * A powerful, type-safe form system built with **Zustand** for state management
 * and **Zod** for validation. Designed for composing complex forms with minimal
 * boilerplate and deep integration with Network Canvas protocols.
 *
 * ## Key Features
 *
 * - **Declarative composition** - Build forms with `<Form>`, `<Field>`, and `<SubmitButton>`
 * - **Built-in validation** - Common validations available as props
 * - **Custom validation** - Full Zod schema support with access to form values and context
 * - **Progressive validation** - Errors appear after blur, then validate in real-time
 * - **Conditional fields** - `<FieldGroup>` shows/hides fields based on other values
 * - **Protocol integration** - `useProtocolForm` auto-generates fields from protocols
 * - **Type safety** - Full TypeScript support with inferred value types
 * - **Zod-compatible submission** - Server errors map directly to field errors
 *
 * ## Architecture Overview
 *
 * ```
 * ┌─────────────────────────────────────────────────────────┐
 * │                        Form                              │
 * │  ┌─────────────────────────────────────────────────────┐ │
 * │  │              FormStoreProvider (Zustand)            │ │
 * │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐               │ │
 * │  │  │  Field  │ │  Field  │ │  Field  │  ...          │ │
 * │  │  │ (Zod)   │ │ (Zod)   │ │ (Zod)   │               │ │
 * │  │  └─────────┘ └─────────┘ └─────────┘               │ │
 * │  │                                                     │ │
 * │  │  ┌──────────────────────────────────────────────┐  │ │
 * │  │  │              SubmitButton                     │  │ │
 * │  │  └──────────────────────────────────────────────┘  │ │
 * │  └─────────────────────────────────────────────────────┘ │
 * └─────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 *              ┌───────────────────────────────┐
 *              │     FormSubmissionResult      │
 *              │  { success: true }            │
 *              │  { success: false,            │
 *              │    fieldErrors: {...} }       │
 *              │  (Zod flattenError compatible)│
 *              └───────────────────────────────┘
 * ```
 *
 * ## Quick Start
 *
 * ```tsx
 * import { Form, Field, SubmitButton } from '~/lib/form';
 * import { InputField } from '~/lib/form/components/fields/InputField';
 *
 * function MyForm() {
 *   return (
 *     <Form onSubmit={async (values) => {
 *       const result = await saveData(values);
 *       if (!result.success) {
 *         // Return Zod-compatible errors
 *         return { success: false, fieldErrors: result.errors };
 *       }
 *       return { success: true };
 *     }}>
 *       <Field name="email" label="Email" component={InputField} required />
 *       <Field name="name" label="Name" component={InputField} />
 *       <SubmitButton>Submit</SubmitButton>
 *     </Form>
 *   );
 * }
 * ```
 *
 * ## Component Hierarchy
 *
 * | Component | Purpose |
 * |-----------|---------|
 * | `Form` | Container that provides form state context |
 * | `Field` | Connects an input component to form state with validation |
 * | `FieldGroup` | Conditionally renders fields based on other values |
 * | `SubmitButton` | Submit button with automatic loading/disabled states |
 * | `UnconnectedField` | Standalone field without form state (for external control) |
 *
 * ## Validation Props Reference
 *
 * All fields accept these validation props:
 *
 * | Prop | Type | Description |
 * |------|------|-------------|
 * | `required` | `boolean` | Field must have a non-empty value |
 * | `minLength` | `number` | Minimum string length |
 * | `maxLength` | `number` | Maximum string length |
 * | `minValue` | `number` | Minimum numeric value |
 * | `maxValue` | `number` | Maximum numeric value |
 * | `minSelected` | `number` | Minimum selections (for arrays) |
 * | `maxSelected` | `number` | Maximum selections (for arrays) |
 * | `pattern` | `{ regex, hint, errorMessage }` | Regex pattern validation |
 * | `sameAs` | `string` | Must equal another field's value |
 * | `differentFrom` | `string` | Must differ from another field |
 * | `greaterThanVariable` | `string` | Must be > another field (numbers/dates) |
 * | `lessThanVariable` | `string` | Must be < another field (numbers/dates) |
 * | `unique` | `string` | Must be unique in network (protocol context) |
 * | `custom` | `CustomFieldValidation` | Custom Zod schema with hint |
 *
 * ## FormSubmissionResult
 *
 * The `onSubmit` handler must return a `FormSubmissionResult`:
 *
 * ```ts
 * type FormSubmissionResult =
 *   | { success: true }
 *   | { success: false } & Partial<FlattenedErrors>;
 *
 * // FlattenedErrors matches Zod's z.flattenError() output:
 * type FlattenedErrors = {
 *   formErrors: string[];
 *   fieldErrors: Record<string, string[]>;
 * };
 * ```
 *
 * This design allows direct integration with Zod validation on the server:
 *
 * ```ts
 * // Server action example
 * const schema = z.object({ email: z.string().email() });
 *
 * async function onSubmit(values) {
 *   const result = schema.safeParse(values);
 *   if (!result.success) {
 *     return { success: false, ...z.flattenError(result.error) };
 *   }
 *   // ...save data
 *   return { success: true };
 * }
 * ```
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { z } from 'zod';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import UnorderedList from '~/components/typography/UnorderedList';
import { Field, FieldGroup, Form, SubmitButton } from './components';
import { CheckboxGroupField } from './components/fields/CheckboxGroup';
import { InputField } from './components/fields/InputField';
import { RadioGroupField } from './components/fields/RadioGroup';
import { SelectField } from './components/fields/Select';
import { TextAreaField } from './components/fields/TextArea';
import { ToggleButtonGroupField } from './components/fields/ToggleButtonGroup';
import { ToggleField } from './components/fields/ToggleField';

const meta: Meta = {
  title: 'Systems/Form',
  parameters: {
    layout: 'padded',
    docs: {
      toc: true,
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The most basic form consists of a `<Form>` wrapper with `<Field>` components
 * inside and a `<SubmitButton>`. Each Field requires:
 *
 * - `name` - Unique identifier for the field in form values
 * - `label` - Display label for the field
 * - `component` - The input component to render (InputField, SelectField, etc.)
 */
export const BasicComposition: Story = {
  name: '1. Basic Composition',
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <Field name="firstName" label="First Name" component={InputField} />
      <Field name="lastName" label="Last Name" component={InputField} />
      <Field
        name="bio"
        label="Bio"
        hint="Tell us about yourself"
        component={TextAreaField}
      />
      <SubmitButton>Save Profile</SubmitButton>
    </Form>
  ),
};

/**
 * ## Built-in Validation Props
 *
 * Add validation to any field using validation props. The form system provides
 * these built-in validations:
 *
 * ### String Validations
 * - `required` - Not null, undefined, or empty string
 * - `minLength` / `maxLength` - String length constraints
 * - `pattern` - Regex pattern with custom hint and error message
 *
 * ### Numeric Validations
 * - `minValue` / `maxValue` - Numeric range constraints
 *
 * ### Array Validations (for multi-select fields)
 * - `minSelected` / `maxSelected` - Selection count constraints
 *
 * ### Cross-Field Validations
 * - `sameAs` - Must equal another field's value
 * - `differentFrom` - Must differ from another field
 * - `greaterThanVariable` - Must be greater than another field
 * - `lessThanVariable` - Must be less than another field
 *
 * ### Protocol-Specific
 * - `unique` - Must be unique among entities in the network (requires context)
 *
 * **Validation Behavior:**
 * 1. No errors shown while user is typing initially
 * 2. After the field loses focus (blur), validation runs
 * 3. Subsequent typing triggers real-time validation
 */
export const BuiltInValidation: Story = {
  name: '2. Built-in Validation Props',
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <Heading level="h4" margin="none">
        String Validations
      </Heading>
      <Field
        name="username"
        label="Username"
        component={InputField}
        required
        minLength={3}
        maxLength={20}
      />
      <Field
        name="zipCode"
        label="ZIP Code"
        component={InputField}
        pattern={{
          regex: '^[0-9]{5}$',
          hint: '5-digit ZIP code (e.g., 12345)',
          errorMessage: 'Please enter a valid 5-digit ZIP code',
        }}
      />

      <Heading level="h4">Numeric Validations</Heading>
      <Field
        name="age"
        label="Age"
        component={InputField}
        minValue={18}
        maxValue={120}
      />

      <Heading level="h4">Array Validations</Heading>
      <Field
        name="skills"
        label="Skills (select 2-4)"
        component={CheckboxGroupField}
        minSelected={2}
        maxSelected={4}
        options={[
          { value: 'js', label: 'JavaScript' },
          { value: 'ts', label: 'TypeScript' },
          { value: 'react', label: 'React' },
          { value: 'node', label: 'Node.js' },
          { value: 'python', label: 'Python' },
        ]}
      />

      <SubmitButton>Submit</SubmitButton>
    </Form>
  ),
};

/**
 * ## Custom Validation with Zod
 *
 * The `custom` prop accepts a Zod schema for complex validation logic.
 * It requires both a `schema` and a `hint` (displayed to users).
 *
 * ### Static Schema
 *
 * ```tsx
 * <Field
 *   name="email"
 *   custom={{
 *     schema: z.string().email('Invalid email'),
 *     hint: 'e.g., user@example.com',
 *   }}
 * />
 * ```
 *
 * ### Dynamic Schema (Function)
 *
 * The schema can be a function that receives:
 * - `formValues` - Current values of all form fields
 * - `validationContext` - Protocol context (if provided)
 *
 * ```tsx
 * <Field
 *   name="confirmEmail"
 *   custom={{
 *     schema: (formValues) =>
 *       z.literal(formValues.email, { message: 'Emails must match' }),
 *     hint: 'Must match email above',
 *   }}
 * />
 * ```
 *
 * ### Multiple Custom Validations
 *
 * Pass an array for multiple validations:
 *
 * ```tsx
 * custom={[
 *   { schema: z.string().min(8), hint: 'At least 8 characters' },
 *   { schema: z.string().regex(/[A-Z]/), hint: 'One uppercase letter' },
 *   { schema: z.string().regex(/[0-9]/), hint: 'One number' },
 * ]}
 * ```
 */
export const CustomValidation: Story = {
  name: '3. Custom Validation (Zod)',
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <Heading level="h4" margin="none">
        Static Zod Schema
      </Heading>
      <Field
        name="email"
        label="Email Address"
        component={InputField}
        custom={{
          schema: z.string().email('Please enter a valid email address'),
          hint: 'e.g., user@example.com',
        }}
      />
      <Field
        name="url"
        label="Website URL"
        component={InputField}
        custom={{
          schema: z.string().url('Please enter a valid URL'),
          hint: 'e.g., https://example.com',
        }}
      />

      <Heading level="h4">Dynamic Schema (Access Form Values)</Heading>
      <Field
        name="accountType"
        label="Account Type"
        component={RadioGroupField}
        options={[
          { value: 'personal', label: 'Personal' },
          { value: 'business', label: 'Business' },
        ]}
      />
      <Field
        name="identifier"
        label="Identifier"
        component={InputField}
        custom={{
          schema: (formValues) => {
            if (formValues.accountType === 'business') {
              return z
                .string()
                .min(1, 'Business ID required')
                .regex(/^BUS-\d{6}$/, 'Format: BUS-123456');
            }
            return z
              .string()
              .min(1, 'Personal ID required')
              .regex(/^[A-Z]{2}\d{4}$/, 'Format: AB1234');
          },
          hint: 'Format depends on account type selected above',
        }}
      />

      <Heading level="h4">Multiple Custom Validations</Heading>
      <Field
        name="password"
        label="Password"
        component={InputField}
        custom={[
          {
            schema: z.string().min(8, 'At least 8 characters'),
            hint: 'At least 8 characters',
          },
          {
            schema: z.string().regex(/[A-Z]/, 'Need an uppercase letter'),
            hint: 'One uppercase letter',
          },
          {
            schema: z.string().regex(/[0-9]/, 'Need a number'),
            hint: 'One number',
          },
        ]}
        showValidationHints
      />

      <SubmitButton>Submit</SubmitButton>
    </Form>
  ),
};

/**
 * ## Validation Context
 *
 * Some validations require **context** to work properly. Context provides
 * access to protocol data needed for network-aware validations.
 *
 * ### ValidationContext Type
 *
 * ```ts
 * type ValidationContext = {
 *   stageSubject: StageSubject;  // { entity: 'node'|'edge'|'ego', type?: string }
 *   codebook: Codebook;          // Variable definitions from protocol
 *   network: NcNetwork;          // Current network state (nodes, edges, ego)
 * };
 * ```
 *
 * ### Context-Dependent Validations
 *
 * These validations require `validationContext` to be provided:
 *
 * - **`unique`** - Checks uniqueness against all entities of the same type
 *   in the current network. Needs network data to compare against.
 *
 * - **`sameAs` / `differentFrom`** - Compare with another field. Needs
 *   codebook to look up the comparison variable's display name.
 *
 * - **`greaterThanVariable` / `lessThanVariable`** - Numeric/date comparison.
 *   Needs codebook for variable type and display name.
 *
 * ### Providing Context
 *
 * When using protocol forms, `useProtocolForm` automatically provides context
 * from Redux. For manual usage:
 *
 * ```tsx
 * <Field
 *   name="nickname"
 *   component={InputField}
 *   unique="nickname"
 *   validationContext={{
 *     stageSubject: { entity: 'node', type: 'person' },
 *     codebook: protocol.codebook,
 *     network: currentNetwork,
 *   }}
 * />
 * ```
 */
export const ValidationContext: Story = {
  name: '4. Validation Context',
  render: () => (
    <div className="prose max-w-none">
      <Heading level="h3">Validation Context</Heading>

      <Paragraph>
        Context-dependent validations need access to protocol and network data.
        The <code>validationContext</code> prop provides this data.
      </Paragraph>

      <Heading level="h4">ValidationContext Type</Heading>
      <pre className="bg-surface-1 rounded p-4 text-sm">
        {`type ValidationContext = {
  stageSubject: StageSubject;  // Who is being edited
  codebook: Codebook;          // Variable definitions
  network: NcNetwork;          // Current network data
};`}
      </pre>

      <Heading level="h4">Context-Dependent Validations</Heading>
      <UnorderedList>
        <li>
          <strong>unique</strong> - Compares against all entities of the same
          type in the network
        </li>
        <li>
          <strong>sameAs / differentFrom</strong> - Looks up comparison variable
          name from codebook
        </li>
        <li>
          <strong>greaterThanVariable / lessThanVariable</strong> - Uses
          codebook for variable type
        </li>
      </UnorderedList>

      <Heading level="h4">Automatic Context with useProtocolForm</Heading>
      <Paragraph>
        When using <code>useProtocolForm</code>, context is automatically
        provided from Redux selectors. You only need to provide context manually
        when building forms outside of protocol workflows.
      </Paragraph>

      <Heading level="h4">How unique Validation Works</Heading>
      <Paragraph>The unique validation:</Paragraph>
      <UnorderedList>
        <li>
          Gets the <code>stageSubject</code> to know which entity type to check
        </li>
        <li>Collects all values of the specified attribute from the network</li>
        <li>
          Validates that the current value doesn&apos;t match any existing
          values
        </li>
      </UnorderedList>
    </div>
  ),
};

/**
 * ## Cross-Field Validation
 *
 * These validations compare the current field against another field in the form.
 *
 * - `sameAs` - Values must be equal (e.g., password confirmation)
 * - `differentFrom` - Values must differ (e.g., new email vs current)
 * - `greaterThanVariable` - Must be greater than another field
 * - `lessThanVariable` - Must be less than another field
 *
 * **Note:** These validations require `validationContext` when used with
 * protocol forms to look up variable display names.
 */
export const CrossFieldValidation: Story = {
  name: '5. Cross-Field Validation',
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <Heading level="h4" margin="none">
        Password Confirmation (sameAs)
      </Heading>
      <Field
        name="password"
        label="Password"
        component={InputField}
        required
        minLength={8}
      />
      <Field
        name="confirmPassword"
        label="Confirm Password"
        component={InputField}
        required
        sameAs="password"
      />

      <Heading level="h4">Different Values (differentFrom)</Heading>
      <Field name="currentEmail" label="Current Email" component={InputField} />
      <Field
        name="newEmail"
        label="New Email"
        hint="Must be different from current"
        component={InputField}
        differentFrom="currentEmail"
      />

      <Heading level="h4">Numeric Range (greaterThan/lessThan)</Heading>
      <Field name="minAge" label="Minimum Age" component={InputField} />
      <Field
        name="maxAge"
        label="Maximum Age"
        hint="Must be greater than minimum"
        component={InputField}
        greaterThanVariable="minAge"
      />

      <SubmitButton>Submit</SubmitButton>
    </Form>
  ),
};

/**
 * ## Form Submission & Server Errors
 *
 * The `onSubmit` handler receives form values and must return a `FormSubmissionResult`:
 *
 * ```ts
 * type FormSubmissionResult =
 *   | { success: true }
 *   | { success: false } & Partial<FlattenedErrors>;
 * ```
 *
 * ### Zod Integration
 *
 * The `FlattenedErrors` type matches Zod's `z.flattenError()` output,
 * allowing seamless integration with server-side Zod validation:
 *
 * ```ts
 * const schema = z.object({
 *   email: z.string().email(),
 *   username: z.string().min(3),
 * });
 *
 * async function onSubmit(values) {
 *   const result = schema.safeParse(values);
 *
 *   if (!result.success) {
 *     // Directly return flattened Zod errors
 *     return { success: false, ...z.flattenError(result.error) };
 *   }
 *
 *   await saveToDatabase(result.data);
 *   return { success: true };
 * }
 * ```
 *
 * ### Field-Specific Errors
 *
 * Return `fieldErrors` with field names as keys and error arrays as values:
 *
 * ```ts
 * return {
 *   success: false,
 *   fieldErrors: {
 *     email: ['This email is already registered'],
 *     username: ['Username contains prohibited words'],
 *   },
 * };
 * ```
 *
 * ### Form-Level Errors
 *
 * Use `formErrors` for errors not tied to a specific field:
 *
 * ```ts
 * return {
 *   success: false,
 *   formErrors: ['Unable to connect to server'],
 * };
 * ```
 */
export const FormSubmission: Story = {
  name: '6. Form Submission & Zod Integration',
  render: () => (
    <Form
      onSubmit={async (data) => {
        action('submitting')(data);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Example: Server-side Zod validation
        const schema = z.object({
          username: z
            .string()
            .min(3)
            .refine((val) => val !== 'admin', 'This username is reserved'),
          email: z
            .string()
            .email()
            .refine(
              (val) => !val.includes('test'),
              'Test emails are not allowed',
            ),
        });

        const result = schema.safeParse(data);

        if (!result.success) {
          const flattened = z.flattenError(result.error);
          action('validation-failed')(flattened);
          return { success: false, ...flattened };
        }

        action('success')(result.data);
        return { success: true };
      }}
    >
      <Paragraph intent="smallText" emphasis="muted">
        This form uses server-side Zod validation. Try &quot;admin&quot; as
        username or include &quot;test&quot; in email to see errors.
      </Paragraph>

      <Field
        name="username"
        label="Username"
        component={InputField}
        required
        minLength={3}
      />
      <Field
        name="email"
        label="Email"
        component={InputField}
        required
        custom={{
          schema: z.string().email(),
          hint: 'Valid email required',
        }}
      />

      <SubmitButton submittingText="Validating...">Register</SubmitButton>
    </Form>
  ),
};

/**
 * ## Available Field Types
 *
 * The form system provides field components for different input needs:
 *
 * | Field Type | Use Case |
 * |------------|----------|
 * | `InputField` | Text, numbers, emails, passwords |
 * | `TextAreaField` | Multi-line text with auto-resize |
 * | `SelectField` | Dropdown selection |
 * | `RadioGroupField` | Single choice from options |
 * | `CheckboxGroupField` | Multiple choices from options |
 * | `ToggleField` | Binary on/off switch |
 * | `ToggleButtonGroupField` | Single choice as button group |
 * | `DatePickerField` | Date selection |
 * | `RelativeDatePickerField` | Relative date from today |
 * | `LikertScaleField` | Ordinal scale rating |
 * | `VisualAnalogScaleField` | Slider with labels |
 * | `BooleanField` | Yes/No/Reset with visual indicators |
 * | `ArrayField` | List of items with add/edit/delete |
 * | `RichTextEditor` | Rich text editing |
 */
export const FieldTypes: Story = {
  name: '7. Available Field Types',
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <Heading level="h4" margin="none">
        Text Input
      </Heading>
      <Field name="text" label="Text Input" component={InputField} />

      <Heading level="h4">Text Area</Heading>
      <Field name="textarea" label="Text Area" component={TextAreaField} />

      <Heading level="h4">Select Dropdown</Heading>
      <Field
        name="select"
        label="Select"
        component={SelectField}
        options={[
          { value: '', label: 'Choose an option...' },
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
          { value: 'option3', label: 'Option 3' },
        ]}
      />

      <Heading level="h4">Radio Group</Heading>
      <Field
        name="radio"
        label="Radio Group"
        component={RadioGroupField}
        options={[
          { value: 'a', label: 'Choice A' },
          { value: 'b', label: 'Choice B' },
          { value: 'c', label: 'Choice C' },
        ]}
      />

      <Heading level="h4">Checkbox Group</Heading>
      <Field
        name="checkbox"
        label="Checkbox Group"
        component={CheckboxGroupField}
        options={[
          { value: 'red', label: 'Red' },
          { value: 'green', label: 'Green' },
          { value: 'blue', label: 'Blue' },
        ]}
      />

      <Heading level="h4">Toggle</Heading>
      <Field
        name="toggle"
        label="Enable notifications"
        component={ToggleField}
      />

      <Heading level="h4">Toggle Button Group</Heading>
      <Field
        name="buttonGroup"
        label="Size"
        component={ToggleButtonGroupField}
        options={[
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium' },
          { value: 'lg', label: 'Large' },
        ]}
      />

      <SubmitButton>Submit All</SubmitButton>
    </Form>
  ),
};

/**
 * ## Conditional Fields (FieldGroup)
 *
 * Use `<FieldGroup>` to conditionally show fields based on other field values.
 *
 * **Props:**
 * - `watch` - Array of field names to monitor
 * - `condition` - Function that receives watched values and returns boolean
 *
 * **Key Behaviors:**
 * - Fields inside a hidden FieldGroup are **unregistered** from the form
 * - Unregistered fields don't appear in submitted values
 * - Unregistered fields don't trigger validation
 * - Smooth animations when fields appear/disappear
 */
export const ConditionalFields: Story = {
  name: '8. Conditional Fields (FieldGroup)',
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <Paragraph intent="smallText" emphasis="muted">
        Select a contact method to see relevant fields appear.
      </Paragraph>

      <Field
        name="contactMethod"
        label="How should we contact you?"
        component={RadioGroupField}
        options={[
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone' },
          { value: 'mail', label: 'Postal Mail' },
        ]}
      />

      <FieldGroup
        watch={['contactMethod'] as const}
        condition={(v) => v.contactMethod === 'email'}
      >
        <Field
          name="emailAddress"
          label="Email Address"
          component={InputField}
          required
          custom={{
            schema: z.string().email(),
            hint: 'We will send updates to this address',
          }}
        />
      </FieldGroup>

      <FieldGroup
        watch={['contactMethod'] as const}
        condition={(v) => v.contactMethod === 'phone'}
      >
        <Field
          name="phoneNumber"
          label="Phone Number"
          component={InputField}
          required
          pattern={{
            regex: '^[0-9]{10}$',
            hint: '10-digit number without dashes',
            errorMessage: 'Enter a 10-digit phone number',
          }}
        />
        <Field
          name="canText"
          label="Can we send text messages?"
          component={ToggleField}
        />
      </FieldGroup>

      <FieldGroup
        watch={['contactMethod'] as const}
        condition={(v) => v.contactMethod === 'mail'}
      >
        <Field
          name="address"
          label="Street Address"
          component={InputField}
          required
        />
        <Field name="city" label="City" component={InputField} required />
        <Field name="state" label="State" component={InputField} required />
        <Field
          name="zip"
          label="ZIP Code"
          component={InputField}
          required
          pattern={{
            regex: '^[0-9]{5}$',
            hint: '5-digit ZIP code',
            errorMessage: 'Enter a valid ZIP code',
          }}
        />
      </FieldGroup>

      <SubmitButton>Save Preferences</SubmitButton>
    </Form>
  ),
};

/**
 * ## Nested Field Names
 *
 * Use dot notation in field names to create nested data structures.
 * The form automatically structures the submitted values:
 *
 * ```tsx
 * <Field name="user.profile.name" ... />
 * <Field name="user.profile.email" ... />
 *
 * // Submitted values:
 * {
 *   user: {
 *     profile: { name: "...", email: "..." }
 *   }
 * }
 * ```
 */
export const NestedFieldNames: Story = {
  name: '9. Nested Field Names',
  render: () => (
    <Form
      onSubmit={(data) => {
        action('form-submitted')(data);
        return Promise.resolve({ success: true });
      }}
    >
      <Heading level="h4" margin="none">
        Personal Information
      </Heading>
      <Field
        name="user.personal.firstName"
        label="First Name"
        component={InputField}
      />
      <Field
        name="user.personal.lastName"
        label="Last Name"
        component={InputField}
      />

      <Heading level="h4">Contact Information</Heading>
      <Field
        name="user.contact.email"
        label="Email"
        component={InputField}
        custom={{ schema: z.string().email(), hint: '' }}
      />
      <Field name="user.contact.phone" label="Phone" component={InputField} />

      <Heading level="h4">Preferences</Heading>
      <Field
        name="settings.notifications.email"
        label="Email Notifications"
        component={ToggleField}
      />
      <Field
        name="settings.notifications.sms"
        label="SMS Notifications"
        component={ToggleField}
      />

      <SubmitButton>Save</SubmitButton>
    </Form>
  ),
};

/**
 * ## Complete Example
 *
 * A realistic registration form demonstrating multiple form system features:
 *
 * - Required and optional fields
 * - Various validation types
 * - Conditional fields with FieldGroup
 * - Multiple field types
 * - Proper form submission handling
 */
export const CompleteExample: Story = {
  name: '10. Complete Example',
  render: () => (
    <Form
      onSubmit={async (data) => {
        action('form-submitted')(data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { success: true };
      }}
    >
      <Heading level="h3" margin="none">
        Create Your Account
      </Heading>
      <Paragraph emphasis="muted" margin="none">
        Fill in your details to get started.
      </Paragraph>

      <Field
        name="email"
        label="Email Address"
        component={InputField}
        required
        custom={{
          schema: z.string().email('Please enter a valid email'),
          hint: 'We will send a verification email',
        }}
      />

      <Field
        name="password"
        label="Password"
        component={InputField}
        required
        minLength={8}
        maxLength={50}
      />

      <Field
        name="confirmPassword"
        label="Confirm Password"
        component={InputField}
        required
        sameAs="password"
      />

      <Field
        name="accountType"
        label="Account Type"
        component={RadioGroupField}
        required
        options={[
          { value: 'personal', label: 'Personal' },
          { value: 'business', label: 'Business' },
        ]}
      />

      <FieldGroup
        watch={['accountType'] as const}
        condition={(v) => v.accountType === 'business'}
      >
        <Field
          name="companyName"
          label="Company Name"
          component={InputField}
          required
        />
        <Field
          name="companySize"
          label="Company Size"
          component={SelectField}
          required
          options={[
            { value: '', label: 'Select size...' },
            { value: '1-10', label: '1-10 employees' },
            { value: '11-50', label: '11-50 employees' },
            { value: '51-200', label: '51-200 employees' },
            { value: '200+', label: '200+ employees' },
          ]}
        />
      </FieldGroup>

      <Field
        name="interests"
        label="What are you interested in?"
        component={CheckboxGroupField}
        options={[
          { value: 'research', label: 'Research tools' },
          { value: 'visualization', label: 'Data visualization' },
          { value: 'export', label: 'Export capabilities' },
          { value: 'collaboration', label: 'Team collaboration' },
        ]}
        minSelected={1}
      />

      <Field
        name="newsletter"
        label="Subscribe to newsletter"
        component={ToggleField}
      />

      <SubmitButton submittingText="Creating account...">
        Create Account
      </SubmitButton>
    </Form>
  ),
};

/**
 * ## Implementing Custom Validation Functions
 *
 * To add a new validation type to the form system, you need to:
 *
 * 1. **Create a validation function** in `~/lib/form/validation/index.ts`
 * 2. **Export it from the validations object**
 * 3. **Add the prop type** to `ValidationProps` in `Field.tsx`
 *
 * ### Validation Function Signature
 *
 * ```ts
 * type ValidationFunction<T extends ValidationParameter> = (
 *   parameter: T,          // The prop value (e.g., minLength={5} → 5)
 *   context?: ValidationContext,
 * ) => (formValues: Record<string, FieldValue>) => z.ZodType;
 * ```
 *
 * ### Example: Custom "email" Validation
 *
 * ```ts
 * const email = () => () => {
 *   const hint = 'Must be a valid email address.';
 *
 *   return z
 *     .email({ message: 'Enter a valid email address.' })
 *     .prefault('')  // Default value for hint extraction
 *     .meta({ hint });  // Attach hint metadata
 * };
 * ```
 *
 * ### Key Patterns
 *
 * - Use `.meta({ hint })` to attach user-visible hints
 * - Use `.prefault()` to provide a default for hint extraction
 * - Access `formValues` when comparing against other fields
 * - Access `context` for network/codebook data
 */
export const ImplementingValidation: Story = {
  name: '11. Implementing Custom Validations',
  render: () => (
    <div className="prose max-w-none">
      <Heading level="h3">Implementing Custom Validation Functions</Heading>

      <Paragraph>
        The form system&apos;s validation is extensible. Each validation is a
        curried function that returns a Zod schema.
      </Paragraph>

      <Heading level="h4">Validation Function Signature</Heading>
      <pre className="bg-surface-1 rounded p-4 text-sm">
        {`type ValidationFunction<T> = (
  parameter: T,              // Prop value
  context?: ValidationContext,
) => (formValues: Record<string, FieldValue>) => z.ZodType;`}
      </pre>

      <Heading level="h4">Simple Validation (No Context)</Heading>
      <pre className="bg-surface-1 rounded p-4 text-sm">
        {`const minLength: ValidationFunction<number> = (min) => () => {
  const hint = \`Enter at least \${min} characters.\`;

  return z
    .string()
    .min(min, { message: \`Too short. Enter at least \${min} characters.\` })
    .prefault('')
    .meta({ hint });
};`}
      </pre>

      <Heading level="h4">Cross-Field Validation</Heading>
      <pre className="bg-surface-1 rounded p-4 text-sm">
        {`const sameAs: ValidationFunction<string> =
  (attribute, context) => (formValues) => {
    // Access comparison variable name from codebook
    const comparisonVariable = getVariableDefinition(
      context.codebook,
      context.stageSubject,
      attribute,
    );

    return z.unknown().superRefine((value, ctx) => {
      if (!isMatchingValue(value, formValues[attribute])) {
        ctx.addIssue({
          code: 'custom',
          message: \`Must match '\${comparisonVariable.name}'.\`,
        });
      }
    }).meta({ hint: \`Must match '\${comparisonVariable.name}'.\` });
  };`}
      </pre>

      <Heading level="h4">Key Patterns</Heading>
      <UnorderedList>
        <li>
          <code>.meta({'{ hint }'})</code> - Attach user-visible validation
          hints
        </li>
        <li>
          <code>.prefault()</code> - Provide default for hint extraction
        </li>
        <li>
          <code>formValues</code> - Access other field values for cross-field
          validation
        </li>
        <li>
          <code>context</code> - Access network/codebook for protocol
          validations
        </li>
        <li>
          <code>superRefine</code> - Add custom validation logic with multiple
          issues
        </li>
      </UnorderedList>
    </div>
  ),
};

/**
 * ## Best Practices
 */
export const BestPractices: Story = {
  name: '12. Best Practices',
  render: () => (
    <div className="prose max-w-none">
      <Heading level="h3">Form System Best Practices</Heading>

      <Heading level="h4">Structure</Heading>
      <UnorderedList>
        <li>Keep forms focused - split complex forms into steps or sections</li>
        <li>Group related fields visually using headings or cards</li>
        <li>Place the most important/required fields first</li>
        <li>Use consistent field ordering across your application</li>
      </UnorderedList>

      <Heading level="h4">Validation</Heading>
      <UnorderedList>
        <li>Prefer built-in validations over custom when possible</li>
        <li>Always provide helpful hints for pattern-based validation</li>
        <li>
          Use <code>custom</code> with Zod for complex multi-condition
          validation
        </li>
        <li>
          Provide <code>validationContext</code> for protocol-aware validations
        </li>
        <li>Consider user experience - don&apos;t over-validate</li>
      </UnorderedList>

      <Heading level="h4">Server Integration</Heading>
      <UnorderedList>
        <li>
          Use <code>z.flattenError()</code> for seamless Zod integration
        </li>
        <li>Return field-specific errors to show on the correct fields</li>
        <li>
          Use <code>formErrors</code> for errors not tied to a field
        </li>
        <li>
          Always validate on the server - client validation is for UX only
        </li>
      </UnorderedList>

      <Heading level="h4">Accessibility</Heading>
      <UnorderedList>
        <li>Labels are automatically associated with inputs</li>
        <li>Error messages are announced to screen readers</li>
        <li>
          Required fields are marked with <code>aria-required</code>
        </li>
        <li>
          Invalid fields have <code>aria-invalid</code> set
        </li>
      </UnorderedList>

      <Heading level="h4">Performance</Heading>
      <UnorderedList>
        <li>Fields only re-render when their specific state changes</li>
        <li>Validation is debounced after initial blur</li>
        <li>
          Hidden FieldGroup fields are unregistered to avoid unnecessary
          validation
        </li>
      </UnorderedList>
    </div>
  ),
};
