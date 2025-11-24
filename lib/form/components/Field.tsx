import { motion } from 'motion/react';
import { useField } from '../hooks';
import { type FieldValidation } from '../types';
import FieldErrors from './FieldErrors';
import { FieldLabel } from './FieldLabel';
import Hint from './Hint';

type InputProps<T = unknown> = {
  value: T;
  onChange: (value: T) => void;
};

type ExtractValue<C> =
  C extends React.ComponentType<{ value: infer V }> ? V : never;

type FieldOwnProps<C extends React.ComponentType<InputProps<any>>> = {
  name: string;
  label: string;
  hint?: string;
  initialValue?: ExtractValue<C>;
  required?: boolean;
  validation?: FieldValidation;
  component: C;
};

type FieldProps<C extends React.ComponentType<InputProps<any>>> =
  FieldOwnProps<C> & Omit<React.ComponentProps<C>, keyof InputProps<any>>;

export default function Field<C extends React.ComponentType<InputProps<any>>>({
  name,
  label,
  hint,
  initialValue,
  required,
  validation,
  component: Component,
  ...componentProps
}: FieldProps<C>) {
  const { id, containerProps, fieldProps, meta } = useField({
    name,
    initialValue,
    required,
    validation,
  });

  // const value = {} as ExtractValue<C>;
  // const onChange = (v: ExtractValue<C>) => console.log(name, v);

  const needsFieldset = false;

  // Choose wrapper element based on fieldset mode
  const WrapperElement = needsFieldset ? 'fieldset' : 'div';

  return (
    <motion.div key={id} layout {...containerProps} className="w-full grow">
      <WrapperElement>
        <FieldLabel
          id={`${id}-label`}
          htmlFor={!needsFieldset ? id : undefined}
          required={required}
          render={needsFieldset ? <legend /> : undefined}
        >
          {label}
        </FieldLabel>
        <Component
          id={id}
          name={name}
          required={required}
          {...(componentProps as any)}
          {...fieldProps}
        />
      </WrapperElement>
      {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
      <FieldErrors
        id={`${id}-error`}
        errors={meta.errors}
        show={meta.shouldShowError}
      />
    </motion.div>
  );
}
