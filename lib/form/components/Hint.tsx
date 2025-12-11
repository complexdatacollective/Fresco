import { paragraphVariants } from '~/components/typography/Paragraph';

export default function Hint({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <p
      id={id}
      className={paragraphVariants({ className: 'text-xs text-current/70' })}
    >
      {children}
    </p>
  );
}
