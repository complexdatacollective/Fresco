import { useFormStore } from '../store/formStoreProvider';

export default function SubmitButton() {
  const isSubmitting = useFormStore((state) => state.isSubmitting);
  const isValid = useFormStore((state) => state.isValid);

  console.log('SubmitButton isSubmitting:', isSubmitting, 'isValid:', isValid);

  return (
    <button
      type="submit"
      key="submit"
      aria-label="Submit"
      className="bg-accent text-accent-foreground rounded-xl p-2 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={isSubmitting ?? !isValid}
    >
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </button>
  );
}
