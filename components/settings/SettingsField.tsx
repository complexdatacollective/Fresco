import { type ReactNode } from 'react';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { cx } from '~/utils/cva';

type SettingsFieldProps = {
  label: string;
  description?: ReactNode;
  control?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export default function SettingsField({
  label,
  description,
  control,
  children,
  className,
}: SettingsFieldProps) {
  return (
    <div className={cx('py-4 first:pt-0 last:pb-0', className)}>
      <div className="tablet:flex-row tablet:items-start tablet:justify-between tablet:gap-8 flex flex-col gap-3">
        <div className="min-w-0 flex-1">
          <Heading level="label">{label}</Heading>
          {description && <Paragraph>{description}</Paragraph>}
        </div>
        {control && <div className="flex shrink-0 items-center">{control}</div>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
