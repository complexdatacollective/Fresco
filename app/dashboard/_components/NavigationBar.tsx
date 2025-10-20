'use client';

import { motion } from 'motion/react';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UrlObject } from 'url';
import Heading from '~/components/typography/Heading';
import { env } from '~/env';
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
        className={cx(
          'text-primary-contrast text-base font-semibold',
          !isActive && 'hover:text-sea-green',
        )}
      >
        {label}
      </Link>
      {isActive && (
        <motion.div
          layoutId="underline"
          className="bg-primary-contrast absolute top-[105%] right-0 left-0 h-[2px] rounded-full"
        />
      )}
    </motion.li>
  );
};

export function NavigationBar() {
  const pathname = usePathname();

  return (
    <motion.nav className="bg-primary text-primary-contrast flex items-center justify-between gap-4 px-4 py-3">
      <Link href="/" className="flex items-center space-x-2">
        <Image src="/favicon.png" alt="Fresco" width={50} height={50} />
        <Heading
          level="h3"
          className="text-primary-contrast desktop:block hidden"
        >
          Fresco
          <sup className="align-super text-xs">{env.APP_VERSION}</sup>
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
    </motion.nav>
  );
}
