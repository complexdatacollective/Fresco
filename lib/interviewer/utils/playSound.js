import { debounce } from 'es-toolkit';

// Play a given sound
export const playSound = ({
  src,
  loop = false,
  volume = 1,
  debounceInterval = 0,
}) => {
  if (!src) {
    throw new Error('No sound source provided');
  }

  let audio;

  const debouncedPlay = debounce(
    () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      audio = new Audio(src);
      audio.volume = volume;
      audio.loop = loop;
      audio.play();
    },
    debounceInterval,
    { edges: ['leading'] },
  );

  const stop = () => {
    if (!audio) {
      return;
    }
    audio.pause();
    audio.currentTime = 0;
  };

  return {
    play: debouncedPlay,
    stop,
  };
};
