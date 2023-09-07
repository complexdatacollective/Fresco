'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '~/utils';
import UserMenu from './UserMenu';

const NavButton = ({
  children,
  href,
  isActive,
}: {
  children: React.ReactNode;
  href: string;
  isActive: boolean;
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
    <nav className="flex justify-between p-10">
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
        <NavButton href="/" isActive={pathname === '/'}>
          Home
        </NavButton>
        <NavButton href="/protocols" isActive={pathname === '/protocols'}>
          Protocols
        </NavButton>
        <NavButton href="/interviews" isActive={pathname === '/interviews'}>
          Interviews
        </NavButton>
        <NavButton href="/participants" isActive={pathname === '/participants'}>
          Participants
        </NavButton>
      </div>
      <UserMenu />
    </nav>
  );
}
