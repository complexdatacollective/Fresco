import Paragraph from '~/components/typography/Paragraph';

export default function Hint({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <Paragraph id={id} margin="none" className="text-xs text-current/60">
      {children}
    </Paragraph>
  );
}
