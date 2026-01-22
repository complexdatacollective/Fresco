'use client';

import { Settings } from 'lucide-react';
import { motion } from 'motion/react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UrlObject } from 'url';
import { MotionSurface } from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { Spinner } from '~/lib/legacy-ui/components';
import { cx } from '~/utils/cva';
import { MobileNavDrawer } from './MobileNavDrawer';
import UserMenu from './UserMenu';

const NavButton = ({
  label,
  href,
  isActive = false,
}: {
  label: string | React.ReactNode;
  href: UrlObject | Route;
  isActive?: boolean;
}) => {
  return (
    <motion.li layout className="relative flex flex-col justify-start">
      <Link
        href={href}
        className={cx(
          'focusable rounded-sm font-semibold outline-offset-10!',
          !isActive && 'hover:text-sea-green',
        )}
      >
        {label}
      </Link>
      {isActive && (
        <motion.div
          layoutId="underline"
          className="absolute top-[105%] right-0 left-0 h-[2px] rounded-full bg-[currentColor]"
        />
      )}
    </motion.li>
  );
};

export function NavigationBar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-4 z-50 flex w-full items-center justify-center">
      <MotionSurface
        as="nav"
        spacing="none"
        className={cx(
          'text-primary-contrast sticky top-4 flex max-w-6xl items-center justify-between gap-4 rounded-full bg-[oklch(20%_0.3_260/0.8)] px-6 py-2 backdrop-blur-sm',
        )}
        initial={{ y: '-150%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring' }}
        elevation="high"
      >
        <Link href="/" className="focusable flex items-center gap-2 rounded-sm">
          <Spinner size="sm" animationMode="hover" playOnMount />
          <Heading
            level="h4"
            className="laptop:block hidden font-extrabold"
            margin="none"
          >
            Fresco
          </Heading>
        </Link>
        <ul className="tablet:flex hidden items-center gap-10">
          <NavButton
            href="/dashboard"
            isActive={pathname === '/dashboard'}
            label="Dashboard"
          />
          <NavButton
            label="Protocols"
            href="/dashboard/protocols"
            isActive={pathname === '/dashboard/protocols'}
          />
          <NavButton
            label="Participants"
            href="/dashboard/participants"
            isActive={pathname === '/dashboard/participants'}
          />
          <NavButton
            label="Interviews"
            href="/dashboard/interviews"
            isActive={pathname === '/dashboard/interviews'}
          />
        </ul>
        <div className="tablet:flex hidden items-center gap-8">
          <NavButton
            label={
              <div className="flex items-center gap-2">
                <Settings className="inline-block" />
                <span className="laptop:inline hidden">Settings</span>
              </div>
            }
            href="/dashboard/settings"
            isActive={pathname === '/dashboard/settings'}
          />

          <UserMenu />
        </div>

        <div className="tablet:hidden">
          <MobileNavDrawer />
        </div>
      </MotionSurface>
    </div>
  );
}
