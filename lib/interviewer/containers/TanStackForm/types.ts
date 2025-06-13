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
} from '../../utils/field-validation';

export type FormField = {
  prompt: string;
  variable: string;
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
  Component?: React.ComponentType<InputComponentProps>;
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
  handleFormSubmit: (formData: Record<string, VariableValue>) => void;
  submitButton?: React.ReactNode;
  initialValues?: Record<string, VariableValue>;
  autoFocus?: boolean;
  id?: string;
  entityId?: string;
};

export type FieldProps = {
  field: FieldType;
  autoFocus?: boolean;
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
};

export type InputComponentProps = {
  input: InputHandlers;
  meta: InputMeta;
  label?: string;
  fieldLabel?: string;
  options?: { label: string; value: VariableValue }[];
  parameters?: Record<string, unknown>;
  autoFocus?: boolean;
  type: VariableType;
};
