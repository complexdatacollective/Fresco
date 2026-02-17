import { type NcEdge } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getCodebook } from '~/lib/interviewer/ducks/modules/protocol';
import { type RootState } from '~/lib/interviewer/store';
import { type SociogramStoreApi } from './useSociogramStore';

type EdgeLayerProps = {
  edges: NcEdge[];
  store: SociogramStoreApi;
};

export default function EdgeLayer({ edges, store }: EdgeLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const linesRef = useRef<SVGLineElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const edgeDefinitions = useSelector(
    (state: RootState) => getCodebook(state).edge,
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Clean up previous lines
    linesRef.current.forEach((el) => {
      if (el.parentNode === svg) {
        svg.removeChild(el);
      }
    });
    linesRef.current = [];

    // Create new lines
    const svgNS = svg.namespaceURI;
    const newLines = edges.map((edge) => {
      const el = document.createElementNS(svgNS, 'line') as SVGLineElement;
      const colorToken = get(
        edgeDefinitions,
        [edge.type, 'color'],
        'edge-color-seq-1',
      ) as string;
      // Codebook stores 'edge-color-seq-N', CSS variable is '--color-edge-N'
      const n = /\d+$/.exec(colorToken)?.[0] ?? '1';
      el.setAttribute('stroke', `var(--color-edge-${n})`);
      el.setAttribute('stroke-width', '6');
      el.setAttribute('stroke-linecap', 'round');
      el.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(el);
      return el;
    });
    linesRef.current = newLines;

    const updatePositions = () => {
      const { positions } = store.getState();

      edges.forEach((edge, i) => {
        const line = newLines[i];
        if (!line) return;

        const from = positions.get(edge.from);
        const to = positions.get(edge.to);

        if (!from || !to) {
          line.setAttribute('visibility', 'hidden');
          return;
        }

        line.setAttribute('visibility', 'visible');
        line.setAttribute('x1', String(from.x));
        line.setAttribute('y1', String(from.y));
        line.setAttribute('x2', String(to.x));
        line.setAttribute('y2', String(to.y));
      });

      rafRef.current = requestAnimationFrame(updatePositions);
    };

    rafRef.current = requestAnimationFrame(updatePositions);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      newLines.forEach((el) => {
        if (el.parentNode === svg) {
          svg.removeChild(el);
        }
      });
    };
  }, [edges, edgeDefinitions, store]);

  if (edges.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1 1"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}
