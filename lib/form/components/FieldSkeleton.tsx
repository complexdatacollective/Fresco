import React from 'react';
import { cn } from '~/utils/shadcn';

type FieldSkeletonProps = {
  type?:
    | 'textarea'
    | 'boolean'
    | 'toggle'
    | 'toggleButton'
    | 'radio'
    | 'checkbox'
    | 'slider';
} & React.HTMLAttributes<HTMLDivElement>;

const FieldSkeleton: React.FC<FieldSkeletonProps> = ({
  type,
  className,
  ...props
}) => {
  const skeletonClass = 'bg-[var(--nc-panel-bg-muted)] rounded';

  const renderField = () => {
    switch (type) {
      case 'textarea':
        return (
          <div className={cn(skeletonClass, 'h-56 w-full rounded-t-2xl')} />
        );

      case 'boolean':
        return (
          <div className="flex gap-2">
            <div className={cn(skeletonClass, 'h-16 flex-1 rounded-lg')} />
            <div className={cn(skeletonClass, 'h-16 flex-1 rounded-lg')} />
          </div>
        );

      case 'toggle':
        return <div className={cn(skeletonClass, 'h-6 w-12 rounded-full')} />;

      case 'toggleButton':
        return (
          <div className="flex justify-center gap-4">
            <div className={cn(skeletonClass, 'h-24 w-24 rounded-full')} />
            <div className={cn(skeletonClass, 'h-24 w-24 rounded-full')} />
          </div>
        );

      case 'radio':
      case 'checkbox': {
        const shape = type === 'radio' ? 'rounded-full' : 'rounded-none';
        return (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className={cn(skeletonClass, `h-6 w-6 ${shape}`)} />
                <div className={cn(skeletonClass, 'h-4 w-32 rounded-md')} />
              </div>
            ))}
          </div>
        );
      }

      case 'slider':
        return (
          <div className="space-y-4">
            <div className={cn(skeletonClass, 'h-2 w-full rounded-full')} />
            <div className="flex justify-between">
              <div className={cn(skeletonClass, 'h-4 w-12 rounded-md')} />
              <div className={cn(skeletonClass, 'h-4 w-12 rounded-md')} />
            </div>
          </div>
        );

      case undefined:
      default:
        return (
          <div className={cn(skeletonClass, 'h-12 w-full rounded-t-2xl')} />
        );
    }
  };

  return (
    <div className={cn('form-field-container mb-8', className)} {...props}>
      <div className="form-field-label mb-2">
        <div className={cn(skeletonClass, 'h-6 w-48 rounded-md')} />
      </div>
      <div className="form-field">{renderField()}</div>
    </div>
  );
};

export default FieldSkeleton;
