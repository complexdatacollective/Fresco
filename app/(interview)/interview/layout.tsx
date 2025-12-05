import SmallScreenOverlay from '~/app/(interview)/interview/_components/SmallScreenOverlay';
import '~/styles/interview.scss';
import '~/styles/themes/interview.css';

export const metadata = {
  title: 'Network Canvas Fresco - Interview',
  description: 'Interview',
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-screen max-h-screen flex-col">
      <SmallScreenOverlay />
      {children}
    </main>
  );
}

export default RootLayout;
