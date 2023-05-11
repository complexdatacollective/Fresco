"use client";

import { Disclosure } from "@headlessui/react";
import Image from "next/image";
import { Menu as MenuIcon, X } from "lucide-react";
import classNames from "~/utils/classnames";
import UserMenu from "./UserMenu";
import Link from "next/link";
import LanguageMenu from "./LanguageMenu";

const navigation = [
  { name: "Home", href: "/", current: true },
  { name: "Protected Server Route", href: "/protected/server", current: false },
  { name: "Protected Client Route", href: "/protected/client", current: false },
  { name: "Protected Api endpoint", href: "/api/users", current: false },
  { name: "Admin only area", href: "/admin", current: false },
];

const NavigationButton = ({
  text,
  link,
  active = false,
  block = false,
}: {
  text: string;
  link: string;
  active?: boolean;
  block?: boolean;
}) => {
  return (
    <Link
      href={link}
      className={classNames(
        block ? "block" : "inline-block",
        active
          ? "bg-emerald-400 text-white hover:bg-emerald-500"
          : "text-gray-300 hover:bg-opacity-10  hover:text-white",
        "rounded-md px-3 py-2 font-medium"
      )}
      aria-current={active ? "page" : undefined}
    >
      {text}
    </Link>
  );
};

const NavigationBar = () => {
  return (
    <Disclosure as="nav" className="bg-violet-800">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Image
                    src="/images/NC-Mark@4x.png"
                    alt="Fresco"
                    width={60}
                    height={60}
                  />
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {navigation.map((item) => (
                      <NavigationButton
                        key={item.name}
                        text={item.name}
                        link={item.href}
                        active={item.current}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="-mr-2 flex md:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <UserMenu />
              <LanguageMenu />
            </div>
          </div>
          <Disclosure.Panel className="md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
              {navigation.map((item) => (
                <NavigationButton
                  key={item.name}
                  text={item.name}
                  link={item.href}
                  active={item.current}
                  block
                />
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default NavigationBar;
