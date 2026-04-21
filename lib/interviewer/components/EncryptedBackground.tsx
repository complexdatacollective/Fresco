import isChromatic from 'chromatic/isChromatic';
import { useEffect, useRef, useState } from 'react';

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
  lastScrambleTime?: number;
};

const names = [
  // European Origin
  'Sofia',
  'Alexander',
  'Emma',
  'Lucas',
  'Isabella',
  'Henrik',
  'Svetlana',
  'Giuseppe',
  'Margot',
  'Klaus',

  // Middle Eastern & North African Origin
  'Fatima',
  'Omar',
  'Leila',
  'Hassan',
  'Zara',
  'Karim',
  'Noor',
  'Malik',
  'Yasmin',
  'Ibrahim',
  'فاطمة',
  'عمر',
  'نور',
  'ياسمين',

  // East Asian Origin
  'Wei',
  'Yuki',
  'Jin',
  'Mei',
  'Hiroshi',
  'Soo-jin',
  'Chen',
  'Akiko',
  'Xiaoping',
  'Hana',
  '美咲',
  '太郎',
  '서연',
  '민준',
  '伟明',
  '小芳',

  // South Asian Origin
  'Priya',
  'Arjun',
  'Anjali',
  'Rahul',
  'Divya',
  'Sanjay',
  'Lakshmi',
  'Kumar',
  'Zara',
  'Arun',
  'प्रिया',
  'अर्जुन',
  'অনিতা',
  'রাহুল',

  // African Origin
  'Amara',
  'Kwame',
  'Chioma',
  'Taiwo',
  'Zainab',
  'Kofi',
  'Aisha',
  'Jabari',
  'Folami',
  'Oluwaseun',
  'አማራ',
  'ዘይናብ',

  // Latin American & Hispanic Origin
  'Carmen',
  'Santiago',
  'Valentina',
  'Mateo',
  'Lucia',
  'Jorge',
  'Ana',
  'Rafael',
  'Camila',
  'Diego',

  // Indigenous & Native American Origin
  'Aiyana',
  'Kele',
  'Nizhoni',
  'Tokala',
  'Winona',
  'Dakota',
  'Nova',
  'Kai',
  'Halona',
  'Sequoia',

  // Pacific Islander Origin
  'Kalani',
  'Moana',
  'Tane',
  'Leilani',
  'Koa',
  'Maile',
  'Keanu',
  'Sina',
  'Teuila',
  'Akamu',

  // Mixed & Modern
  'Kai',
  'Zion',
  'River',
  'Nova',
  'Atlas',
  'Luna',
  'Sky',
  'Phoenix',
  'Eden',
  'Rain',

  // Other Scripts
  'Ελένη',
  'Νίκος',
  'สมชาย',
  'สุดา',
  'Նարե',
  'Արամ',
  'ნინო',
  'გიორგი',
  'Юрий',
  'Наташа',

  // Nordic & Celtic Origin
  'Astrid',
  'Bjorn',
  'Niamh',
  'Soren',
  'Freya',
  'Cian',
  'Ingrid',
  'Aoife',
  'Magnus',
  'Siobhan',

  // NC
  'Joshua',
  'Caden',
  'Kate',
  'Michelle',
  'Pat',
  'Gregory',
  'Bernie',
];

const encryptionChars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*';

const getRandomChar = (): string => {
  return encryptionChars[Math.floor(Math.random() * encryptionChars.length)]!;
};

const createStream = (yPosition = -20, thresholdPosition: number) => {
  const name = names[Math.floor(Math.random() * names.length)]!;
  const shouldBeEncrypted = yPosition > thresholdPosition;

  return {
    id: Math.random(),
    word: name,
    // random x position clamped between 20 and 80
    x: 10 + Math.random() * 90,
    y: yPosition,
    speed: 0.025 + Math.random() * 0.05,
    encrypted: shouldBeEncrypted,
    lastScrambleTime: 0,
    letters: Array.from(name).map((letter) => ({
      original: letter,
      current: shouldBeEncrypted ? getRandomChar() : letter,
      target: shouldBeEncrypted ? getRandomChar() : '',
      isScrambling: false,
      scrambleCount: 0,
      maxScrambles: 5 + Math.floor(Math.random() * 5),
    })),
  };
};

const createDeterministicStream = (
  index: number,
  streamCount: number,
  thresholdPosition: number,
): Stream => {
  const yPosition = -20 + (index * 120) / streamCount;
  const name = names[index % names.length]!;
  const shouldBeEncrypted = yPosition > thresholdPosition;

  return {
    id: index,
    word: name,
    x: 10 + ((index * 83) % 80),
    y: yPosition,
    speed: 0,
    encrypted: shouldBeEncrypted,
    lastScrambleTime: 0,
    letters: Array.from(name).map((letter, letterIndex) => ({
      original: letter,
      current: shouldBeEncrypted
        ? encryptionChars[(index + letterIndex) % encryptionChars.length]!
        : letter,
      target: '',
      isScrambling: false,
      scrambleCount: 0,
      maxScrambles: 0,
    })),
  };
};

type EncryptionBackgroundProps = {
  thresholdPosition: number;
};

const EncryptionBackground = ({
  thresholdPosition,
}: EncryptionBackgroundProps) => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const animationFrameRef = useRef<number>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);

  useEffect(() => {
    const streamCount = 40;

    if (isChromatic()) {
      setStreams(
        Array.from({ length: streamCount }, (_, index) =>
          createDeterministicStream(index, streamCount, thresholdPosition),
        ),
      );
      return;
    }

    const initialStreams = Array.from({ length: streamCount }, (_, index) =>
      createStream(-20 + (index * 120) / streamCount, thresholdPosition),
    );
    setStreams(initialStreams);

    const updateStreams = (currentTime: number) => {
      const timeDelta = currentTime - lastUpdateTimeRef.current;

      setStreams((currentStreams) =>
        currentStreams.map((stream) => {
          const newY = stream.y + (stream.speed * timeDelta) / 16;

          if (newY > 100) {
            return createStream(-20, thresholdPosition);
          }

          const shouldStartEncrypt =
            !stream.encrypted &&
            stream.y <= thresholdPosition &&
            newY > thresholdPosition;

          const shouldBeEncrypted = newY > thresholdPosition;

          const shouldUpdateScramble =
            currentTime - (stream.lastScrambleTime ?? 0) > 50;

          let newLetters = stream.letters;
          if (shouldUpdateScramble || shouldStartEncrypt) {
            newLetters = stream.letters.map((letterState) => {
              // Start encryption
              if (shouldStartEncrypt && !letterState.isScrambling) {
                return {
                  ...letterState,
                  isScrambling: true,
                  scrambleCount: 0,
                  target: getRandomChar(),
                };
              }
              // Continue scrambling
              if (letterState.isScrambling && shouldUpdateScramble) {
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
              // Force encryption state if below threshold
              if (
                shouldBeEncrypted &&
                !letterState.isScrambling &&
                letterState.current === letterState.original
              ) {
                return {
                  ...letterState,
                  current: getRandomChar(),
                  target: getRandomChar(),
                };
              }
              return letterState;
            });
          }

          const isNowEncrypted =
            shouldBeEncrypted ||
            newLetters.every(
              (l) => !l.isScrambling && l.current !== l.original,
            );

          return {
            ...stream,
            y: newY,
            encrypted: isNowEncrypted,
            letters: newLetters,
            lastScrambleTime: shouldUpdateScramble
              ? currentTime
              : stream.lastScrambleTime,
          };
        }),
      );

      lastUpdateTimeRef.current = currentTime;
      animationFrameRef.current = requestAnimationFrame(updateStreams);
    };

    lastUpdateTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(updateStreams);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [thresholdPosition]);

  return (
    <div
      className="preserve-3d pointer-events-none absolute inset-0 size-full overflow-hidden text-white/60 select-none"
      style={{ perspective: '1000px' }}
    >
      {streams.map((stream) => (
        <div
          key={stream.id}
          className="absolute font-mono whitespace-nowrap transition-colors duration-300 will-change-transform"
          style={{
            transform: `translate3d(${stream.x}vw, ${stream.y}vh, 0)`,
            opacity: Math.max(0, Math.min(1, (100 - stream.y) / 50)),
            color: stream.encrypted ? 'oklch(var(--sea-green))' : undefined,
          }}
        >
          {stream.letters.map((letterState, index) => (
            <span
              key={index}
              className="inline-block transition-colors duration-300"
              style={{
                color: letterState.isScrambling
                  ? 'rgb(255, 255, 180, 0.5)'
                  : undefined,
              }}
            >
              {letterState.current}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

export default EncryptionBackground;
