import { AlertCircle } from 'lucide-react';
import { cx } from '~/utils/cva';

type FormErrorsProps = {
  errors: string[] | null;
  className?: string;
};

export default function FormErrors({ errors, className }: FormErrorsProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      className={cx(
        'border-destructive/20 bg-destructive/5 rounded border p-4',
        className,
      )}
    >
      <div className="flex gap-2">
        <AlertCircle className="text-destructive size-5 shrink-0" />
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-destructive text-sm">
              {error}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
