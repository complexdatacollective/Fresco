'use client';

import {
  FilterSchema,
  nameGeneratorPromptSchema,
  ValidationsSchema,
  type FilterRule,
} from '@codaco/protocol-validation';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { z } from 'zod';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Field, Form, SubmitButton } from '../components';
import { ArrayField } from '../components/fields/ArrayField/ArrayField';
import {
  FilterRuleEditor,
  FilterRuleItem,
  MOCK_VARIABLES,
  NameGeneratorPromptEditor,
  NameGeneratorPromptItem,
  ValidationConfigEditor,
  ValidationConfigItem,
  type ValidationConfig,
} from '../components/fields/ArrayField/ProtocolItemRenderers';
import { BooleanField } from '../components/fields/Boolean';
import { InputField } from '../components/fields/InputField';
import { RadioGroupField } from '../components/fields/RadioGroup';
import { NativeSelectField as SelectField } from '../components/fields/Select';
import { type NameGeneratorPrompt } from './fields/ArrayField/ItemRenderers';

const meta: Meta<typeof Form> = {
  title: 'Systems/Form/Protocol Schemas',
  component: Form,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const nameGeneratorPromptsSchema = z.array(nameGeneratorPromptSchema);

const samplePrompts: NameGeneratorPrompt[] = [
  {
    id: 'prompt-1',
    text: 'Think of people you see regularly in your daily life.',
    additionalAttributes: [{ variable: 'closeness', value: true }],
  },
];

export const NameGeneratorPrompts: Story = {
  render: () => (
    <Surface>
      <Heading level="h2">Name Generator Prompts</Heading>
      <Form
        onSubmit={async (data) => {
          await new Promise((resolve) => setTimeout(resolve, 500));

          const formData = data as { prompts: unknown[] };
          const result = nameGeneratorPromptsSchema.safeParse(formData.prompts);

          if (!result.success) {
            // Log schema validation errors to console for debugging
            // eslint-disable-next-line no-console
            console.error(
              'Schema validation failed:',
              z.prettifyError(result.error),
            );
            const errors = z.flattenError(result.error);

            action('nameGeneratorPrompts-validation-error')(errors);
            return {
              success: false,
              ...errors,
            };
          }

          action('nameGeneratorPrompts-submitted')(result.data);
          return { success: true };
        }}
      >
        <Field
          name="prompts"
          label="Prompts"
          hint="Create prompts for the Name Generator stage. Each prompt instructs participants about the task, and can include additional attributes that are automatically set on created nodes."
          component={ArrayField<NameGeneratorPrompt>}
          sortable
          addButtonLabel="Add Prompt"
          emptyStateMessage="No prompts added yet. Click 'Add Prompt' to get started."
          initialValue={samplePrompts}
          getId={(item) => item.id}
          itemTemplate={() => ({
            id: crypto.randomUUID(),
          })}
          itemComponent={NameGeneratorPromptItem}
          editorComponent={NameGeneratorPromptEditor}
          required
        />

        <SubmitButton className="mt-6">Save Prompts</SubmitButton>
      </Form>
    </Surface>
  ),
};

// ============================================================================
// FilterSchema
// Uses FilterSchema and filterRuleSchema from @codaco/protocol-validation
// ============================================================================

export const Filter: Story = {
  render: () => (
    <Form
      onSubmit={async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const result = FilterSchema.safeParse(data);
        if (!result.success) {
          // eslint-disable-next-line no-console
          console.error('Schema validation failed:', result.error.format());
          action('filter-validation-error')(result.error.format());
          return {
            success: false,
            formErrors: [
              'Schema validation failed. Check console for details.',
            ],
          };
        }

        action('filter-submitted')(result.data);
        return { success: true };
      }}
    >
      <Surface level={1} spacing="lg">
        <div className="mb-6">
          <Heading level="h2">Network Filter</Heading>
          <Paragraph intent="smallText">
            Create a filter to match specific network entities. Filters can be
            used for skip logic, panel filtering, and other conditional
            behaviors.
          </Paragraph>
        </div>

        <Field
          name="join"
          label="Rule Combination"
          hint="How should multiple rules be combined?"
          component={RadioGroupField}
          options={[
            { value: 'AND', label: 'AND - All rules must match' },
            { value: 'OR', label: 'OR - Any rule can match' },
          ]}
          initialValue="AND"
          orientation="horizontal"
        />

        <Field
          name="rules"
          label="Filter Rules"
          hint="Define one or more rules to match network entities."
          component={ArrayField<FilterRule>}
          sortable
          addButtonLabel="Add Rule"
          emptyStateMessage="No filter rules defined. Add at least one rule."
          itemTemplate={() => ({
            id: crypto.randomUUID(),
            type: 'node' as const,
            options: {
              operator: 'EXISTS' as const,
            },
          })}
          itemComponent={FilterRuleItem}
          editorComponent={FilterRuleEditor}
          required
        />

        <SubmitButton className="mt-6">Save Filter</SubmitButton>
      </Surface>
    </Form>
  ),
};

// ============================================================================
// ValidationsSchema
// Uses ValidationsSchema from @codaco/protocol-validation
// ============================================================================

export const Validations: Story = {
  render: () => (
    <Form
      onSubmit={async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const result = ValidationsSchema.safeParse(data);
        if (!result.success) {
          // eslint-disable-next-line no-console
          console.error('Schema validation failed:', result.error.format());
          action('validations-validation-error')(result.error.format());
          return {
            success: false,
            formErrors: [
              'Schema validation failed. Check console for details.',
            ],
          };
        }

        action('validations-submitted')(result.data);
        return { success: true };
      }}
    >
      <Surface level={1} spacing="lg">
        <div className="mb-6">
          <Heading level="h2">Field Validation Configuration</Heading>
          <Paragraph intent="smallText">
            Configure validation rules for a form field. All validations are
            optional - only enable the ones you need.
          </Paragraph>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-current/70 uppercase">
              Required & Unique
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field
                name="required"
                label="Required"
                hint="Field must have a value"
                component={BooleanField}
                noReset
              />
              <Field
                name="unique"
                label="Unique"
                hint="Value must be unique in network"
                component={BooleanField}
                noReset
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-current/70 uppercase">
              Length Constraints
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field
                name="minLength"
                label="Minimum Length"
                hint="Minimum string length"
                component={InputField}
                type="number"
                placeholder="e.g., 1"
              />
              <Field
                name="maxLength"
                label="Maximum Length"
                hint="Maximum string length"
                component={InputField}
                type="number"
                placeholder="e.g., 255"
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-current/70 uppercase">
              Value Constraints
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field
                name="minValue"
                label="Minimum Value"
                hint="Minimum numeric value"
                component={InputField}
                type="number"
                placeholder="e.g., 0"
              />
              <Field
                name="maxValue"
                label="Maximum Value"
                hint="Maximum numeric value"
                component={InputField}
                type="number"
                placeholder="e.g., 100"
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-current/70 uppercase">
              Selection Constraints
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field
                name="minSelected"
                label="Minimum Selected"
                hint="Min items for array fields"
                component={InputField}
                type="number"
                placeholder="e.g., 1"
              />
              <Field
                name="maxSelected"
                label="Maximum Selected"
                hint="Max items for array fields"
                component={InputField}
                type="number"
                placeholder="e.g., 5"
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-current/70 uppercase">
              Variable Comparisons
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field
                name="sameAs"
                label="Same As"
                hint="Must equal this variable"
                component={SelectField}
                options={[{ value: '', label: '(None)' }, ...MOCK_VARIABLES]}
              />
              <Field
                name="differentFrom"
                label="Different From"
                hint="Must differ from this variable"
                component={SelectField}
                options={[{ value: '', label: '(None)' }, ...MOCK_VARIABLES]}
              />
              <Field
                name="greaterThanVariable"
                label="Greater Than Variable"
                hint="Must be greater than this variable"
                component={SelectField}
                options={[{ value: '', label: '(None)' }, ...MOCK_VARIABLES]}
              />
              <Field
                name="lessThanVariable"
                label="Less Than Variable"
                hint="Must be less than this variable"
                component={SelectField}
                options={[{ value: '', label: '(None)' }, ...MOCK_VARIABLES]}
              />
            </div>
          </div>
        </div>

        <SubmitButton className="mt-6">Save Validation Config</SubmitButton>
      </Surface>
    </Form>
  ),
};

// ============================================================================
// Combined Example: Full Variable Definition with Validation
// Shows a more realistic use case combining multiple schemas
// ============================================================================

const variableDefinitionSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z][a-zA-Z0-9]*$/),
  type: z.enum([
    'text',
    'number',
    'boolean',
    'ordinal',
    'categorical',
    'scalar',
    'datetime',
    'layout',
  ]),
  prompt: z.string().optional(),
  validation: z.array(ValidationsSchema).optional(),
});

export const VariableDefinitionWithValidation: Story = {
  render: () => (
    <Form
      onSubmit={async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const result = variableDefinitionSchema.safeParse(data);
        if (!result.success) {
          // eslint-disable-next-line no-console
          console.error('Schema validation failed:', result.error.format());
          action('variable-definition-validation-error')(result.error.format());
          return {
            success: false,
            formErrors: [
              'Schema validation failed. Check console for details.',
            ],
          };
        }

        action('variable-definition-submitted')(result.data);
        return { success: true };
      }}
    >
      <Surface level={1} spacing="lg">
        <div className="mb-6">
          <Heading level="h2">Variable Definition</Heading>
          <Paragraph intent="smallText">
            Define a protocol variable with its validation rules. This
            demonstrates how the ValidationsSchema integrates with variable
            definitions.
          </Paragraph>
        </div>

        <Field
          name="name"
          label="Variable Name"
          hint="A unique identifier for this variable (camelCase recommended)"
          component={InputField}
          required
          validation={z
            .string()
            .min(1, 'Name is required')
            .regex(
              /^[a-z][a-zA-Z0-9]*$/,
              'Must start with lowercase letter and contain only alphanumeric characters',
            )}
          placeholder="e.g., firstName, age, isMarried"
        />

        <Field
          name="type"
          label="Variable Type"
          hint="The data type this variable will store"
          component={SelectField}
          options={[
            { value: 'text', label: 'Text' },
            { value: 'number', label: 'Number' },
            { value: 'boolean', label: 'Boolean (Yes/No)' },
            { value: 'ordinal', label: 'Ordinal (Likert scale)' },
            { value: 'categorical', label: 'Categorical (Multiple choice)' },
            { value: 'scalar', label: 'Scalar (Visual analog scale)' },
            { value: 'datetime', label: 'Date/Time' },
            { value: 'layout', label: 'Layout (Coordinates)' },
          ]}
          required
          placeholder="Select a type..."
        />

        <Field
          name="prompt"
          label="Question Prompt"
          hint="The question or instruction shown to participants"
          component={InputField}
          placeholder="e.g., What is your first name?"
        />

        <Field
          name="validation"
          label="Validation Rules"
          hint="Configure validation rules for this variable. Click 'Add Validation' to define constraints."
          component={ArrayField<ValidationConfig>}
          addButtonLabel="Add Validation"
          emptyStateMessage="No validation rules. Click 'Add Validation' to add constraints."
          itemTemplate={() => ({
            id: crypto.randomUUID(),
          })}
          itemComponent={ValidationConfigItem}
          editorComponent={ValidationConfigEditor}
        />

        <SubmitButton className="mt-6">Save Variable</SubmitButton>
      </Surface>
    </Form>
  ),
};
