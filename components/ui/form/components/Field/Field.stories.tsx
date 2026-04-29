import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { action } from 'storybook/actions';
import Form from '~/components/ui/form/components/Form';
import SubmitButton from '~/components/ui/form/components/SubmitButton';
import InputField from '~/components/ui/form/components/fields/InputField';
import ToggleField from '~/components/ui/form/components/fields/ToggleField';
import Field from './Field';
import UnconnectedField from './UnconnectedField';

const componentMap = {
  InputField,
  ToggleField,
} as const;

type ComponentKey = keyof typeof componentMap;

/**
 * The Field system provides consistent layout and labeling for form controls.
 *
 * - **BaseField** — Internal layout primitive. Renders the label, hint,
 *   control, and error slots. Not used directly by consumers.
 * - **Field** — Connected field that integrates with form context via
 *   `useField`. Provides automatic state management, validation, and error
 *   display. Use inside a `<Form>`.
 * - **UnconnectedField** — Standalone field with the same layout but no form
 *   context. Use for controlled inputs outside of `<Form>`, such as in wizard
 *   steps or settings panels.
 *
 * Both Field and UnconnectedField accept an `inline` prop that places the
 * label and control on the same horizontal row.
 *
 * In addition to the props listed below, Field and UnconnectedField accept
 * any prop that is valid for the `component` passed to them. These are
 * forwarded directly to the underlying control (e.g. `size`, `placeholder`,
 * `minValue`).
 *
 * The connected `Field` component also supports `showValidationHints`, which
 * renders a human-readable summary of the field's validation rules (e.g.
 * "required", "minimum 3 characters") below the hint text. This is only
 * available within a `<Form>` context since it relies on the validation
 * props passed to `useField`.
 */
const meta: Meta = {
  title: 'Systems/Form/Field',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    component: {
      control: 'select',
      options: ['InputField', 'ToggleField'],
      description: 'The field component to render',
      table: {
        type: { summary: 'React.ComponentType' },
        defaultValue: { summary: 'InputField' },
      },
    },
    name: {
      control: 'text',
      description: 'Unique field name, used as the key in form state',
      table: {
        type: { summary: 'string' },
        category: 'Field Props',
      },
    },
    label: {
      control: 'text',
      description:
        'Label text rendered above (or beside when inline) the control',
      table: {
        type: { summary: 'string' },
        category: 'Field Props',
      },
    },
    hint: {
      control: 'text',
      description:
        'Supplementary text rendered below the label (or below the label group when inline)',
      table: {
        type: { summary: 'ReactNode' },
        category: 'Field Props',
      },
    },
    inline: {
      control: 'boolean',
      description:
        'When true, renders the label/hint and control on the same horizontal row with space between',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Field Props',
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Prevents user interaction and dims the control',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Field Props',
      },
    },
    readOnly: {
      control: 'boolean',
      description: 'Allows the value to be read but not changed',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Field Props',
      },
    },
    error: {
      control: 'text',
      description: 'Error message to display below the field',
      table: {
        type: { summary: 'string[]' },
        category: 'Field Props',
      },
    },
    showValidationHints: {
      control: false,
      description:
        'When true, renders a human-readable summary of the field\'s validation rules (e.g. "required", "between 8 and 64 characters") below the hint. Only available on the connected Field component inside a Form.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Field Props (connected only)',
      },
    },
    validateOnChange: {
      control: false,
      description:
        'When true, validates the field on change instead of waiting for blur. Validation is debounced. Only available on the connected Field component inside a Form.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Field Props (connected only)',
      },
    },
    validateOnChangeDelay: {
      control: false,
      description:
        'Debounce delay in milliseconds for validateOnChange. Only applies when validateOnChange is true.',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '300' },
        category: 'Field Props (connected only)',
      },
    },
    validationContext: {
      control: false,
      description:
        'Context required for context-dependent validations like unique, sameAs, etc.',
      table: {
        type: { summary: 'ValidationContext' },
        category: 'Field Props (connected only)',
      },
    },
  },
  args: {
    component: 'InputField',
    name: 'demo-field',
    inline: false,
    label: 'Username',
    hint: 'Choose a unique username.',
    disabled: false,
    readOnly: false,
    error: '',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const component = (args.component ?? 'InputField') as ComponentKey;
    const inline = args.inline as boolean;
    const label = (args.label ?? 'Username') as string;
    const hint = (args.hint ?? '') as string;
    const error = (args.error ?? '') as string;
    const disabled = args.disabled as boolean;
    const readOnly = args.readOnly as boolean;
    const [textValue, setTextValue] = useState('');
    const [toggleValue, setToggleValue] = useState(false);

    const Component = componentMap[component];

    const valueProps = (() => {
      switch (component) {
        case 'ToggleField':
          return {
            value: toggleValue,
            onChange: (v: boolean | undefined) => setToggleValue(v ?? false),
          };
        case 'InputField':
          return {
            value: textValue,
            onChange: (v: string | undefined) => setTextValue(v ?? ''),
          };
      }
    })();

    return (
      <div className="max-w-lg">
        <UnconnectedField
          name="demo-field"
          label={label}
          hint={hint}
          inline={inline}
          component={Component}
          disabled={disabled}
          readOnly={readOnly}
          errors={error ? [error] : undefined}
          showErrors={!!error}
          {...valueProps}
        />
      </div>
    );
  },
};

/**
 * Demonstrates the `hint` prop on a connected Field inside a Form.
 * The hint provides supplementary guidance below the label.
 */
export const WithHint: Story = {
  render: () => (
    <div className="max-w-lg">
      <Form
        onSubmit={(data) => {
          action('form-submitted')(data);
          return { success: true };
        }}
      >
        <Field
          name="username"
          label="Username"
          hint="Must be between 3 and 20 characters. Only letters, numbers, and underscores."
          component={InputField}
          required
          minLength={3}
          maxLength={20}
        />
        <Field
          name="bio"
          label="Bio"
          hint="Tell us a bit about yourself."
          component={InputField}
          maxLength={200}
        />
        <SubmitButton>Submit</SubmitButton>
      </Form>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The `hint` prop renders supplementary text below the label. It accepts a `ReactNode` so you can pass plain text or formatted content.',
      },
    },
  },
};

/**
 * Demonstrates the `showValidationHints` prop on a connected Field.
 * When enabled, a human-readable summary of the validation rules is
 * rendered below the hint text (e.g. "Enter at least 3 characters.").
 */
export const WithValidationHints: Story = {
  render: () => (
    <div className="max-w-lg">
      <Form
        onSubmit={(data) => {
          action('form-submitted')(data);
          return { success: true };
        }}
      >
        <Field
          name="username"
          label="Username"
          hint="Choose a unique username."
          component={InputField}
          showValidationHints
          required
          minLength={3}
          maxLength={20}
        />
        <Field
          name="email"
          label="Email"
          hint="We'll use this to contact you."
          component={InputField}
          showValidationHints
          required
          minLength={5}
          maxLength={254}
        />
        <Field
          name="no-validations"
          label="Nickname (optional)"
          hint="This field has no validation rules, so no hints are shown even with showValidationHints."
          component={InputField}
          showValidationHints
        />
        <SubmitButton>Submit</SubmitButton>
      </Form>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "When `showValidationHints` is true, a bulleted list of the field's validation requirements appears below the hint. This helps participants understand what is expected before they start typing. Fields with no validation rules show nothing extra.",
      },
    },
  },
};

/**
 * Shows how `hint` and `showValidationHints` work together — the hint
 * appears first, followed by the auto-generated validation summary.
 */
export const HintWithValidationHints: Story = {
  render: () => (
    <div className="max-w-lg">
      <Form
        onSubmit={(data) => {
          action('form-submitted')(data);
          return { success: true };
        }}
      >
        <Field
          name="password"
          label="Password"
          hint="Use a mix of letters, numbers, and symbols for a strong password."
          component={InputField}
          showValidationHints
          required
          minLength={8}
          maxLength={64}
        />
        <SubmitButton>Submit</SubmitButton>
      </Form>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When both `hint` and `showValidationHints` are set, the hint text appears first, followed by the auto-generated validation rule summary.',
      },
    },
  },
};

/**
 * Demonstrates how markdown formatting renders in field labels and hints.
 * Both support a subset of markdown: **bold** and *italic*
 *
 * **Known issue:** All label text currently renders bold because the
 * parent `<label>` element applies `font-bold`, overriding markdown
 * formatting like *italic*.
 */
export const UsingMarkdown: Story = {
  render: () => (
    <div className="flex max-w-lg flex-col">
      <UnconnectedField
        name="plain"
        label="Plain label with no formatting"
        hint="Plain hint with no formatting"
        component={InputField}
      />
      <UnconnectedField
        name="italic"
        label="This has *italic* text"
        hint="This has *italic* text"
        component={InputField}
      />
      <UnconnectedField
        name="bold"
        label="This has **bold** text"
        hint="This has **bold** text"
        component={InputField}
      />
      <UnconnectedField
        name="mixed"
        label="Mix of **bold** and *italic* in one label"
        hint="Mix of **bold** and *italic* in one hint"
        component={InputField}
      />
      <UnconnectedField
        name="all-italic"
        label="*Entire label is italic*"
        hint="*Entire hint is italic*"
        component={InputField}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Field labels and hints are rendered with ReactMarkdown, supporting `*italic*` and `**bold**`. This story demonstrates markdown rendering in both.',
      },
    },
  },
};
