'use client';

import { motion } from 'motion/react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UrlObject } from 'url';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { cx } from '~/utils/cva';
import UserMenu from './UserMenu';

const NavButton = ({
  label,
  href,
  isActive = false,
}: {
  label: string;
  href: UrlObject | Route;
  isActive?: boolean;
}) => {
  return (
    <motion.li layout className="relative flex flex-col justify-start">
      <Link
        href={href}
        className={cx('font-semibold', !isActive && 'hover:text-link')}
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
    <>
      <html className="mt-24" />
      <Surface
        as="nav"
        spacing="none"
        elevation="none"
        className="bg-primary text-primary-contrast elevation-high @container-normal fixed top-2 left-1/2 flex -translate-x-1/2 items-center justify-between gap-4 rounded-full px-6 py-4 backdrop-blur-sm"
      >
        <Link href="/" className="flex items-center space-x-2">
          <Heading
            level="h3"
            className="tablet:block mx-4 hidden font-extrabold"
            margin="none"
          >
            Fresco
          </Heading>
        </Link>
        <ul className="flex items-center gap-10">
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
          <NavButton
            label="Settings"
            href="/dashboard/settings"
            isActive={pathname === '/dashboard/settings'}
          />
        </ul>
        <UserMenu />
      </Surface>
    </>
  );
}
