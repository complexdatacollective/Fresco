import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  ContractProvider,
  useContractFlags,
  useContractHandlers,
} from '~/lib/interviewer/contract/context';
import type {
  AssetRequestHandler,
  FinishHandler,
  InterviewerFlags,
} from '~/lib/interviewer/contract/types';

const wrap = (value: {
  onFinish: FinishHandler;
  onRequestAsset: AssetRequestHandler;
  flags?: InterviewerFlags;
}) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <ContractProvider {...value}>{children}</ContractProvider>;
  };

describe('ContractProvider', () => {
  it('exposes handlers via useContractHandlers that forward to the originals', async () => {
    const onFinish = vi.fn();
    const onRequestAsset = vi.fn().mockResolvedValue('url');

    const { result } = renderHook(() => useContractHandlers(), {
      wrapper: wrap({ onFinish, onRequestAsset }),
    });

    void result.current.onFinish('interview-1', new AbortController().signal);
    expect(onFinish).toHaveBeenCalledWith(
      'interview-1',
      expect.any(AbortSignal),
    );

    await result.current.onRequestAsset('id-1');
    expect(onRequestAsset).toHaveBeenCalledWith('id-1');
  });

  it('exposes flags via useContractFlags with defaults isE2E=false and isDevelopment=false', () => {
    const { result } = renderHook(() => useContractFlags(), {
      wrapper: wrap({ onFinish: vi.fn(), onRequestAsset: vi.fn() }),
    });

    expect(result.current.isE2E).toBe(false);
    expect(result.current.isDevelopment).toBe(false);
  });

  it('honours provided flags', () => {
    const { result } = renderHook(() => useContractFlags(), {
      wrapper: wrap({
        onFinish: vi.fn(),
        onRequestAsset: vi.fn(),
        flags: { isE2E: true, isDevelopment: true },
      }),
    });

    expect(result.current.isE2E).toBe(true);
    expect(result.current.isDevelopment).toBe(true);
  });

  it('useContractHandlers throws outside provider', () => {
    expect(() => renderHook(() => useContractHandlers())).toThrow(
      /ContractProvider/,
    );
  });

  it('useContractFlags throws outside provider', () => {
    expect(() => renderHook(() => useContractFlags())).toThrow(
      /ContractProvider/,
    );
  });

  it('returned handlers are reference-stable across parent re-renders', () => {
    const onFinish = vi.fn();
    const onRequestAsset = vi.fn();
    const wrapper = wrap({ onFinish, onRequestAsset });

    const { result, rerender } = renderHook(() => useContractHandlers(), {
      wrapper,
    });

    const first = result.current;
    rerender();
    expect(result.current.onFinish).toBe(first.onFinish);
    expect(result.current.onRequestAsset).toBe(first.onRequestAsset);
  });

  it('stable callback forwards to the latest handler', async () => {
    let currentHandler = vi
      .fn<(id: string) => Promise<string>>()
      .mockResolvedValue('a');

    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <ContractProvider
          onFinish={vi.fn()}
          onRequestAsset={(id) => currentHandler(id)}
        >
          {children}
        </ContractProvider>
      );
    }

    const { result, rerender } = renderHook(() => useContractHandlers(), {
      wrapper: Wrapper,
    });

    await result.current.onRequestAsset('test');
    expect(currentHandler).toHaveBeenCalledWith('test');

    // Swap the handler via closure; the stable callback should forward to it.
    currentHandler = vi
      .fn<(id: string) => Promise<string>>()
      .mockResolvedValue('b');
    rerender();

    const updatedResult = await result.current.onRequestAsset('test-2');
    expect(currentHandler).toHaveBeenCalledWith('test-2');
    expect(updatedResult).toBe('b');
  });
});
