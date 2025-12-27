'use client';

import { type AdditionalAttributes } from '@codaco/protocol-validation';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { type JSONContent } from '@tiptap/core';
import { GripVertical, PencilIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { action } from 'storybook/actions';
import { z } from 'zod';
import RichTextRenderer from '~/components/RichTextRenderer';
import Heading from '~/components/typography/Heading';
import Button, { IconButton, MotionButton } from '~/components/ui/Button';
import Dialog from '~/lib/dialogs/Dialog';
import Field from '~/lib/form/components/Field/Field';
import Form, { FormWithoutProvider } from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import ArrayField, {
  type ArrayFieldEditorProps,
  type ArrayFieldItemProps,
} from '~/lib/form/components/fields/ArrayField/ArrayField';
import BooleanField from '~/lib/form/components/fields/Boolean';
import RichTextEditorField from '~/lib/form/components/fields/RichTextEditor';
import SelectField from '~/lib/form/components/fields/Select/Native';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';
import { cx } from '~/utils/cva';
import UnconnectedField from './Field/UnconnectedField';

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
