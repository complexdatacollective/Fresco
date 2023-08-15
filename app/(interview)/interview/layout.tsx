import "~/styles/interview.scss";

export const metadata = {
  title: "Network Canvas Fresco - Interview",
  description: "Interview",
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return <main className="bg-violet-200">{children}</main>;
}

export default RootLayout;
