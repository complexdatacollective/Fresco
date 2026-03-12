export default function Hint({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="text-sm text-current/70 not-empty:mb-4">
      {children}
    </div>
  );
}
