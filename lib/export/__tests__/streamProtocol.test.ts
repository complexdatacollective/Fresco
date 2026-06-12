import { describe, expect, it } from 'vitest';
import {
  decodeBase64Chunk,
  encodeExportEvent,
  parseExportEventBuffer,
} from '~/lib/export/streamProtocol';

const decoder = new TextDecoder();

describe('encodeExportEvent', () => {
  it('encodes an event as a single SSE data frame', () => {
    const bytes = encodeExportEvent({
      type: 'progress',
      stage: 'generating',
      current: 5,
      total: 10,
    });
    expect(decoder.decode(bytes)).toBe(
      'data: {"type":"progress","stage":"generating","current":5,"total":10}\n\n',
    );
  });
});

describe('parseExportEventBuffer', () => {
  it('parses whole frames and returns the trailing partial', () => {
    const buffer =
      'data: {"type":"stage","stage":"generating","message":"x"}\n\n' +
      'data: {"type":"data","b64":"AAEC"}\n\n' +
      'data: {"type":"progr';
    const { events, rest } = parseExportEventBuffer(buffer);
    expect(events).toEqual([
      { type: 'stage', stage: 'generating', message: 'x' },
      { type: 'data', b64: 'AAEC' },
    ]);
    expect(rest).toBe('data: {"type":"progr');
  });

  it('returns no events for an empty buffer', () => {
    expect(parseExportEventBuffer('')).toEqual({ events: [], rest: '' });
  });
});

describe('decodeBase64Chunk', () => {
  it('round-trips bytes encoded by encodeExportEvent data frames', () => {
    const original = new Uint8Array([0, 1, 2, 253, 254, 255]);
    const b64 = Buffer.from(original).toString('base64');
    expect(Array.from(decodeBase64Chunk(b64))).toEqual(Array.from(original));
  });
});
