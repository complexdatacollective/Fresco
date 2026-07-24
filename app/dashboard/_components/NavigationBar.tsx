'use client';

import { Settings } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UrlObject } from 'url';
import { MotionSurface } from '@codaco/fresco-ui/layout/Surface';
import Heading from '@codaco/fresco-ui/typography/Heading';
import Spinner from '@codaco/fresco-ui/Spinner';
import { cx } from '@codaco/fresco-ui/utils/cva';
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
            className="absolute -inset-x-4 -inset-y-2 rounded-full ring-2 ring-current/20"
          />
        )}
        <span className="relative">{label}</span>
      </Link>
    </motion.li>
  );
};

export function NavigationBar() {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="sticky top-4 z-50 flex items-center justify-center">
      <MotionSurface
        as="nav"
        spacing="none"
        className={cx(
          'text-primary-contrast tablet-portrait:gap-4 bg-primary sticky top-4 flex max-w-5xl grow items-center justify-between gap-2 overflow-visible rounded-full px-6 py-2 shadow-lg shadow-black/25 backdrop-blur-sm',
        )}
        variants={containerVariants}
        initial={shouldReduceMotion ? false : 'hidden'}
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
        <ul className="tablet-landscape:flex tablet-portrait:gap-10 hidden items-center gap-4">
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
        <div className="tablet-landscape:flex hidden items-center gap-6">
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
            <UserMenu />
          </motion.div>
        </div>

        <div className="tablet-landscape:hidden">
          <MobileNavDrawer />
        </div>
      </MotionSurface>
    </div>
  );
}
