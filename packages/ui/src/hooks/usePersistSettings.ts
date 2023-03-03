import { useEffect, useState } from 'react';

const GLOBAL_PREFIX = 'NetworkCanvas'; // We use this to avoid collisions, but could also be used to version settings?

type SettingsState = {
  [key: string]: unknown,
};

const usePersistSettings = ({ prefix = 'settings', instanceId }: { prefix: string, instanceId: string }) => {
  const [settings, setSettings] = useState<SettingsState>({});

  if (!instanceId) {
    throw new Error('Instance ID is required to persist settings!');
  }

  const key = `${GLOBAL_PREFIX}:${prefix}:${instanceId}`;

  // Fetch initial value, if it exists
  useEffect(() => {
    const persistedSettings = localStorage.getItem(key);
    if (persistedSettings) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setSettings(JSON.parse(persistedSettings));
    }
  }, [key]);

  // Attach event listener to update when local storage changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        if (!event.newValue) {
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        setSettings(JSON.parse(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  const updateSettings = (newSettings: SettingsState) => {
    const currentSettingsString = JSON.stringify(settings);
    const newSettingsString = JSON.stringify(newSettings);
    localStorage.setItem(key, newSettingsString);

    // Because 'storage' events are only emitted across tabs, we have
    // to create our own fake one.
    const event = new StorageEvent('storage', {
      key,
      newValue: currentSettingsString,
      oldValue: newSettingsString,
    });

    window.dispatchEvent(event);
  };

  return [settings, updateSettings];
};

export default usePersistSettings;
