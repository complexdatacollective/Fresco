"use client";

import classNames from "classnames";
import { Menu } from "@headlessui/react";

const userNavigation = [
  { name: "English", href: "/en" },
  { name: "Spanish", href: "/es" },
];

const LanguageMenu = () => {

  return (
    <div className="user-menu">
      {/* Language dropdown */}
      <Menu as="div" className="relative ml-3">
        <div>
          <Menu.Button className="flex max-w-xs items-center rounded-full text-sm text-gray-300">
            <span>Language 🌐</span>
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

export default LanguageMenu;
