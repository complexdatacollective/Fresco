import {
  type AdditionalAttributes,
  type FilterRule,
} from '@codaco/protocol-validation';
import { GripVertical, PencilIcon, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { forwardRef, useState } from 'react';
import { surfaceVariants } from '~/components/layout/Surface';
import Button, { IconButton, MotionButton } from '~/components/ui/Button';
import { Dialog } from '~/lib/dialogs/Dialog';
import { cx } from '~/utils/cva';
import Field from '../../Field';
import Form from '../../Form';
import { UnconnectedField } from '../../UnconnectedField';
import { BooleanField } from '../Boolean';
import { InputField } from '../InputField';
import { NativeSelectField as SelectField } from '../Select';
import {
  ArrayField,
  type ArrayFieldEditorProps,
  type ArrayFieldItemProps,
} from './ArrayField';
import { type NameGeneratorPrompt } from './ItemRenderers';

// ============================================================================
// Mock Variables (for demonstration - in real usage, these come from protocol)
// ============================================================================

export const MOCK_VARIABLES = [
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

export function NameGeneratorPromptItem({
  item,
  isSortable,
  onEdit,
  onDelete,
  dragControls,
}: ArrayFieldItemProps<NameGeneratorPrompt>) {
  const isDraft = item._draft === true;

  if (isDraft) {
    return null;
  }

  return (
    <motion.div
      layoutId={item._internalId}
      layout
      className="flex w-full items-center gap-2 px-2 py-2"
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
      <motion.div layout className="flex-1">
        {item.text}
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
        layout
        className="ml-auto flex items-center gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <IconButton
          size="sm"
          variant="textMuted"
          color="primary"
          onClick={onEdit}
          aria-label="Edit prompt"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="textMuted"
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

export function NameGeneratorPromptEditor({
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
          <MotionButton form={formId} type="submit" color="primary">
            {isNewItem ? 'Add Prompt' : 'Save Changes'}
          </MotionButton>
        </>
      }
    >
      <Form onSubmit={handleSubmit} className="w-full max-w-full" id={formId}>
        <Field
          name="text"
          label="Prompt Text"
          hint="The instruction text shown to participants"
          component={InputField}
          initialValue={item?.text}
          required
          maxLength={5}
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
      </Form>
    </Dialog>
  );
}

// ============================================================================
// Additional Attributes (from nameGeneratorPromptSchema)
// Note: AdditionalAttribute does NOT have an 'id' property per the schema.
// ArrayField uses internal IDs via WeakMap for tracking.
// ============================================================================

export type AdditionalAttribute = AdditionalAttributes[number];

export function AdditionalAttributeItem({
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

  // Inline edit mode
  if (isBeingEdited) {
    return (
      <motion.div
        className={cx(
          surfaceVariants({ level: 2, spacing: 'sm', elevation: 'none' }),
          'flex w-full flex-col border p-4',
        )}
      >
        <UnconnectedField
          component={SelectField}
          label="Variable"
          hint="Select the variable to set"
          name={`additional-attribute-variable-${item._internalId}`}
          value={variable}
          placeholder="Select a variable..."
          onChange={(val) => setVariable(String(val))}
          options={[...MOCK_VARIABLES]}
        />
        <UnconnectedField
          component={BooleanField}
          label="Value"
          hint="The boolean value to assign"
          value={value}
          onChange={setValue}
          noReset
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
    );
  }

  // Display mode
  return (
    <motion.div className="flex w-full items-center gap-2 px-2 py-2">
      {isSortable && (
        <motion.div
          layout
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none"
        >
          <GripVertical className="h-4 w-4 cursor-grab" />
        </motion.div>
      )}
      <motion.div layout className="flex flex-1 items-center gap-3">
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
      <motion.div layout className="ml-auto flex items-center gap-1">
        <IconButton
          size="sm"
          variant="textMuted"
          color="primary"
          onClick={onEdit}
          aria-label="Edit attribute"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="textMuted"
          color="destructive"
          size="sm"
          onClick={onDelete}
          icon={<X />}
          aria-label="Remove attribute"
        />
      </motion.div>
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

export type FilterOperator = (typeof FILTER_OPERATORS)[number]['value'];
export type EntityType = (typeof ENTITY_TYPES)[number]['value'];

function getOperatorLabel(operator: FilterOperator): string {
  return (
    FILTER_OPERATORS.find((op) => op.value === operator)?.label ?? operator
  );
}

export function FilterRuleItem({
  item,
  isSortable,
  onEdit,
  onDelete,
  dragControls,
}: ArrayFieldItemProps<FilterRule>) {
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
          variant="textMuted"
          color="primary"
          onClick={onEdit}
          aria-label="Edit rule"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="textMuted"
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

export const FilterRuleEditor = forwardRef<
  HTMLDivElement,
  ArrayFieldEditorProps<FilterRule>
>(function FilterRuleEditor(
  { item, isEditing, isNewItem, onChange, onCancel },
  ref,
) {
  const handleSubmit = (values: unknown) => {
    const data = values as Record<string, unknown>;
    const operator = data.operator as FilterOperator;
    const needsValue = !['EXISTS', 'NOT_EXISTS'].includes(operator);

    onChange({
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

  const formId = `filter-rule-form-${item?.id ?? 'new'}`;

  return (
    <Dialog
      ref={ref}
      title={isNewItem ? 'Add Filter Rule' : 'Edit Filter Rule'}
      description="Configure a filter rule to match network entities"
      open={isEditing}
      closeDialog={onCancel}
      layoutId={item?.id}
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
});

// ============================================================================
// Validation Config Item (for ValidationsSchema)
// ============================================================================

export type ValidationConfig = {
  id: string;
  required?: boolean;
  requiredAcceptsNull?: boolean;
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
  if (config.requiredAcceptsNull) rules.push('Required (accepts null)');
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

export function ValidationConfigItem({
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
          variant="textMuted"
          color="primary"
          onClick={onEdit}
          aria-label="Edit validation"
          icon={<PencilIcon />}
        />
        <IconButton
          variant="textMuted"
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

export const ValidationConfigEditor = forwardRef<
  HTMLDivElement,
  ArrayFieldEditorProps<ValidationConfig>
>(function ValidationConfigEditor(
  { item, isEditing, isNewItem, onChange, onCancel },
  ref,
) {
  const handleSubmit = (values: unknown) => {
    const data = values as Record<string, unknown>;
    const config: ValidationConfig = {
      id: item?.id ?? crypto.randomUUID(),
    };

    // Boolean fields
    if (data.required === true) config.required = true;
    if (data.requiredAcceptsNull === true) config.requiredAcceptsNull = true;
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

    onChange(config);
    return { success: true as const };
  };

  const formId = `validation-config-form-${item?.id ?? 'new'}`;

  return (
    <Dialog
      ref={ref}
      title={isNewItem ? 'Add Validation Rules' : 'Edit Validation Rules'}
      description="Configure validation rules for this field"
      open={isEditing}
      closeDialog={onCancel}
      layoutId={item?.id}
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
});
