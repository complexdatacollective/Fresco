'use client';

import { cx } from '~/utils/cva';

export type SettingsSection = {
  id: string;
  title: string;
  variant?: 'default' | 'destructive';
};

type SettingsNavigationProps = {
  sections: SettingsSection[];
  className?: string;
};

export default function SettingsNavigation({
  sections,
  className,
}: SettingsNavigationProps) {
  return (
    <nav
      className={cx(
        'sticky top-6 hidden h-fit w-48 shrink-0 lg:block',
        className,
      )}
    >
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={cx(
                'block rounded-sm px-3 py-2 text-sm transition-colors',
                'hover:bg-surface-1 hover:text-surface-1-contrast',
                section.variant === 'destructive' && 'text-destructive',
              )}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
