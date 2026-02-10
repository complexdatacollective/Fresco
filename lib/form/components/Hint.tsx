import { motion } from 'motion/react';

export default function Hint({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      layout
      id={id}
      className="text-sm text-current/70 not-empty:mb-4"
    >
      {children}
    </motion.div>
  );
}
