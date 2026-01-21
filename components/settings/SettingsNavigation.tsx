'use client';

import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
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

function handleSmoothScroll(
  e: React.MouseEvent<HTMLAnchorElement>,
  id: string,
) {
  e.preventDefault();
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Update URL hash without jumping
    window.history.pushState(null, '', `#${id}`);
  }
}

export default function SettingsNavigation({
  sections,
  className,
}: SettingsNavigationProps) {
  return (
    <Surface
      as="nav"
      spacing="sm"
      className={cx(
        'tablet:block sticky top-28 hidden h-fit shrink grow-0',
        className,
      )}
      noContainer
    >
      <Heading level="h4" variant="all-caps" margin="none" className="mb-3">
        On this page
      </Heading>
      <ul className="space-y-0.5">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={(e) => handleSmoothScroll(e, section.id)}
              className={cx(
                'block rounded-sm px-3 py-1.5 text-sm transition-colors',
                'hover:bg-surface-1',
                section.variant === 'destructive' && 'text-destructive',
              )}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </Surface>
  );
}
