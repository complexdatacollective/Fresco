import Heading from '~/components/ui/typography/Heading';

export default function StatCard({
  title,
  value,
  icon,
}: {
  title?: string;
  value?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-[hsl(var(--platinum--dark))] bg-card p-4 text-card-foreground shadow-xl shadow-platinum-dark transition-all hover:scale-[102%] sm:flex-row sm:items-center sm:p-6 md:p-10">
      <div className="hidden md:block">{icon}</div>
      <div>
        <Heading variant="h4-all-caps">{title}</Heading>
        <Heading variant="h1">{value}</Heading>
      </div>
    </div>
  );
}
