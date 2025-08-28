import { cn } from '~/utils/shadcn';
import { cardClasses } from '../ui/card';

const Section = ({
  children,
  classNames,
  'data-testid': dataTestId,
}: {
  children: React.ReactNode;
  classNames?: string;
  'data-testid'?: string;
}) => (
  <section className={cn(cardClasses, 'p-6', classNames)} data-testid={dataTestId}>{children}</section>
);

export default Section;
