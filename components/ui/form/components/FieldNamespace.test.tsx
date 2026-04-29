import { renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import FieldNamespace, { useFieldNamespace } from './FieldNamespace';

function wrapper(prefix: string) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <FieldNamespace prefix={prefix}>{children}</FieldNamespace>;
  }
  return Wrapper;
}

function nestedWrapper(outer: string, inner: string) {
  function NestedWrapper({ children }: { children: ReactNode }) {
    return (
      <FieldNamespace prefix={outer}>
        <FieldNamespace prefix={inner}>{children}</FieldNamespace>
      </FieldNamespace>
    );
  }
  return NestedWrapper;
}

describe('FieldNamespace', () => {
  describe('useFieldNamespace', () => {
    it('should return empty string when no namespace provider exists', () => {
      const { result } = renderHook(() => useFieldNamespace());
      expect(result.current).toBe('');
    });

    it('should return the prefix from a single namespace', () => {
      const { result } = renderHook(() => useFieldNamespace(), {
        wrapper: wrapper('steps[0]'),
      });
      expect(result.current).toBe('steps[0]');
    });

    it('should stack prefixes from nested namespaces with dot separator', () => {
      const { result } = renderHook(() => useFieldNamespace(), {
        wrapper: nestedWrapper('steps[0]', 'egg-parent'),
      });
      expect(result.current).toBe('steps[0].egg-parent');
    });

    it('should handle deeply nested namespaces', () => {
      const deepWrapper = ({ children }: { children: ReactNode }) => (
        <FieldNamespace prefix="steps[0]">
          <FieldNamespace prefix="egg-parent">
            <FieldNamespace prefix="details">{children}</FieldNamespace>
          </FieldNamespace>
        </FieldNamespace>
      );

      const { result } = renderHook(() => useFieldNamespace(), {
        wrapper: deepWrapper,
      });
      expect(result.current).toBe('steps[0].egg-parent.details');
    });
  });

  describe('resolveFieldName', () => {
    it('should prepend namespace to field name', () => {
      const { result } = renderHook(() => useFieldNamespace(), {
        wrapper: wrapper('steps[0]'),
      });

      const namespace = result.current;
      const fieldName = 'name';
      const resolved = namespace ? `${namespace}.${fieldName}` : fieldName;
      expect(resolved).toBe('steps[0].name');
    });

    it('should return bare field name when no namespace', () => {
      const { result } = renderHook(() => useFieldNamespace());

      const namespace = result.current;
      const fieldName = 'name';
      const resolved = namespace ? `${namespace}.${fieldName}` : fieldName;
      expect(resolved).toBe('name');
    });
  });
});
