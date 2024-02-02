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
    <div className="flex items-center gap-6 rounded-xl border border-[hsl(var(--platinum--dark))] bg-card p-6 text-card-foreground shadow-xl shadow-platinum-dark transition-all hover:scale-[102%]">
      <div className="hidden md:block">{icon}</div>
      <div>
        <Heading variant="h4-all-caps">{title}</Heading>
        <Heading variant="h1">{value}</Heading>
      </div>
    </div>
  );
}
