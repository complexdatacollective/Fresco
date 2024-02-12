import { cn } from '~/utils/shadcn';
import Section from './Section';
import Heading from '../ui/typography/Heading';

export default function SettingsSection({
  heading,
  children,
  controlArea,
  classNames,
}: {
  heading: string;
  children: React.ReactNode;
  controlArea: React.ReactNode;
  classNames?: string;
}) {
  return (
    <Section classNames={cn(classNames, 'flex gap-10')}>
      <div className="flex-1">
        <Heading variant="h4-all-caps" className="mb-2">
          {heading}
        </Heading>
        {children}
      </div>
      <div className="flex min-w-32 flex-shrink-0 flex-col items-end justify-center">
        {controlArea}
      </div>
    </Section>
  );
}
