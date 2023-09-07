'use client';

import { signOut } from 'next-auth/react';
import Link from '~/components/Link';
import Image from 'next/image';
import Beam from '~/public/images/beam.svg';

const UserMenu = () => {
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="user-menu">
      <Image
        src={Beam}
        alt="Beam"
        width={60}
        height={60}
        className="h-12 w-12 rounded-full"
      />
      <Link
        onClick={() => void handleSignOut}
        href="/api/next-auth/signout"
        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
      >
        Sign out
      </Link>
    </div>
  );
};

export default UserMenu;
