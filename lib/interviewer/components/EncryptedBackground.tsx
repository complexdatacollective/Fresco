import { useEffect, useState } from 'react';

type Stream = {
  id: number;
  word: string;
  x: number;
  y: number;
  speed: number;
  encrypted: boolean;
  letters: {
    original: string;
    current: string;
    target: string;
    isScrambling: boolean;
    scrambleCount: number;
    maxScrambles: number;
  }[];
};

const names = [
  'Emma',
  'James',
  'Sofia',
  'Michael',
  'Olivia',
  'Lucas',
  'Ava',
  'Noah',
  'Isabella',
  'Ethan',
  'Mia',
  'Alexander',
  'Charlotte',
  'Benjamin',
  'Sophia',
  'William',
  'Luna',
  'Oliver',
  'Aria',
  'Liam',
  'Elena',
  'Adrian',
  'Maya',
  'Gabriel',
  'Zara',
  'Nathan',
  'Alice',
  'Daniel',
  'Ruby',
  'David',
  'Sarah',
  'Marcus',
  'Nina',
  'Thomas',
  'Lily',
  'Felix',
  'Hannah',
  'Leo',
  'Julia',
  'Oscar',
  'Diana',
  'Henry',
  'Clara',
  'Samuel',
  'Eva',
  'Isaac',
  'Anna',
  'Xavier',
  'Stella',
  'Jackson',
  'Nora',
  'Sebastian',
  'Chloe',
  'Max',
  'Violet',
  'Owen',
  'Audrey',
  'Felix',
  'Rose',
  'Theodore',
  'Hazel',
  'Atlas',
  'Iris',
  'River',
  'Jade',
  'Kai',
  'Nova',
  'August',
  'Eden',
  'Phoenix',
  'Ivy',
  'Atlas',
  'Winter',
  'Sky',
  'Sage',
  'Joshua',
  'Katelyn',
  'Michelle',
  'Patrick',
  'Bernie',
  'Gregory',
  'Sarietha',
  'Caden',
];

const encryptionChars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*';

const getRandomChar = (): string => {
  return encryptionChars[Math.floor(Math.random() * encryptionChars.length)]!;
};

const createStream = (yPosition = -20) => {
  const name = names[Math.floor(Math.random() * names.length)]!;
  return {
    id: Math.random(),
    word: name,
    x: Math.random() * 100,
    y: yPosition,
    speed: 0.1 + Math.random() * 0.2,
    encrypted: false,
    letters: Array.from(name).map((letter) => ({
      original: letter,
      current: letter,
      target: '',
      isScrambling: false,
      scrambleCount: 0,
      maxScrambles: 5 + Math.floor(Math.random() * 5),
    })),
  };
};

const EncryptionBackground = () => {
  const [streams, setStreams] = useState<Stream[]>([]);

  useEffect(() => {
    const initialStreams = Array.from({ length: 40 }, (_, index) =>
      createStream(index * 6),
    );
    setStreams(initialStreams);

    const interval = setInterval(() => {
      setStreams((currentStreams) => {
        return currentStreams.map((stream) => {
          const newY = stream.y + stream.speed;

          if (newY > 120) {
            return createStream();
          }

          const shouldStartEncrypt = Math.random() < 0.01;
          const shouldStartDecrypt = Math.random() < 0.01;

          const newLetters = stream.letters.map((letterState) => {
            if (
              shouldStartEncrypt &&
              !stream.encrypted &&
              !letterState.isScrambling
            ) {
              return {
                ...letterState,
                isScrambling: true,
                scrambleCount: 0,
                target: getRandomChar(),
              };
            }
            if (
              shouldStartDecrypt &&
              stream.encrypted &&
              !letterState.isScrambling
            ) {
              return {
                ...letterState,
                isScrambling: true,
                scrambleCount: 0,
                target: letterState.original,
              };
            }
            if (letterState.isScrambling) {
              const newScrambleCount = letterState.scrambleCount + 1;
              if (newScrambleCount >= letterState.maxScrambles) {
                return {
                  ...letterState,
                  current: letterState.target,
                  isScrambling: false,
                };
              }
              return {
                ...letterState,
                current: getRandomChar(),
                scrambleCount: newScrambleCount,
              };
            }
            return letterState;
          });

          const isNowEncrypted = newLetters.every(
            (l) => !l.isScrambling && l.current !== l.original,
          );

          return {
            ...stream,
            y: newY,
            encrypted: isNowEncrypted,
            letters: newLetters,
          };
        });
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none h-full w-full overflow-hidden text-white/30 select-none">
      {streams.map((stream) => (
        <div
          key={stream.id}
          className="absolute font-mono whitespace-nowrap transition-all duration-300"
          style={{
            left: `${stream.x}%`,
            top: `${stream.y}%`,
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, Math.min(1, (100 - stream.y) / 50)),
          }}
        >
          {stream.letters.map((letterState, index) => (
            <span key={index} className="inline-block">
              {letterState.current}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

export default EncryptionBackground;
