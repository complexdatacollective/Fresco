'use client';

import { Settings } from 'lucide-react';
import { motion, type Variants } from 'motion/react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UrlObject } from 'url';
import { MotionSurface } from '~/components/layout/Surface';
import { SyncStatusIndicator } from '~/components/offline/SyncStatusIndicator';
import Heading from '~/components/typography/Heading';
import { Spinner } from '~/lib/legacy-ui/components';
import { cx } from '~/utils/cva';
import { MobileNavDrawer } from './MobileNavDrawer';
import UserMenu from './UserMenu';

const containerVariants: Variants = {
  hidden: {
    y: '-150%',
  },
  visible: {
    y: 0,
    transition: {
      type: 'spring',
      delayChildren: 0.5,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: '-100%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
    },
  },
};

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
    <motion.li
      layout
      variants={itemVariants}
      className="relative flex flex-col justify-start"
    >
      <Link
        href={href}
        className={cx(
          'focusable relative rounded-full font-semibold outline-offset-10!',
          !isActive && 'hover:text-sea-green',
        )}
      >
        {isActive && (
          <motion.div
            layoutId="active-outline"
            className="absolute -inset-2 rounded-full ring-2 ring-current/20"
          />
        )}
        <span className="relative">{label}</span>
      </Link>
    </motion.li>
  );
};

export function NavigationBar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-4 z-50 flex items-center justify-center">
      <MotionSurface
        as="nav"
        spacing="none"
        className={cx(
          'text-primary-contrast tablet-portrait:gap-4 sticky top-4 flex max-w-5xl items-center justify-between gap-2 rounded-full bg-[oklch(20%_0.3_260/0.8)] px-6 py-2 backdrop-blur-sm',
        )}
        elevation="high"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        noContainer
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
        <ul className="tablet:flex tablet-portrait:gap-10 hidden items-center gap-4">
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
        <div className="tablet:flex hidden items-center gap-6">
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

          <motion.div variants={itemVariants}>
            <SyncStatusIndicator />
          </motion.div>

          <motion.div variants={itemVariants}>
            <UserMenu />
          </motion.div>
        </div>

        <div className="tablet:hidden">
          <MobileNavDrawer />
        </div>
      </MotionSurface>
    </div>
  );
}
