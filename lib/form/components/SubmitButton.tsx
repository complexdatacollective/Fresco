import { Loader2 } from 'lucide-react';
import { type ComponentProps } from 'react';
import { MotionButton } from '~/components/ui/Button';
import { useFormStore } from '../store/formStoreProvider';

export default function SubmitButton(
  props: ComponentProps<typeof MotionButton>,
) {
  const isSubmitting = useFormStore((state) => state.isSubmitting);
  const isValid = useFormStore((state) => state.isValid);

  return (
    <MotionButton
      type="submit"
      aria-label="Submit"
      disabled={isSubmitting ?? !isValid}
      {...props}
    >
      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </MotionButton>
  );
}
