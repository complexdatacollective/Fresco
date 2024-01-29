'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '~/utils/shadcn';
import UserMenu from './UserMenu';
import type { UrlObject } from 'url';
import type { Route } from 'next';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/Button';

export const NavButton = ({
  children,
  href,
  isActive = false,
}: {
  children: React.ReactNode;
  href: UrlObject | Route;
  isActive?: boolean;
}) => {
  return (
    <Link
      href={href}
      className={cn(isActive ? 'text-accent' : 'text-primary-foreground')}
    >
      <Button variant="ghost">{children}</Button>
    </Link>
  );
};

export function NavigationBar() {
  const pathname = usePathname();

  return (
    <motion.nav className="bg-violet-700 flex items-center justify-between gap-4 px-4 py-2">
      <Link href="/" className="flex items-center space-x-2">
        <Image
          src="/images/NC-Mark@4x.png"
          alt="Fresco"
          width={40}
          height={40}
        />
      </Link>
      <NavButton href="/dashboard" isActive={pathname === '/dashboard'}>
        Home
      </NavButton>
      <NavButton
        href="/dashboard/protocols"
        isActive={pathname === '/dashboard/protocols'}
      >
        Protocols
      </NavButton>
      <NavButton
        href="/dashboard/interviews"
        isActive={pathname === '/dashboard/interviews'}
      >
        Interviews
      </NavButton>
      <NavButton
        href="/dashboard/participants"
        isActive={pathname === '/dashboard/participants'}
      >
        Participants
      </NavButton>
      <UserMenu />
    </motion.nav>
  );
}
