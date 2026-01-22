'use client';

import { Menu, Settings, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { UrlObject } from 'url';
import { logout } from '~/actions/auth';
import Modal from '~/components/Modal/Modal';
import ModalPopup from '~/components/Modal/ModalPopup';
import SubmitButton from '~/components/ui/SubmitButton';
import { cx } from '~/utils/cva';

type NavItem = {
  label: string;
  href: UrlObject | Route;
  icon?: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Protocols', href: '/dashboard/protocols' },
  { label: 'Participants', href: '/dashboard/participants' },
  { label: 'Interviews', href: '/dashboard/interviews' },
];

const MobileNavLink = ({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cx(
        'focusable flex min-h-[44px] items-center gap-3 rounded-lg px-4 py-3 text-lg font-semibold transition-colors',
        isActive
          ? 'bg-sea-green/20 text-sea-green'
          : 'hover:bg-surface-1-contrast/10',
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  );
};

export function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const handleClose = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="focusable rounded-lg p-2 hover:bg-white/10"
      >
        <Menu className="h-6 w-6" />
      </button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalPopup
          className={cx(
            'fixed top-0 right-0 h-full w-80 max-w-[85vw]',
            'bg-surface-1 text-surface-1-contrast shadow-xl',
          )}
          initial={{ x: '100%', opacity: 0.99 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0.99 }}
          transition={{ type: 'tween', duration: 0.3 }}
        >
          <nav aria-label="Mobile navigation" className="flex h-full flex-col">
            <div className="border-surface-1-contrast/10 flex items-center justify-end border-b p-4">
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close navigation menu"
                className="focusable hover:bg-surface-1-contrast/10 rounded-lg p-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <motion.ul className="flex flex-1 flex-col gap-1 p-4">
              {navItems.map((item) => (
                <li key={item.label}>
                  <MobileNavLink
                    item={item}
                    isActive={pathname === item.href}
                    onClick={handleClose}
                  />
                </li>
              ))}

              <li className="border-surface-1-contrast/10 my-2 border-t" />

              <li>
                <MobileNavLink
                  item={{
                    label: 'Settings',
                    href: '/dashboard/settings',
                    icon: <Settings className="h-5 w-5" />,
                  }}
                  isActive={pathname === '/dashboard/settings'}
                  onClick={handleClose}
                />
              </li>
            </motion.ul>

            <div className="border-surface-1-contrast/10 border-t p-4">
              <form action={() => void logout()}>
                <SubmitButton
                  color="secondary"
                  type="submit"
                  className="w-full"
                >
                  Sign out
                </SubmitButton>
              </form>
            </div>
          </nav>
        </ModalPopup>
      </Modal>
    </>
  );
}
