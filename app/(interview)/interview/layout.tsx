import SessionNavigation from "~/components/interview/SessionNavigation";

export const metadata = {
  title: "Network Canvas Fresco - Interview",
  description: "Interview",
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full w-full bg-violet-200">
      <main className="mx-auto h-full max-w-7xl py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <aside className="absolute bottom-10 flex w-full items-center justify-center">
        <SessionNavigation />
      </aside>
    </div>
  );
}

export default RootLayout;
