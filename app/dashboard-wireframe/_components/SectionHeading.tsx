export default function SectionHeading({ title }: { title: string }) {
  return (
    <div className="border-b border-gray-200 pb-3">
      <h3 className="text-base font-semibold uppercase leading-6 text-gray-900">
        {title}
      </h3>
    </div>
  );
}
