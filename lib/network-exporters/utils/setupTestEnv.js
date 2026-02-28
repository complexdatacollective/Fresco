import { Writable } from 'node:stream';

export const makeWriteableStream = () => {
  const chunks = [];

  const writable = new Writable({
    write(chunk, encoding, next) {
      chunks.push(chunk.toString());
      next(null);
    },
  });

  writable.asString = async () =>
    new Promise((resolve, reject) => {
      writable.on('finish', () => {
        resolve(chunks.join(''));
      });
      writable.on('error', (err) => {
        reject(err);
      });
    });

  return writable;
};
