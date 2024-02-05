import { cn } from '~/utils/shadcn';
import { cardClasses } from '../ui/card';

const Section = ({
  children,
  classNames,
}: {
  children: React.ReactNode;
  classNames?: string;
}) => (
  <section className={cn(cardClasses, 'p-6', classNames)}>{children}</section>
);

export default Section;
