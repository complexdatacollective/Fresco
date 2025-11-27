import { motion } from 'motion/react';
import { paragraphVariants } from '~/components/typography/Paragraph';

export default function Hint({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <motion.p
      layout
      id={id}
      className={paragraphVariants({ className: 'text-xs text-current/60' })}
    >
      {children}
    </motion.p>
  );
}
