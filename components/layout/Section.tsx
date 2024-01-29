const Section = ({ children }: { children: React.ReactNode }) => (
  <section className="flex space-y-4 rounded-xl bg-card p-6">
    {children}
  </section>
);

export default Section;
