'use client';

import {
  FilterSchema,
  ValidationsSchema,
  type AdditionalAttributes,
  type FilterRule,
} from '@codaco/protocol-validation';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { type JSONContent } from '@tiptap/core';
import { GripVertical, PencilIcon, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { action } from 'storybook/actions';
import { z } from 'zod';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import Button, { IconButton, MotionButton } from '~/components/ui/Button';
import { Dialog } from '~/lib/dialogs/Dialog';
import { cx } from '~/utils/cva';
import { RichTextRenderer } from '../../../components/RichTextRenderer';
import {
  Field,
  Form,
  FormStoreProvider,
  FormWithoutProvider,
  SubmitButton,
  UnconnectedField,
} from '../components';
import {
  ArrayField,
  type ArrayFieldEditorProps,
  type ArrayFieldItemProps,
} from '../components/fields/ArrayField/ArrayField';
import { BooleanField } from '../components/fields/Boolean';
import { InputField } from '../components/fields/InputField';
import { RadioGroupField } from '../components/fields/RadioGroup';
import { NativeSelectField as SelectField } from '../components/fields/Select';
import { RichTextEditorField } from './fields/RichTextEditor';

// ============================================================================
// Mock Variables (for demonstration - in real usage, these come from protocol)
// ============================================================================

const MOCK_VARIABLES = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'age', label: 'Age' },
  { value: 'gender', label: 'Gender' },
  { value: 'isClose', label: 'Is Close' },
  { value: 'closeness', label: 'Closeness' },
  { value: 'contactFrequency', label: 'Contact Frequency' },
  { value: 'relationshipType', label: 'Relationship Type' },
  { value: 'livesNearby', label: 'Lives Nearby' },
  { value: 'yearsKnown', label: 'Years Known' },
] as const;

// Simplified version of Name Generator prompt schema
type NameGeneratorPrompt = {
  id: string;
  text: JSONContent;
  additionalAttributes?: AdditionalAttributes;
};

function NameGeneratorPromptItem({
  item,
  isSortable,
  onEdit,
  onDelete,
  dragControls,
}: ArrayFieldItemProps<NameGeneratorPrompt>) {
  // Hide item when when it's a new draft
  if (item._draft) {
    return null;
  }

  return (
    <motion.div
      layoutId={item._internalId}
      className={cx('flex w-full items-center gap-2')}
    >
      {isSortable && (
        <motion.div
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none"
        >
          <GripVertical className="w-8 cursor-grab" />
        </motion.div>
      )}
      <motion.div className="flex-1">
        <RichTextRenderer content={item.text} />
        {item.additionalAttributes && item.additionalAttributes.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.additionalAttributes.map((attr, index) => (
              <span
                key={`${attr.variable}-${index}`}
                className={cx(
                  'rounded px-1.5 py-0.5 text-xs',
                  attr.value
                    ? 'bg-success/20 text-success'
                    : 'bg-destructive/20 text-destructive',
                )}
              >
                {attr.variable}={String(attr.value)}
              </span>
            ))}
          </div>
        )}
      </motion.div>
      <motion.div
        className="ml-auto flex items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <IconButton
          size="sm"
          variant="text"
          className="text-current"
          color="default"
          onClick={onEdit}
          aria-label="Edit prompt"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="text"
          className="text-current"
          color="destructive"
          size="sm"
          onClick={onDelete}
          icon={<X />}
          aria-label="Remove prompt"
        />
      </motion.div>
    </motion.div>
  );
}

function NameGeneratorPromptEditor({
  isNewItem,
  onCancel,
  onSave,
  item,
}: ArrayFieldEditorProps<NameGeneratorPrompt>) {
  const handleSubmit = (data: NameGeneratorPrompt) => {
    onSave({
      id: item?.id ?? crypto.randomUUID(),
      text: data.text,
      additionalAttributes: data.additionalAttributes,
    });

    return { success: true as const };
  };

  const formId = `prompt-form-${item?._internalId ?? 'new'}`;

  return (
    <FormStoreProvider>
      <Dialog
        title={isNewItem ? 'Add Prompt' : 'Edit Prompt'}
        description="Configure the prompt text and any additional attributes to set on created nodes"
        open={!!item}
        closeDialog={onCancel}
        layoutId={isNewItem ? undefined : item?._internalId}
        footer={
          <>
            <MotionButton type="button" onClick={onCancel}>
              Cancel
            </MotionButton>
            <SubmitButton form={formId}>
              {isNewItem ? 'Add Prompt' : 'Save Changes'}
            </SubmitButton>
          </>
        }
      >
        <FormWithoutProvider
          onSubmit={handleSubmit}
          className="w-full max-w-full"
          id={formId}
        >
          <Field
            name="text"
            label="Prompt Text"
            hint="The instruction text shown to participants"
            component={RichTextEditorField}
            initialValue={item?.text}
            required
            autoFocus
          />
          <Field
            name="additionalAttributes"
            label="Additional Attributes"
            hint="Automatically set these attribute values on nodes created from this prompt"
            component={ArrayField<AdditionalAttribute>}
            addButtonLabel="Add Attribute"
            emptyStateMessage="No additional attributes configured"
            itemTemplate={() => ({ variable: undefined, value: undefined })}
            itemComponent={AdditionalAttributeItem}
            confirmDelete={false}
            initialValue={item?.additionalAttributes}
          />
        </FormWithoutProvider>
      </Dialog>
    </FormStoreProvider>
  );
}

// ============================================================================
// Additional Attributes (from nameGeneratorPromptSchema)
// Note: AdditionalAttribute does NOT have an 'id' property per the schema.
// ArrayField uses internal IDs via WeakMap for tracking.
// ============================================================================

type AdditionalAttribute = AdditionalAttributes[number];

function AdditionalAttributeItem({
  item,
  isSortable,
  isBeingEdited,
  isNewItem,
  onChange,
  onCancel,
  onEdit,
  onDelete,
  dragControls,
}: ArrayFieldItemProps<AdditionalAttribute>) {
  // Local state for inline editing
  const [variable, setVariable] = useState(item?.variable);
  const [value, setValue] = useState<boolean | null>(item.value ?? null);

  const handleSave = () => {
    if (variable && value !== null && onChange) {
      onChange({
        variable,
        value,
      });
    }
  };

  return (
    <motion.div
      layout
      className={cx('flex w-full flex-col')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {isBeingEdited ? (
          <motion.div layout key="edit" className="flex w-full flex-col gap-2">
            <UnconnectedField
              component={SelectField}
              label="Variable"
              hint="Select the variable to set"
              name={`additional-attribute-variable-${item._internalId}`}
              value={variable}
              placeholder="Select a variable..."
              onChange={(val) => setVariable(String(val))}
              options={[...MOCK_VARIABLES]}
              required
            />
            <UnconnectedField
              component={BooleanField}
              label="Value"
              hint="The boolean value to assign"
              value={value}
              onChange={setValue}
              noReset
              required
            />
            <div className="flex gap-2">
              <Button
                color="primary"
                size="sm"
                icon={<PencilIcon />}
                onClick={handleSave}
                disabled={!variable || value === null}
              >
                {isNewItem ? 'Add' : 'Save'}
              </Button>
              <Button
                type="button"
                onClick={onCancel}
                aria-label="Cancel editing"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            layout
            key="view"
            className="flex w-full items-center gap-2 px-2 py-2"
          >
            {isSortable && (
              <motion.div
                onPointerDown={(e) => dragControls.start(e)}
                className="touch-none"
              >
                <GripVertical className="h-4 w-4 cursor-grab" />
              </motion.div>
            )}
            <motion.div className="flex flex-1 items-center gap-3">
              <code className="bg-input-contrast/10 rounded px-2 py-0.5 text-sm">
                {item.variable}
              </code>
              <span className="text-sm text-current/70">=</span>
              <span
                className={cx(
                  'rounded px-2 py-0.5 text-sm font-medium',
                  item.value
                    ? 'bg-success/20 text-success'
                    : 'bg-destructive/20 text-destructive',
                )}
              >
                {item.value ? 'true' : 'false'}
              </span>
            </motion.div>
            <motion.div className="ml-auto flex items-center gap-1">
              <IconButton
                size="sm"
                variant="text"
                className="text-current"
                color="primary"
                onClick={onEdit}
                aria-label="Edit attribute"
                icon={<PencilIcon />}
              />
              <IconButton
                variant="text"
                className="text-current"
                color="destructive"
                size="sm"
                onClick={onDelete}
                icon={<X />}
                aria-label="Remove attribute"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Filter Rules (from FilterSchema)
// ============================================================================

const FILTER_OPERATORS = [
  { value: 'EXISTS', label: 'Exists' },
  { value: 'NOT_EXISTS', label: 'Does not exist' },
  { value: 'EXACTLY', label: 'Equals' },
  { value: 'NOT', label: 'Not equals' },
  { value: 'GREATER_THAN', label: 'Greater than' },
  { value: 'GREATER_THAN_OR_EQUAL', label: 'Greater than or equal' },
  { value: 'LESS_THAN', label: 'Less than' },
  { value: 'LESS_THAN_OR_EQUAL', label: 'Less than or equal' },
  { value: 'INCLUDES', label: 'Includes' },
  { value: 'EXCLUDES', label: 'Excludes' },
  { value: 'OPTIONS_GREATER_THAN', label: 'Options greater than' },
  { value: 'OPTIONS_LESS_THAN', label: 'Options less than' },
  { value: 'OPTIONS_EQUALS', label: 'Options equals' },
  { value: 'OPTIONS_NOT_EQUALS', label: 'Options not equals' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'DOES_NOT_CONTAIN', label: 'Does not contain' },
] as const;

const ENTITY_TYPES = [
  { value: 'ego', label: 'Ego' },
  { value: 'edge', label: 'Edge' },
  { value: 'node', label: 'Node' },
] as const;

type FilterOperator = (typeof FILTER_OPERATORS)[number]['value'];
type EntityType = (typeof ENTITY_TYPES)[number]['value'];

function getOperatorLabel(operator: FilterOperator): string {
  return (
    FILTER_OPERATORS.find((op) => op.value === operator)?.label ?? operator
  );
}

function FilterRuleItem({
  item,
  isSortable,
  isBeingEdited,
  onEdit,
  onDelete,
  dragControls,
}: ArrayFieldItemProps<FilterRule>) {
  // Hide item when being edited (layoutId transfers to editor) or when it's a new draft
  if (isBeingEdited || item._draft) {
    return null;
  }

  const needsValue = !['EXISTS', 'NOT_EXISTS'].includes(item.options.operator);

  return (
    <motion.div
      layoutId={item._internalId}
      className="border-b-input-contrast/10 flex w-full items-center gap-2 border-b px-2 py-2 last:border-b-0"
    >
      {isSortable && (
        <motion.div
          layout
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none"
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </motion.div>
      )}
      <motion.div layout className="flex flex-1 flex-wrap items-center gap-2">
        <span
          className={cx(
            'rounded px-2 py-0.5 text-xs font-medium uppercase',
            item.type === 'ego' && 'bg-accent/20 text-accent',
            item.type === 'node' && 'bg-info/20 text-info',
            item.type === 'edge' && 'bg-warning/20 text-warning',
          )}
        >
          {item.type}
        </span>
        {item.options.attribute && (
          <code className="bg-input-contrast/10 rounded px-2 py-0.5 text-sm">
            {item.options.attribute}
          </code>
        )}
        <span className="text-sm font-medium text-current/70">
          {getOperatorLabel(item.options.operator)}
        </span>
        {needsValue && item.options.value !== undefined && (
          <code className="bg-input-contrast/10 rounded px-2 py-0.5 text-sm">
            {JSON.stringify(item.options.value)}
          </code>
        )}
      </motion.div>
      <motion.div layout className="ml-auto flex items-center gap-1">
        <IconButton
          size="sm"
          variant="text"
          className="text-current"
          color="primary"
          onClick={onEdit}
          aria-label="Edit rule"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="text"
          className="text-current"
          color="destructive"
          size="sm"
          onClick={onDelete}
          icon={<Trash2 />}
          aria-label="Remove rule"
        />
      </motion.div>
    </motion.div>
  );
}

function FilterRuleEditor({
  item,
  isNewItem,
  onSave,
  onCancel,
}: ArrayFieldEditorProps<FilterRule>) {
  const handleSubmit = (values: unknown) => {
    const data = values as Record<string, unknown>;
    const operator = data.operator as FilterOperator;
    const needsValue = !['EXISTS', 'NOT_EXISTS'].includes(operator);

    onSave({
      id: item?.id ?? crypto.randomUUID(),
      type: data.type as EntityType,
      options: {
        type: (data.entitySubtype as string) || undefined,
        attribute: (data.attribute as string) || undefined,
        operator,
        value: needsValue
          ? (data.value as FilterRule['options']['value'])
          : undefined,
      },
    });

    return { success: true as const };
  };

  const formId = `filter-rule-form-${item?._internalId ?? 'new'}`;

  return (
    <Dialog
      title={isNewItem ? 'Add Filter Rule' : 'Edit Filter Rule'}
      description="Configure a filter rule to match network entities"
      open={!!item}
      closeDialog={onCancel}
      layoutId={isNewItem ? undefined : item?._internalId}
      footer={
        <>
          <MotionButton type="button" onClick={onCancel}>
            Cancel
          </MotionButton>
          <MotionButton
            type="button"
            color="primary"
            onClick={() => document.getElementById(formId)?.click()}
          >
            {isNewItem ? 'Add Rule' : 'Save Changes'}
          </MotionButton>
        </>
      }
    >
      <Form onSubmit={handleSubmit} className="w-full max-w-full">
        <Field
          name="type"
          label="Entity Type"
          hint="The type of network entity to filter"
          component={SelectField}
          options={[...ENTITY_TYPES]}
          initialValue={item?.type ?? 'node'}
          required
        />
        <Field
          name="entitySubtype"
          label="Entity Subtype"
          hint="Optional: Specific node or edge type from your protocol"
          component={InputField}
          initialValue={item?.options.type ?? ''}
          placeholder="e.g., Person, Friend"
        />
        <Field
          name="attribute"
          label="Attribute"
          hint="The attribute to compare (leave empty for existence checks)"
          component={SelectField}
          options={[{ value: '', label: '(None)' }, ...MOCK_VARIABLES]}
          initialValue={item?.options.attribute ?? ''}
          placeholder="Select attribute..."
        />
        <Field
          name="operator"
          label="Operator"
          hint="How to compare the attribute value"
          component={SelectField}
          options={[...FILTER_OPERATORS]}
          initialValue={item?.options.operator ?? 'EXISTS'}
          required
        />
        <Field
          name="value"
          label="Value"
          hint="The value to compare against (not needed for EXISTS/NOT_EXISTS)"
          component={InputField}
          initialValue={
            item?.options.value !== undefined ? String(item.options.value) : ''
          }
          placeholder="e.g., 25, John, true"
        />
      </Form>
    </Dialog>
  );
}

// ============================================================================
// Validation Config Item (for ValidationsSchema)
// ============================================================================

type ValidationConfig = {
  id: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  minSelected?: number;
  maxSelected?: number;
  unique?: boolean;
  differentFrom?: string;
  sameAs?: string;
  greaterThanVariable?: string;
  lessThanVariable?: string;
};

function formatValidationSummary(config: ValidationConfig): string[] {
  const rules: string[] = [];

  if (config.required) rules.push('Required');
  if (config.unique) rules.push('Must be unique');
  if (config.minLength !== undefined)
    rules.push(`Min length: ${config.minLength}`);
  if (config.maxLength !== undefined)
    rules.push(`Max length: ${config.maxLength}`);
  if (config.minValue !== undefined)
    rules.push(`Min value: ${config.minValue}`);
  if (config.maxValue !== undefined)
    rules.push(`Max value: ${config.maxValue}`);
  if (config.minSelected !== undefined)
    rules.push(`Min selected: ${config.minSelected}`);
  if (config.maxSelected !== undefined)
    rules.push(`Max selected: ${config.maxSelected}`);
  if (config.differentFrom)
    rules.push(`Different from: ${config.differentFrom}`);
  if (config.sameAs) rules.push(`Same as: ${config.sameAs}`);
  if (config.greaterThanVariable)
    rules.push(`Greater than: ${config.greaterThanVariable}`);
  if (config.lessThanVariable)
    rules.push(`Less than: ${config.lessThanVariable}`);

  return rules.length > 0 ? rules : ['No validation rules configured'];
}

function ValidationConfigItem({
  item,
  isSortable,
  onEdit,
  onDelete,
  dragControls,
}: ArrayFieldItemProps<ValidationConfig>) {
  const rules = formatValidationSummary(item);

  return (
    <motion.div
      layoutId={item._internalId}
      className="border-b-input-contrast/10 flex w-full items-start gap-2 border-b px-2 py-2 last:border-b-0"
    >
      {isSortable && (
        <motion.div
          layout
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none pt-1"
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </motion.div>
      )}
      <motion.div layout className="flex flex-1 flex-wrap gap-1.5">
        {rules.map((rule, idx) => (
          <span
            key={idx}
            className="bg-input-contrast/10 rounded px-2 py-0.5 text-xs"
          >
            {rule}
          </span>
        ))}
      </motion.div>
      <motion.div layout className="ml-auto flex items-center gap-1">
        <IconButton
          size="sm"
          variant="text"
          className="text-current"
          color="primary"
          onClick={onEdit}
          aria-label="Edit validation"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="text"
          className="text-current"
          color="destructive"
          size="sm"
          onClick={onDelete}
          icon={<Trash2 />}
          aria-label="Remove validation"
        />
      </motion.div>
    </motion.div>
  );
}

function ValidationConfigEditor({
  item,
  isNewItem,
  onSave,
  onCancel,
}: ArrayFieldEditorProps<ValidationConfig>) {
  const handleSubmit = (values: unknown) => {
    const data = values as Record<string, unknown>;
    const config: ValidationConfig = {
      id: item?.id ?? crypto.randomUUID(),
    };

    // Boolean fields
    if (data.required === true) config.required = true;
    if (data.unique === true) config.unique = true;

    // Number fields - only include if they have values
    const numFields = [
      'minLength',
      'maxLength',
      'minValue',
      'maxValue',
      'minSelected',
      'maxSelected',
    ] as const;
    for (const field of numFields) {
      const val = data[field];
      if (val !== undefined && val !== '' && !isNaN(Number(val))) {
        config[field] = Number(val);
      }
    }

    // String fields
    const strFields = [
      'differentFrom',
      'sameAs',
      'greaterThanVariable',
      'lessThanVariable',
    ] as const;
    for (const field of strFields) {
      const val = data[field];
      if (val && typeof val === 'string' && val.trim()) {
        config[field] = val.trim();
      }
    }

    onSave(config);
    return { success: true as const };
  };

  const formId = `validation-config-form-${item?._internalId ?? 'new'}`;

  return (
    <Dialog
      title={isNewItem ? 'Add Validation Rules' : 'Edit Validation Rules'}
      description="Configure validation rules for this field"
      open={!!item}
      closeDialog={onCancel}
      layoutId={isNewItem ? undefined : item?._internalId}
      footer={
        <>
          <MotionButton type="button" onClick={onCancel}>
            Cancel
          </MotionButton>
          <MotionButton
            type="button"
            color="primary"
            onClick={() => document.getElementById(formId)?.click()}
          >
            {isNewItem ? 'Add Validation' : 'Save Changes'}
          </MotionButton>
        </>
      }
    >
      <Form onSubmit={handleSubmit} className="w-full max-w-full">
        <Field
          name="required"
          label="Required"
          component={BooleanField}
          initialValue={item?.required}
          noReset
        />
        <Field
          name="unique"
          label="Must be unique"
          component={BooleanField}
          initialValue={item?.unique}
          noReset
        />

        <div className="border-t pt-4">
          <h4 className="mb-3 text-sm font-medium text-current/70">
            Length Constraints
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Field
              name="minLength"
              label="Minimum Length"
              component={InputField}
              type="number"
              initialValue={item?.minLength ?? ''}
              placeholder="e.g., 1"
            />
            <Field
              name="maxLength"
              label="Maximum Length"
              component={InputField}
              type="number"
              initialValue={item?.maxLength ?? ''}
              placeholder="e.g., 100"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="mb-3 text-sm font-medium text-current/70">
            Value Constraints
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Field
              name="minValue"
              label="Minimum Value"
              component={InputField}
              type="number"
              initialValue={item?.minValue ?? ''}
              placeholder="e.g., 0"
            />
            <Field
              name="maxValue"
              label="Maximum Value"
              component={InputField}
              type="number"
              initialValue={item?.maxValue ?? ''}
              placeholder="e.g., 100"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="mb-3 text-sm font-medium text-current/70">
            Selection Constraints (for arrays)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Field
              name="minSelected"
              label="Minimum Selected"
              component={InputField}
              type="number"
              initialValue={item?.minSelected ?? ''}
              placeholder="e.g., 1"
            />
            <Field
              name="maxSelected"
              label="Maximum Selected"
              component={InputField}
              type="number"
              initialValue={item?.maxSelected ?? ''}
              placeholder="e.g., 5"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="mb-3 text-sm font-medium text-current/70">
            Variable Comparisons
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Field
              name="sameAs"
              label="Same as variable"
              component={SelectField}
              options={[{ value: '', label: '(None)' }, ...MOCK_VARIABLES]}
              initialValue={item?.sameAs ?? ''}
            />
            <Field
              name="differentFrom"
              label="Different from variable"
              component={SelectField}
              options={[{ value: '', label: '(None)' }, ...MOCK_VARIABLES]}
              initialValue={item?.differentFrom ?? ''}
            />
            <Field
              name="greaterThanVariable"
              label="Greater than variable"
              component={SelectField}
              options={[{ value: '', label: '(None)' }, ...MOCK_VARIABLES]}
              initialValue={item?.greaterThanVariable ?? ''}
            />
            <Field
              name="lessThanVariable"
              label="Less than variable"
              component={SelectField}
              options={[{ value: '', label: '(None)' }, ...MOCK_VARIABLES]}
              initialValue={item?.lessThanVariable ?? ''}
            />
          </div>
        </div>
      </Form>
    </Dialog>
  );
}

const meta: Meta<typeof Form> = {
  title: 'Systems/Form/Protocol Schemas',
  component: Form,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const samplePrompts: NameGeneratorPrompt[] = [
  {
    id: 'prompt-1',
    text: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Please enter the names of people you are close to.',
            },
          ],
        },
      ],
    },
    additionalAttributes: [{ variable: 'closeness', value: true }],
  },
];

const nameGeneratorPromptsSchema = z.array(
  z.object({
    id: z.uuid(),
    text: z.json(),
    additionalAttributes: z
      .array(
        z.object({
          variable: z.string(),
          value: z.boolean(),
        }),
      )
      .optional(),
  }),
);

export const NameGeneratorPrompts: Story = {
  render: () => (
    <>
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
          minSelected={2}
        />
        <SubmitButton>Save Prompts</SubmitButton>
      </Form>
    </>
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
          <Paragraph>
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
          <Paragraph>
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
          <Paragraph>
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
          pattern="^[a-z][a-zA-Z0-9]*$"
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
