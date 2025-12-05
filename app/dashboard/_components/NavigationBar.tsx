'use client';

import { motion } from 'motion/react';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UrlObject } from 'url';
import Heading from '~/components/typography/Heading';
import { env } from '~/env';
import { cn } from '~/utils/shadcn';
import UserMenu from './UserMenu';

const NavButton = ({
  label,
  href,
  isActive = false,
  disabled = false,
}: {
  label: string;
  href: UrlObject | Route;
  isActive?: boolean;
  disabled?: boolean;
}) => {
  if (disabled) {
    return (
      <motion.li layout className="relative flex flex-col justify-start">
        <span className="cursor-not-allowed text-sm font-semibold text-white/40">
          {label}
        </span>
      </motion.li>
    );
  }

  return (
    <motion.li layout className="relative flex flex-col justify-start">
      <Link
        href={href}
        className={cn(
          'text-primary-foreground text-sm font-semibold',
          !isActive && 'hover:text-sea-green',
        )}
      >
        {label}
      </Link>
      {isActive && (
        <motion.div
          layoutId="underline"
          className="bg-primary-foreground absolute top-[105%] right-0 left-0 h-0.5 rounded-full"
        />
      )}
    </motion.li>
  );
};

export function NavigationBar({ previewMode }: { previewMode: boolean }) {
  const pathname = usePathname();

  return (
    <motion.nav className="bg-cyber-grape flex items-center justify-between gap-4 px-4 py-3">
      <Link href="/" className="flex items-center space-x-2">
        <Image src="/favicon.png" alt="Fresco" width={50} height={50} />
        <Heading variant="h3" className="hidden text-white lg:block">
          Fresco
          <sup className="align-super text-xs">{env.APP_VERSION}</sup>
        </Heading>
      </Link>
      <ul className="flex items-center gap-10">
        <NavButton
          href="/dashboard"
          isActive={pathname === '/dashboard'}
          label="Dashboard"
          disabled={previewMode}
        />
        <NavButton
          label="Protocols"
          href="/dashboard/protocols"
          isActive={pathname === '/dashboard/protocols'}
          disabled={previewMode}
        />
        <NavButton
          label="Participants"
          href="/dashboard/participants"
          isActive={pathname === '/dashboard/participants'}
          disabled={previewMode}
        />
        <NavButton
          label="Interviews"
          href="/dashboard/interviews"
          isActive={pathname === '/dashboard/interviews'}
          disabled={previewMode}
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
