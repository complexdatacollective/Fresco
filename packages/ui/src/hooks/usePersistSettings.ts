import { useEffect, useState } from "react";

const GLOBAL_PREFIX = "NetworkCanvas"; // We use this to avoid collisions, but could also be used to version settings?

const usePersistSettings = ({ prefix = "settings", instanceId }) => {
  const [settings, setSettings] = useState({});

  if (!instanceId) {
    throw new Error("Instance ID is required to persist settings!");
  }

  const key = `${GLOBAL_PREFIX}:${prefix}:${instanceId}`;

  // Fetch initial value, if it exists
  useEffect(() => {
    const persistedSettings = localStorage.getItem(key);
    if (persistedSettings) {
      setSettings(JSON.parse(persistedSettings));
    }
  }, [key]);

  // Attach event listener to update when local storage changes
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key) {
        setSettings(JSON.parse(event.newValue));
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);

  const updateSettings = (newSettings) => {
    const currentSettingsString = JSON.stringify(settings);
    const newSettingsString = JSON.stringify(newSettings);
    localStorage.setItem(key, newSettingsString);

    // Because 'storage' events are only emitted across tabs, we have
    // to create our own fake one.
    const event = new StorageEvent("storage", {
      key,
      newValue: currentSettingsString,
      oldValue: newSettingsString
    });

    window.dispatchEvent(event);
  };

  return [settings, updateSettings];
};

export default usePersistSettings;
