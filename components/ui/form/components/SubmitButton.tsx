import { Loader2 } from 'lucide-react';
import React, { type ComponentProps } from 'react';
import { MotionButton } from '~/components/ui/Button';
import useFormStore from '../hooks/useFormStore';

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

  return (
    <MotionButton
      color="primary"
      type="submit"
      disabled={isSubmitting}
      icon={isSubmitting ? <Loader2 className="animate-spin" /> : undefined}
      {...props}
    >
      {isSubmitting ? submittingText : children}
    </MotionButton>
  );
}
