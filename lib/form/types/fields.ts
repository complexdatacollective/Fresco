import type {
  ComponentType,
  FormField,
  VariableType,
} from '@codaco/protocol-validation';
import type { VariableValue } from '@codaco/shared-consts';

// Field option for categorical/ordinal fields
export type FieldOption = {
  label: string;
  value: VariableValue;
};

// Raw form field (from protocol)
export type RawFormField = FormField & {
  onBlur?: () => void;
  Component?: React.ComponentType<FieldComponentProps>;
};

// Protocol field definition (from codebook)
type BaseProtocolField = {
  name: string;
  component: ComponentType;
  label?: string;
  fieldLabel?: string;
  value?: VariableValue;
  parameters?: Record<string, unknown>;
  validation?: unknown;
  // Display hints from protocol
  displayHints?: {
    size?: 'sm' | 'md' | 'lg';
    orientation?: 'horizontal' | 'vertical';
    variant?: string;
    className?: string;
    useColumns?: boolean;
  };
  // Legacy properties for backward compatibility
  placeholder?: string;
  [key: string]: unknown;
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

// Enriched form field (from enrichFieldsWithCodebookMetadata selector)
export type EnrichedFormField = {
  name: string;
  fieldLabel: string;
  value?: VariableValue;
  // Properties from codebook entity variables
  type?: VariableType;
  component?: ComponentType;
  options?: FieldOption[];
  parameters?: Record<string, unknown>;
  validation?: unknown;
  displayHints?: BaseProtocolField['displayHints'];
  // Legacy compatibility
  placeholder?: string;
  [key: string]: unknown;
};

// Standard field component props - flexible interface for all field types
export type FieldComponentProps = {
  label?: string;
  fieldLabel?: string;
  options?: FieldOption[];
  parameters?: Record<string, unknown>;
  disabled?: boolean;
  type?: VariableType;
  autoFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'ghost' | 'filled' | 'outline';
  className?: string;
  useColumns?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  required?: boolean;
  // Additional props that may be needed by specific components
  name?: string;
  value?: VariableValue;
  onChange?: (value: VariableValue) => void;
  onBlur?: () => void;
  id?: string;
  // Allow any additional props for component flexibility
  [key: string]: unknown;
};