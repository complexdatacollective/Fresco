import { StopCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { type ComponentProps, forwardRef, type ReactNode } from 'react';
import {
  controlContainerVariants,
  placeholderVariants,
  proportionalLucideIconVariants,
  sizeVariants,
  spacingVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';

const inputWrapperVariants = compose(
  sizeVariants,
  proportionalLucideIconVariants,
  spacingVariants,
  controlContainerVariants,
  // controlStateVariants,
  cva({
    base: 'w-full',
  }),
);

// Input element when used with wrapper (prefix/suffix)
export const inputVariants = compose(
  placeholderVariants,
  cva({
    base: cx(
      'cursor-[inherit]',
      'p-0',
      'h-full w-full flex-shrink flex-grow basis-0 border-none bg-transparent outline-none focus:ring-0',
      'shrink-0 grow',
    ),
  }),
);

type InputType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'search'
  | 'tel'
  | 'url'
  | 'date';

// Map input type to its corresponding value type
type InputValueType<T extends InputType> = T extends 'number'
  ? number | undefined
  : string;

type InputFieldProps<T extends InputType = InputType> = Omit<
  ComponentProps<typeof motion.input>,
  'size' | 'type' | 'onChange'
> &
  VariantProps<typeof inputVariants> & {
    size?: VariantProps<typeof inputWrapperVariants>['size'];
    type?: T;
    onChange?: (value: InputValueType<T>) => void;
    // NOTE: these cannot be 'prefix' and 'suffix' because these collide with RDFa attributes in @types/react@18.3.18
    prefixComponent?: ReactNode;
    suffixComponent?: ReactNode;
  };

export const InputField = forwardRef(function InputField<
  T extends InputType = InputType,
>(
  {
    className,
    size = 'md',
    prefixComponent: prefix,
    suffixComponent: suffix,
    onChange,
    disabled,
    type = 'text' as T,
    ...inputProps
  }: InputFieldProps<T>,
  ref: React.Ref<HTMLInputElement>,
) {
  // Change handler that coerces the value passed on onChange based on the input type
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    let value: InputValueType<T>;

    switch (type) {
      case 'number':
        // Allow clearing the field - empty string should be undefined, not 0
        value = (
          rawValue === '' ? undefined : Number(rawValue)
        ) as InputValueType<T>;
        break;
      case 'text':
      case 'email':
      case 'password':
      case 'search':
      case 'tel':
      case 'url':
      case 'date':
      default:
        value = String(rawValue) as InputValueType<T>;
        break;
    }

    onChange?.(value);
  };

  return (
    <motion.div
      layout
      className={cx(
        inputWrapperVariants({ size }),
        'border-input-contrast/20 flex border-2 transition-all duration-200',
        'hover:border-accent/50',
        'focus-visible-within:border-accent focus-visible-within:elevation-low focus-visible-within:translate-y-[-2px]',
        // set different border styles if has aria-invalid
        'has-[aria-invalid=true]:border-destructive',
        className,
      )}
    >
      {prefix}
      <motion.input
        layout
        ref={ref}
        {...inputProps}
        disabled={disabled}
        type={type}
        onChange={handleChange}
        className={inputVariants({ className })}
      />
      <StopCircle className="hidden invalid:block" />
      {suffix}
    </motion.div>
  );
}) as <T extends InputType = InputType>(
  props: InputFieldProps<T> & { ref?: React.Ref<HTMLInputElement> },
) => React.ReactElement;
