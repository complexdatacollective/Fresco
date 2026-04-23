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

const wrap =
  (value: {
    onFinish: FinishHandler;
    onRequestAsset: AssetRequestHandler;
    flags?: InterviewerFlags;
  }) =>
  ({ children }: { children: React.ReactNode }) => (
    <ContractProvider {...value}>{children}</ContractProvider>
  );

describe('ContractProvider', () => {
  it('exposes handlers via useContractHandlers', () => {
    const onFinish = vi.fn();
    const onRequestAsset = vi.fn();

    const { result } = renderHook(() => useContractHandlers(), {
      wrapper: wrap({ onFinish, onRequestAsset }),
    });

    expect(result.current.onFinish).toBe(onFinish);
    expect(result.current.onRequestAsset).toBe(onRequestAsset);
  });

  it('exposes flags via useContractFlags with default isE2E=false', () => {
    const { result } = renderHook(() => useContractFlags(), {
      wrapper: wrap({ onFinish: vi.fn(), onRequestAsset: vi.fn() }),
    });

    expect(result.current.isE2E).toBe(false);
  });

  it('honours provided flags', () => {
    const { result } = renderHook(() => useContractFlags(), {
      wrapper: wrap({
        onFinish: vi.fn(),
        onRequestAsset: vi.fn(),
        flags: { isE2E: true },
      }),
    });

    expect(result.current.isE2E).toBe(true);
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
});
