'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '~/utils/shadcn';
import UserMenu from './UserMenu';
import type { UrlObject } from 'url';
import type { Route } from 'next';
import { UserButton } from '@clerk/nextjs';

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
      className={cn(
        'font-medium underline-offset-4 transition-colors hover:text-primary hover:underline',
        isActive ? 'text-foreground' : 'text-foreground/60',
      )}
    >
      {children}
    </Link>
  );
};

export function NavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-between bg-[#e5e7eb] px-4 py-2">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <Image
          src="/images/NC-Mark@4x.png"
          alt="Fresco"
          width={60}
          height={60}
        />
        <span className="hidden font-bold sm:inline-block">
          Network Canvas Fresco
        </span>
      </Link>
      <div className="flex items-center space-x-6">
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
      </div>
      <UserButton />
    </nav>
  );
}
