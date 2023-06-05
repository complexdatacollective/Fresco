"use client";

import classNames from "classnames";
import { Menu } from "@headlessui/react";

const userNavigation = [
  { name: "English (UK)", icon: "🇬🇧", href: "/en" },
  { name: "English (US)", icon: "🇺🇸", href: "/en" },
  { name: "Español", icon: "🇪🇸", href: "/es" },
];

const LanguagePicker = () => {
  return (
    <div className="user-menu">
      {/* Language dropdown */}
      <Menu as="div" className="relative ml-3">
        <div>
          <Menu.Button className="flex max-w-xs items-center rounded-full text-lg text-gray-300">
            <span>🌐</span>
          </Menu.Button>
        </div>
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {userNavigation.map((item) => (
            <Menu.Item key={item.name}>
              {({ active }) => (
                <a
                  href={item.href}
                  className={classNames(
                    active ? "bg-gray-100" : "",
                    "block px-4 py-2 text-sm text-gray-700"
                  )}
                >
                  <span className="mr-2 inline-block">{item.icon}</span>
                  {item.name}
                </a>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Menu>
    </div>
  );
};

export default LanguagePicker;
