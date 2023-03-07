import React, { PropsWithChildren, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import cx from 'classnames';
import './styles/main.scss';
import {
  isElectron, isWindows, isMacOS, isLinux, isPreview, getEnv, isIOS, isAndroid,
} from '@/utils/Environment';
import DialogManager from '@/components/DialogManager';
import ToastManager from '@/components/ToastManager';
import { SettingsMenu } from '@/components/SettingsMenu';
import useUpdater from '@/hooks/useUpdater';
import { ipcLink } from 'electron-trpc/renderer'
import superjson from 'superjson';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getFetch, httpBatchLink, loggerLink } from '@trpc/react-query';
import { trpcReact } from './utils/trpc/trpc';
import FetchingIndicator from './FetchingIndicator';

const list = {
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
    },
  },
  hidden: {
    opacity: 0,
  },
};

const App = ({
  children,
}: PropsWithChildren) => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // https://react-query.tanstack.com/guides/window-focus-refetching
        // Should set to true for web but false for Electron.
        // This is because on Electron we know the data won't have changed
        // when we weren't looking!
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [trpcClient] = useState(() => {

    // Electron
    // return trpcReact.createClient({
    //   transformer: superjson,
    //   links: [loggerLink(), ipcLink()],
    // })

    // Browser
    return trpcReact.createClient({
      transformer: superjson,
      links: [
        loggerLink(),
        httpBatchLink({
          url: "http://localhost:3001/api/trpc", // TODO: get from env
          fetch: async (input, init?) => {
            const fetch = getFetch();
            return fetch(input, {
              ...init,
            });
          },
        }),
      ],
    })
  });

  const interfaceScale = useSelector(state => state.deviceSettings.interfaceScale);
  const useDynamicScaling = useSelector(state => state.deviceSettings.useDynamicScaling);

  const setFontSize = useCallback(() => {
    const root = document.documentElement;
    const newFontSize = useDynamicScaling
      ? `${(1.65 * interfaceScale) / 100}vmin`
      : `${(16 * interfaceScale) / 100}px`;

    root.style.setProperty('--base-font-size', newFontSize);
  }, [useDynamicScaling, interfaceScale]);

  useUpdater('https://api.github.com/repos/complexdatacollective/Interviewer/releases/latest', 2500);

  setFontSize();

  return (
    <trpcReact.Provider queryClient={queryClient} client={trpcClient}>
      <QueryClientProvider client={queryClient}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={list}
          className={cx({
            app: true,
            'app--electron': isElectron(),
            'app--windows': isWindows(),
            'app--macos': isMacOS(),
            'app--ios': isIOS(),
            'app-android': isAndroid(),
            'app--linux': isLinux(),
            'app--preview': isPreview(),
          })}
        >
          <div className="electron-titlebar" />
          <FetchingIndicator />
          <div
            id="page-wrap"
            className={cx({
              app__content: true,
            })}
          >
            <SettingsMenu />
            {children}
          </div>
          <DialogManager />
          <ToastManager />
        </motion.div>
      </QueryClientProvider>
    </trpcReact.Provider>
  );
};

App.propTypes = {
  children: PropTypes.any,
};

App.defaultProps = {
  children: null,
};

export default App;
