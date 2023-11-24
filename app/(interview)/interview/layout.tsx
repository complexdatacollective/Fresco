import '~/styles/interview.scss';

export const metadata = {
  title: 'Network Canvas Fresco - Interview',
  description: 'Interview',
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen " style={{ background: 'var(--background)' }}>
      {children}
    </main>
  );
}

export default RootLayout;
