import '~/styles/interview.scss';

export const metadata = {
  title: 'Network Canvas Fresco - Interview',
  description: 'Interview',
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-screen max-h-screen flex-col bg-(--nc-background) text-(--nc-text)">
      {children}
    </main>
  );
}

export default RootLayout;
