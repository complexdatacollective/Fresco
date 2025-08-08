import { Button } from '~/components/ui/Button';
import { useFormStore } from '../store/formStoreProvider';

export default function SubmitButton() {
  const isSubmitting = useFormStore((state) => state.isSubmitting);
  const isValid = useFormStore((state) => state.isValid);

  return (
    <Button
      type="submit"
      key="submit"
      aria-label="Submit"
      disabled={isSubmitting ?? !isValid}
    >
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </Button>
  );
}
