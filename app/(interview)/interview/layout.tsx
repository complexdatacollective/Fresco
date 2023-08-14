export const metadata = {
  title: 'Network Canvas Fresco - Interview',
  description: 'Interview',
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose max-w-none bg-violet-200">
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

export default RootLayout;
