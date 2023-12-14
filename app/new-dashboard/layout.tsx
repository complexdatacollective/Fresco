import { Inter } from 'next/font/google';
import { cn } from '~/utils/shadcn';

export const metadata = {
  title: 'Network Canvas Fresco - Dashboard',
  description: 'Fresco.',
};

const inter = Inter({ subsets: ['latin'] });

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <main className={cn(inter.className)}>{children}</main>;
};

export default Layout;
