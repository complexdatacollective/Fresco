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

export type FormField = {
  prompt?: string;
  variable: string;
  Component?: React.ComponentType<FieldComponentProps>; // optional pre-resolved component
  onBlur?: () => void; // optional, custom blur handler
};

export type FieldType = {
  name: string;
  component: ComponentType;
  type: VariableType;
  label?: string;
  fieldLabel?: string;
  value?: VariableValue;
  options?: { label: string; value: VariableValue }[];
  parameters?: Record<string, unknown>;
  validation?: VariableValidation;
  validate?: TanStackValidator;
  Component?: React.ComponentType<FieldComponentProps>;
  onBlur?: () => void; // optional, custom blur handler
};

export type TanStackFormErrors = Record<
  string,
  {
    errors: ValidationError[];
    errorMap: ValidationErrorMap;
  }
>;

export type FormProps = {
  fields: FormField[];
  handleFormSubmit: ({ value }: { value: Record<string, VariableValue> }) => void;
  submitButton?: React.ReactNode;
  initialValues?: Record<string, VariableValue>;
  autoFocus?: boolean;
  disabled?: boolean;
  id?: string;
  entityId?: string;
};

export type FieldProps = {
  field: FieldType;
  autoFocus?: boolean;
  disabled?: boolean;
};

type InputMeta = {
  error: string | null;
  invalid: boolean;
  touched: boolean;
};

type InputHandlers = {
  name: string;
  value: VariableValue;
  onChange: (value: VariableValue) => void;
  onBlur: () => void;
  onSubmit?: () => void;
};

export type InputComponentProps = {
  input: InputHandlers;
  meta: InputMeta;
  label?: string;
  fieldLabel?: string;
  options?: { label: string; value: VariableValue }[];
  parameters?: Record<string, unknown>;
  autoFocus?: boolean;
  disabled?: boolean;
  type: VariableType;
};

export type FieldComponentProps = {
  label?: string;
  fieldLabel?: string;
  options?: { label: string; value: VariableValue }[];
  parameters?: Record<string, unknown>;
  autoFocus?: boolean;
  disabled?: boolean;
  type?: VariableType;
};
