import { TriangleAlert } from 'lucide-react';

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
  id: string;
  errors: string[] | null;
  show: boolean;
}) {
  if (!show || !errors || errors.length === 0) return null;

  return (
    <div id={id} className="text-destructive flex gap-2 text-sm">
      <TriangleAlert className="h-4 w-4 self-center" />
      {errors.length === 1 ? (
        <p>{errors[0]}</p>
      ) : (
        <ul>
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
