import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { GetInterviewsQuery } from '~/queries/interviews';

import NetworkSummary from '../NetworkSummary';

describe('NetworkSummary', () => {
  it.each(Array.from({ length: 9 }, (_, index) => index + 1))(
    'uses a valid relative color expression for edge color sequence %i',
    (sequence) => {
      const network: GetInterviewsQuery[number]['network'] = {
        nodes: [],
        edges: [
          {
            type: `edge-${String(sequence)}`,
            count: 1,
            name: `Edge ${String(sequence)}`,
            color: `edge-color-seq-${String(sequence)}`,
          },
        ],
      };

      render(<NetworkSummary network={network} />);

      const label = screen.getByText(`Edge ${String(sequence)} (1)`);
      const glyph = label.parentElement?.querySelector('svg');

      expect(glyph).toHaveClass(`[--fill:var(--edge-${String(sequence)})]`);
      expect(glyph).toHaveClass(
        `[--fill-dark:oklch(from_var(--edge-${String(sequence)})_calc(l_-_var(--dark-mod))_c_h)]`,
      );
    },
  );
});
