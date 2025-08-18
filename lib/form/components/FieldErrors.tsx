import { TriangleAlert } from 'lucide-react';
import { useSelector } from 'react-redux';
import { getCodebookVariablesForSubjectType } from '~/lib/interviewer/selectors/protocol';
import { get } from 'es-toolkit/compat';

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
  errors: (string | { message: string; params?: Record<string, unknown> })[] | null;
  show: boolean;
}) {
  const codebookVariables = useSelector(getCodebookVariablesForSubjectType);

  if (!show || !errors || errors.length === 0) return null;

  const formatError = (error: string | { message: string; params?: Record<string, unknown> }) => {
    if (typeof error === 'string') {
      return error;
    }

    // Append variable name to comparison validation messages
    if (error.params?.fieldId && typeof error.params.fieldId === 'string') {
      const variableName = get(codebookVariables, [error.params.fieldId, 'name'], error.params.fieldId);
      return `${error.message} ${variableName}`;
    }

    return error.message;
  };

  const formattedErrors = errors.map(formatError);

  return (
    <div
      id={id}
      className="text-destructive flex justify-items-start gap-2 text-sm"
    >
      <TriangleAlert className="w-4" />
      {formattedErrors.length === 1 ? (
        <p>{formattedErrors[0]}</p>
      ) : (
        <ul className="list-disc pl-5">
          {formattedErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
