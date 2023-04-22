import { noop } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import useIsMounted from './useIsMounted';

// Used when we bail out of the hook to provide a consistent surface for consumers.
const noopReturnValues = {
  speak: noop,
  stop: noop,
  error: null,
  isSpeaking: false,
};

/**
 * Hook for text-to-speech.
 *
 * Will eventually be replaced by Google's TTS cloud system. Just a fun experiment
 * for now.
 */
const useSpeech = (text, lang = window.navigator.language) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useIsMounted();

  // No text means nothing to do.
  if (!text) {
    return noopReturnValues;
  }

  // Speech synthesis API isn't supported on Android: https://bugs.chromium.org/p/chromium/issues/detail?id=487255
  if (!('speechSynthesis' in window)) {
    return {
      ...noopReturnValues,
      error: 'Speech API not supported',
    };
  }

  const voices = useMemo(() => speechSynthesis.getVoices(), []);

  // Find the first speech synthesis voice available for our current language.
  // The first voice may not always be the best, so this could be improved.
  const voiceForLanguage = useMemo(() => voices.find(
    // iOS/macOS seem to lower-case navigator.language (which is the default language)
    (voice) => voice.lang.toLowerCase() === lang.toLowerCase(),
  ), [lang]);

  const speak = () => {
    if (error) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // For iOS we must set both voice and language together
    utterance.lang = lang;
    utterance.voice = voiceForLanguage;

    // `onstart` takes < 1s to begin talking on Chrome, but is instantaneous
    // on FF and Safari.
    // it might be better to have a 'starting' state that updates immediately
    // and can be used by the consumer to render feedback for the user.
    utterance.onstart = () => isMounted() && setIsSpeaking(true);
    utterance.onend = () => isMounted() && setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (error) { return; }
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  useEffect(
    () => {
      if (!voiceForLanguage) {
        setError(`No voice available for language "${lang}". Cannot speak!`);
      }

      return () => {
        stop();
      };
    },
    [voiceForLanguage],
  );

  return {
    speak, stop, isSpeaking, error,
  };
};

export default useSpeech;
