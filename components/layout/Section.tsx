import { cx } from '~/utils/cva';
import { cardClasses } from '../ui/card';

const Section = ({
  children,
  classNames,
}: {
  children: React.ReactNode;
  classNames?: string;
}) => (
  <section className={cx(cardClasses, 'p-6', classNames)}>{children}</section>
);

export default Section;
