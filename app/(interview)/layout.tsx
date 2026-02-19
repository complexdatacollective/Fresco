export const metadata = {
  title: 'Network Canvas Fresco - Interview',
  description: 'Interview',
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-screen max-h-screen flex-col scheme-dark">
      {children}
    </main>
  );
}

export default RootLayout;
