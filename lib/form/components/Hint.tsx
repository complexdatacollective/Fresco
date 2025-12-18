export default function Hint({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="mb-4 text-sm text-current/70">
      {children}
    </div>
  );
}
