'use client';

import type { UrlObject } from 'url';

import { Settings } from 'lucide-react';
import { motion, type Variants } from 'motion/react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { defineMessages } from '@codaco/app-i18n/messages';
import { useAppIntl } from '@codaco/app-i18n/react';
import { MotionSurface } from '@codaco/fresco-ui/layout/Surface';
import Spinner from '@codaco/fresco-ui/Spinner';
import Heading from '@codaco/fresco-ui/typography/Heading';
import { cx } from '@codaco/fresco-ui/utils/cva';
import FrescoLocaleSwitcher from '~/i18n/FrescoLocaleSwitcher';

import { MobileNavDrawer } from './MobileNavDrawer';
import UserMenu from './UserMenu';

const messages = defineMessages({
  brand: {
    id: 'fresco.navigation.brand',
    defaultMessage: 'Fresco',
    description: 'Product name. Keep Fresco unchanged in all languages.',
  },

  dashboard: {
    id: 'fresco.NavigationBar.dashboard',
    defaultMessage: 'Dashboard',
    description: 'Researcher-facing NavigationBar: Dashboard',
  },
  protocols: {
    id: 'fresco.NavigationBar.protocols',
    defaultMessage: 'Protocols',
    description: 'Researcher-facing NavigationBar: Protocols',
  },
  participants: {
    id: 'fresco.NavigationBar.participants',
    defaultMessage: 'Participants',
    description: 'Researcher-facing NavigationBar: Participants',
  },
  interviews: {
    id: 'fresco.NavigationBar.interviews',
    defaultMessage: 'Interviews',
    description: 'Researcher-facing NavigationBar: Interviews',
  },
  settings: {
    id: 'fresco.NavigationBar.settings',
    defaultMessage: 'Settings',
    description: 'Researcher-facing NavigationBar: Settings',
  },
});

const containerVariants: Variants = {
  hidden: {
    y: '-150%',
  },
  visible: {
    y: 0,
    transition: {
      type: 'spring',
      delayChildren: 0.5,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: '-100%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
    },
  },
};

const navItemClassName =
  'focusable relative rounded-full font-semibold whitespace-nowrap outline-offset-10!';

const NavButton = ({
  label,
  href,
  isActive = false,
}: {
  label: string | React.ReactNode;
  href: UrlObject | Route;
  isActive?: boolean;
}) => {
  return (
    <motion.li
      layout
      variants={itemVariants}
      className="relative flex flex-col justify-start"
    >
      <Link
        href={href}
        className={cx(navItemClassName, !isActive && 'hover:text-sea-green')}
      >
        {isActive && (
          <motion.div
            layoutId="active-outline"
            className="absolute -inset-x-4 -inset-y-2 rounded-full ring-2 ring-current/20"
          />
        )}
        <span className="relative">{label}</span>
      </Link>
    </motion.li>
  );
};

export function NavigationBar() {
  const intl = useAppIntl();

  const pathname = usePathname();

  return (
    <div className="sticky top-4 z-50 flex items-center justify-center">
      <MotionSurface
        as="nav"
        spacing="none"
        className={cx(
          'text-primary-contrast tablet-portrait:gap-4 bg-primary sticky top-4 flex max-w-5xl grow items-center justify-between gap-2 overflow-visible rounded-full px-6 py-2 shadow-lg shadow-black/25 backdrop-blur-sm',
        )}
        variants={containerVariants}
        // Preference-independent on purpose. motion resolves `initial` into an
        // inline style in the server markup, and the server cannot know this
        // visitor's preference (`useReducedMotion()` answers `null` there and
        // `true`/`false` on the client), so choosing any of these props by the
        // preference would make the bar a hydration mismatch for a researcher
        // who prefers reduced motion.
        //
        // The app-root `<MotionConfig reducedMotion="user">` honours the
        // preference instead: `containerVariants` only moves `y`, a transform
        // key, so under the preference motion gives it `type: false` and the
        // bar arrives in place without travelling.
        initial="hidden"
        animate="visible"
        noContainer
      >
        <Link href="/" className="focusable flex items-center gap-2 rounded-sm">
          <Spinner size="sm" animationMode="hover" playOnMount />
          <Heading
            level="h4"
            className="laptop:block hidden font-extrabold"
            margin="none"
          >
            {intl.formatMessage(messages.brand)}
          </Heading>
        </Link>
        <ul className="tablet-landscape:flex tablet-portrait:gap-10 hidden items-center gap-4">
          <NavButton
            href="/dashboard"
            isActive={pathname === '/dashboard'}
            label={intl.formatMessage(messages.dashboard)}
          />
          <NavButton
            label={intl.formatMessage(messages.protocols)}
            href="/dashboard/protocols"
            isActive={pathname === '/dashboard/protocols'}
          />
          <NavButton
            label={intl.formatMessage(messages.participants)}
            href="/dashboard/participants"
            isActive={pathname === '/dashboard/participants'}
          />
          <NavButton
            label={intl.formatMessage(messages.interviews)}
            href="/dashboard/interviews"
            isActive={pathname === '/dashboard/interviews'}
          />
        </ul>
        <div className="tablet-landscape:gap-6 flex items-center gap-2">
          <div className="tablet-landscape:flex hidden">
            <NavButton
              label={
                <div className="flex items-center gap-2">
                  <Settings className="inline-block" />
                  <span className="laptop:inline hidden">
                    {intl.formatMessage(messages.settings)}
                  </span>
                </div>
              }
              href="/dashboard/settings"
              isActive={pathname === '/dashboard/settings'}
            />
          </div>

          <motion.div
            variants={itemVariants}
            className="tablet-landscape:flex hidden"
          >
            <FrescoLocaleSwitcher
              renderTrigger={
                // Named by the switcher, which sets the language on it at runtime.
                // oxlint-disable-next-line jsx-a11y/control-has-associated-label
                <button
                  type="button"
                  className={cx(
                    navItemClassName,
                    'hover:text-sea-green data-popup-open:text-sea-green flex cursor-pointer items-center',
                  )}
                />
              }
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="tablet-landscape:block hidden"
          >
            <UserMenu />
          </motion.div>

          <div className="tablet-landscape:hidden">
            <MobileNavDrawer />
          </div>
        </div>
      </MotionSurface>
    </div>
  );
}
