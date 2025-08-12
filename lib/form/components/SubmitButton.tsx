import { forwardRef, type ComponentProps } from 'react';
import { MotionButton } from '~/components/ui/Button';
import { useFormStore } from '../store/formStoreProvider';

const SubmitButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof MotionButton>
>(function SubmitButton(props, ref) {
  const isSubmitting = useFormStore((state) => state.isSubmitting);
  const isValid = useFormStore((state) => state.isValid);

  return (
    <MotionButton
      ref={ref}
      layout
      type="submit"
      aria-label="Submit"
      disabled={isSubmitting ?? !isValid}
      {...props}
    >
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </MotionButton>
  );
});

export default SubmitButton;
