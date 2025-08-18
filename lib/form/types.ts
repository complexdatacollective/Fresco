import {
  type ComponentType,
  type ValidationError,
  type VariableType,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { type ValidationErrorMap } from '@tanstack/react-form';
import type {
  TanStackValidator,
  TanStackValidatorParams,
  VariableValidation,
} from '~/lib/form/utils/fieldValidation';

// Core field validation type
type FieldValidation = {
  dependsOnVariables?: string[];
  onChange: (params: {
    value: VariableValue;
    fieldApi: TanStackValidatorParams['fieldApi'];
  }) => string | undefined;
};

// Raw form field (from protocol)
export type RawFormField = {
  variable: string;
  prompt?: string;
  onBlur?: () => void;
  Component?: React.ComponentType<FieldComponentProps>;
};

// Processed form field (ready to be rendered)
export type ProcessedFormField = {
  variable: string;
  Component: React.ComponentType<FieldComponentProps>;
  validation: FieldValidation;
  label?: string;
  fieldLabel?: string;
  options?: FieldOption[];
  parameters?: Record<string, unknown>;
  type?: VariableType;
  onBlur?: () => void;
};

// Field option for categorical/ordinal fields
type FieldOption = {
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
    error: ValidationErrorMap;
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
