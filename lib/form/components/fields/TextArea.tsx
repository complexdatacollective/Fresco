import { forwardRef } from 'react';
import {
  controlVariants,
  inputControlVariants,
  interactiveStateVariants,
  multilineContentVariants,
  placeholderVariants,
  stateVariants,
} from '~/styles/shared/controlVariants';
import { compose, cva, cx, type VariantProps } from '~/utils/cva';
import { getInputState } from '../../utils/getInputState';
import { type CreateFormFieldProps } from '../Field/types';

const textareaWrapperVariants = compose(
  controlVariants,
  inputControlVariants,
  stateVariants,
  interactiveStateVariants,
  cva({
    base: 'h-auto w-full',
  }),
);

const textareaVariants = compose(
  placeholderVariants,
  multilineContentVariants,
  cva({
    base: cx(
      'size-full resize-y',
      'border-none bg-transparent outline-none focus:ring-0',
      'cursor-[inherit]',
    ),
  }),
);

type TextAreaFieldProps = CreateFormFieldProps<string, 'textarea'> &
  VariantProps<typeof textareaWrapperVariants>;

const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField(props, ref) {
    const { className, value, onChange, onBlur, disabled, readOnly, ...rest } =
      props;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div
        className={textareaWrapperVariants({
          className,
          state: getInputState(props),
        })}
      >
        <textarea
          ref={ref}
          {...rest}
          value={value ?? ''}
          onBlur={onBlur}
          disabled={disabled}
          readOnly={readOnly}
          onChange={handleChange}
          className={textareaVariants()}
        />
      </div>
    );
  },
);

export default TextAreaField;
