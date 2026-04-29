import { describe, expect, it } from 'vitest';
import { formatSSE, type ExportEvent } from '~/lib/network-exporters/events';

describe('formatSSE', () => {
  it('formats a stage event as SSE', () => {
    const event: ExportEvent = {
      type: 'stage',
      stage: 'fetching',
      message: 'Fetching interview data...',
    };
    const result = formatSSE(event);
    expect(result).toBe(
      'data: {"type":"stage","stage":"fetching","message":"Fetching interview data..."}\n\n',
    );
  });

  it('formats a progress event as SSE', () => {
    const event: ExportEvent = {
      type: 'progress',
      stage: 'generating',
      current: 3,
      total: 10,
    };
    const result = formatSSE(event);
    expect(result).toContain('"type":"progress"');
    expect(result).toContain('"current":3');
    expect(result).toContain('"total":10');
    expect(result.startsWith('data: ')).toBe(true);
    expect(result.endsWith('\n\n')).toBe(true);
  });

  it('formats a complete event as SSE', () => {
    const event: ExportEvent = {
      type: 'complete',
      zipUrl: 'https://example.com/export.zip',
      zipKey: 'networkCanvasExport-123.zip',
    };
    const result = formatSSE(event);
    expect(result).toContain('"type":"complete"');
    expect(result).toContain('"zipUrl":"https://example.com/export.zip"');
    expect(result.startsWith('data: ')).toBe(true);
    expect(result.endsWith('\n\n')).toBe(true);
  });

  it('formats an error event as SSE', () => {
    const event: ExportEvent = {
      type: 'error',
      message: 'Something went wrong',
    };
    const result = formatSSE(event);
    expect(result).toContain('"type":"error"');
    expect(result).toContain('"message":"Something went wrong"');
  });
});
