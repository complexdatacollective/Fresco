'use client';

import classNames from 'classnames';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Button from '~/ui/components/Button';

const userNavigation = [
  { name: 'Your Profile', href: '#' },
  { name: 'Settings', href: '#' },
];

const UserMenu = () => {
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    await signOut();
  };

  if (!session) {
    return (
      <div className="flex items-center">
        <Link
          href="/api/auth/signin"
          className="text-base font-medium text-gray-500 hover:text-gray-900"
        >
          Sign in
        </Link>
        <Link
          href="/api/auth/signup"
          className="ml-8 inline-flex items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-violet-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-violet-700"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="user-menu">
      {/* Profile dropdown */}
      <Menu as="div" className="relative ml-3">
        <div>
          <Menu.Button className="flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
            <span className="sr-only">Open user menu</span>
            <img
              className="h-10 w-10 rounded-full"
              src="https://source.boringavatars.com/beam"
              alt=""
            />
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {userNavigation.map((item) => (
              <Menu.Item key={item.name}>
                {({ active }) => (
                  <a
                    href={item.href}
                    className={classNames(
                      active ? 'bg-gray-100' : '',
                      'block px-4 py-2 text-sm text-gray-700',
                    )}
                  >
                    {item.name}
                  </a>
                )}
              </Menu.Item>
            ))}
            <Menu.Item>
              <Button onClick={handleSignOut}>Sign Out</Button>
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};

export default UserMenu;
