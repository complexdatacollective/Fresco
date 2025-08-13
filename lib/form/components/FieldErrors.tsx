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
    <div
      id={id}
      className="text-destructive flex justify-items-start gap-2 text-sm"
    >
      <TriangleAlert className="w-4" />
      {errors.length === 1 ? (
        <p>{errors[0]}</p>
      ) : (
        <ul className="list-disc pl-5">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
