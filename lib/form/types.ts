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

export type ProcessedFormField = {
  variable: string;
  Component: React.ComponentType<FieldComponentProps>;
  validation: {
    onChangeListenTo?: string[];
    onChange: (params: { value: VariableValue; fieldApi: unknown }) => string | undefined;
  };
  label?: string;
  fieldLabel?: string;
  options?: { label: string; value: VariableValue }[];
  parameters?: Record<string, unknown>;
  type?: VariableType;
  isFirst?: boolean;
  onBlur?: () => void;
};

type BaseFieldType = {
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

export type FieldType =
  | (BaseFieldType & {
      type: 'categorical' | 'ordinal';
      options: { label: string; value: VariableValue }[];
    })
  | (BaseFieldType & {
      type: 'boolean' | 'text' | 'number' | 'datetime' | 'scalar' | 'layout' | 'location';
    });

export type TanStackFormErrors = Record<
  string,
  {
    errors: ValidationError[];
    errorMap: ValidationErrorMap;
  }
>;

export type FormProps = {
  fields: ProcessedFormField[];
  handleSubmit: ({ value }: { value: Record<string, VariableValue> }) => void;
  getInitialValues?: () => Record<string, VariableValue> | Promise<Record<string, VariableValue>>;
  submitButton?: React.ReactNode;
  disabled?: boolean;
  id?: string;
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
