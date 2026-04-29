import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContractProvider } from '~/lib/interviewer/contract/context';
import { useAssetUrl } from '~/lib/interviewer/hooks/useAssetUrl';

const makeWrapper = (onRequestAsset: (id: string) => Promise<string>) => {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ContractProvider onFinish={vi.fn()} onRequestAsset={onRequestAsset}>
        {children}
      </ContractProvider>
    );
  }
  return Wrapper;
};

describe('useAssetUrl', () => {
  it('returns null, loading=true on first render', async () => {
    const onRequestAsset = vi.fn().mockResolvedValue('https://cdn/a.png');
    const { result } = renderHook(() => useAssetUrl('asset-1'), {
      wrapper: makeWrapper(onRequestAsset),
    });

    expect(result.current.url).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.url).toBe('https://cdn/a.png');
    expect(result.current.error).toBeNull();
  });

  it('returns null loading=false when id is undefined', () => {
    const onRequestAsset = vi.fn();
    const { result } = renderHook(() => useAssetUrl(undefined), {
      wrapper: makeWrapper(onRequestAsset),
    });

    expect(result.current.url).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(onRequestAsset).not.toHaveBeenCalled();
  });

  it('surfaces errors', async () => {
    const boom = new Error('asset not found');
    const onRequestAsset = vi.fn().mockRejectedValue(boom);
    const { result } = renderHook(() => useAssetUrl('asset-missing'), {
      wrapper: makeWrapper(onRequestAsset),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.url).toBeNull();
    expect(result.current.error).toBe(boom);
  });

  it('refetches when id changes', async () => {
    const onRequestAsset = vi
      .fn()
      .mockImplementation((id: string) => Promise.resolve(`https://cdn/${id}`));

    const { result, rerender } = renderHook(
      ({ id }: { id: string | undefined }) => useAssetUrl(id),
      {
        initialProps: { id: 'a' },
        wrapper: makeWrapper(onRequestAsset),
      },
    );

    await waitFor(() => expect(result.current.url).toBe('https://cdn/a'));

    act(() => rerender({ id: 'b' }));
    await waitFor(() => expect(result.current.url).toBe('https://cdn/b'));

    expect(onRequestAsset).toHaveBeenCalledTimes(2);
  });
});
