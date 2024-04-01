import '~/styles/interview.scss';

export const metadata = {
  title: 'Network Canvas Fresco - Interview',
  description: 'Interview',
};

function SmallScreenOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 backdrop-blur-sm md:hidden">
      <div className=" text-2xl font-semibold">
        <p>
          To view this content, please maximize the window or try again on a
          device with a larger screen.
        </p>
      </div>
    </div>
  );
}

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-[100vh] max-h-[100vh] flex-col bg-[--nc-background] text-[--nc-text]">
      <SmallScreenOverlay />
      {children}
    </main>
  );
}

export default RootLayout;
