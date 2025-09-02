import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { cx } from '~/utils/cva';

type FormErrorsProps = {
  errors: string[];
  className?: string;
};

export default function FormErrors({ errors, className }: FormErrorsProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={cx(
          'border-destructive/20 bg-destructive/5 rounded-lg border p-4',
          className,
        )}
      >
        <div className="flex gap-2">
          <AlertCircle className="text-destructive h-5 w-5 flex-shrink-0" />
          <div className="space-y-1">
            {errors.map((error, index) => (
              <p key={index} className="text-destructive text-sm">
                {error}
              </p>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
