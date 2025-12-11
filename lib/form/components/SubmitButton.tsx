import { Loader2 } from 'lucide-react';
import React, { type ComponentProps } from 'react';
import { MotionButton } from '~/components/ui/Button';
import { useFormStore } from '../store/formStoreProvider';

type SubmitButtonProps = ComponentProps<typeof MotionButton> & {
  submittingText?: React.ReactNode;
  children: React.ReactNode;
};

export default function SubmitButton({
  children,
  submittingText = 'Submitting...',
  ...props
}: SubmitButtonProps) {
  const isSubmitting = useFormStore((state) => state.isSubmitting);
  const isValid = useFormStore((state) => state.isValid);

  return (
    <MotionButton
      color="primary"
      type="submit"
      aria-label="Submit"
      disabled={isSubmitting ?? !isValid}
      {...props}
    >
      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isSubmitting ? submittingText : children}
    </MotionButton>
  );
}
