import {
  type ComponentType,
  type ValidationError,
  type VariableType,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { type ValidationErrorMap } from '@tanstack/react-form';
import type {
  TanStackValidator,
  VariableValidation,
} from '~/lib/form/utils/fieldValidation';

// Core field validation type
type FieldValidation = {
  onChangeListenTo?: string[];
  onChange: (params: {
    value: VariableValue;
    fieldApi: unknown;
  }) => string | undefined;
};

// Base field configuration (before processing)
type BaseFormField = {
  variable: string;
  prompt?: string;
  onBlur?: () => void;
};

// Raw field from protocol (input to processing)
export type FormField = BaseFormField & {
  Component?: React.ComponentType<FieldComponentProps>;
};

// Processed field ready for rendering (output of processing)
export type ProcessedFormField = BaseFormField & {
  Component: React.ComponentType<FieldComponentProps>;
  validation: FieldValidation;
  label?: string;
  fieldLabel?: string;
  options?: FieldOption[];
  parameters?: Record<string, unknown>;
  type?: VariableType;
};

// Field option for categorical/ordinal fields
export type FieldOption = {
  label: string;
  value: VariableValue;
};

// Protocol field definition (from codebook)
type BaseProtocolField = {
  name: string;
  component: ComponentType;
  label?: string;
  fieldLabel?: string;
  value?: VariableValue;
  parameters?: Record<string, unknown>;
  validation?: VariableValidation;
  validate?: TanStackValidator;
  Component?: React.ComponentType<FieldComponentProps>;
  onBlur?: () => void;
};

// Discriminated union for protocol field types
export type ProtocolField =
  | (BaseProtocolField & {
      type: 'categorical' | 'ordinal';
      options: FieldOption[];
    })
  | (BaseProtocolField & {
      type:
        | 'boolean'
        | 'text'
        | 'number'
        | 'datetime'
        | 'scalar'
        | 'layout'
        | 'location';
    });

// Form error structure from TanStack Form
export type FormErrors = Record<
  string,
  {
    errors: ValidationError[];
    errorMap: ValidationErrorMap;
  }
>;

// Standard field component props
export type FieldComponentProps = {
  label?: string;
  fieldLabel?: string;
  options?: FieldOption[];
  parameters?: Record<string, unknown>;
  disabled?: boolean;
  type?: VariableType;
  autoFocus?: boolean;
};
