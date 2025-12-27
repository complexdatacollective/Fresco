import Paragraph from '~/components/typography/Paragraph';
import { cx } from '~/utils/cva';

/**
 * Render field errors.
 *
 * If there's a single error, it will be displayed as a paragraph.
 * If there are multiple errors, it will render a list.
 */
export default function FieldErrors({
  id,
  errors,
  show,
}: {
  id: string; // Used for aria labels
  errors?: string[];
  show: boolean;
}) {
  if (!show) return <div id={id} className="sr-only" aria-live="polite" />;

  return (
    <div
      id={id}
      className={cx(
        'interview:text-destructive-contrast interview:bg-destructive animate-shake interview:mt-2 interview:px-3 interview:py-2 rounded text-sm',
        'text-destructive',
      )}
      key={errors?.join('|')} // Re-render when errors change, to trigger animation
      aria-live="polite"
    >
      {errors && <Paragraph>{errors[0]}</Paragraph>}
    </div>
  );
}
