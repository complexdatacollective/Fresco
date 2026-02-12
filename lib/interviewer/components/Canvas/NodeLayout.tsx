/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
'use client';

import {
  type NcNode,
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { find, get, isEmpty } from 'es-toolkit/compat';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import useDropTarget from '~/lib/interviewer/behaviours/DragAndDrop/useDropTarget';
import useBounds from '~/lib/interviewer/behaviours/useBounds';
import {
  toggleEdge,
  toggleNodeAttributes,
  updateNode,
} from '~/lib/interviewer/ducks/modules/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import LayoutContext from '../../contexts/LayoutContext';
import LayoutNode from './LayoutNode';
import { getTwoModeLayoutVariable } from './utils';

type NodeLayoutProps = {
  id: string;
  highlightAttribute?: string | null;
  layout?: string;
  twoMode?: boolean;
  destinationRestriction?: string | null;
  originRestriction?: string | null;
  allowHighlighting?: boolean;
  allowPositioning?: boolean;
  allowSelect?: boolean;
  createEdge?: string | null;
  layoutVariable?: string;
};

const relativeCoords = (
  container: { x: number; y: number; width: number; height: number },
  node: { x: number; y: number },
) => ({
  x: (node.x - container.x) / container.width,
  y: (node.y - container.y) / container.height,
});

const NodeLayout = ({
  id,
  highlightAttribute,
  layout,
  twoMode = false,
  destinationRestriction,
  originRestriction,
  allowHighlighting = false,
  allowPositioning = true,
  allowSelect = true,
  createEdge,
}: NodeLayoutProps) => {
  const dispatch = useAppDispatch();
  const layoutRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<HTMLDivElement>(null);
  const updateRAF = useRef<number>(undefined);
  const layoutElsRef = useRef<HTMLDivElement[]>([]);
  const isDragging = useRef(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const context = useContext(LayoutContext) as any;
  const {
    network: { nodes },
    getPosition,
    screen,
    allowAutomaticLayout,
    simulation,
  } = context;

  // Bounds measurement for drop target
  const bounds = useBounds(boundsRef);

  // Drop target: accepts positioned nodes being dropped
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accepts = useCallback(
    ({ meta }: any) => meta.itemType === 'POSITIONED_NODE',
    [],
  );

  const onDrop = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => {
      const layoutVariable = twoMode ? layout?.[item.meta.type] : layout;
      if (!layoutVariable) return;

      void dispatch(
        updateNode({
          nodeId: item.meta[entityPrimaryKeyProperty],
          newAttributeData: {
            [layoutVariable]: relativeCoords(
              {
                width: bounds.width,
                height: bounds.height,
                x: bounds.x,
                y: bounds.y,
              },
              item,
            ),
          },
        }),
      );
    },
    [dispatch, layout, twoMode, bounds],
  );

  useDropTarget({
    ref: boundsRef,
    id,
    onDrop,
    accepts,
  });

  // --- Edge creation / highlight selection handlers ---
  const connectNode = useCallback(
    (nodeId: string) => {
      if (!createEdge) return;

      if (connectFrom === nodeId) {
        setConnectFrom(null);
        return;
      }

      if (!connectFrom) {
        const nodeType = get(
          nodes.find((n: NcNode) => n[entityPrimaryKeyProperty] === nodeId),
          'type',
        );

        if (originRestriction && nodeType === originRestriction) {
          return;
        }

        setConnectFrom(nodeId);
        return;
      }

      if (connectFrom !== nodeId) {
        void dispatch(
          toggleEdge({
            from: connectFrom,
            to: nodeId,
            type: createEdge,
          }),
        );
      }

      setConnectFrom(null);
    },
    [createEdge, connectFrom, nodes, originRestriction, dispatch],
  );

  const toggleHighlightAttribute = useCallback(
    (node: NcNode) => {
      if (!allowHighlighting || !highlightAttribute) return;

      const newVal = !get(
        node,
        [entityAttributesProperty, highlightAttribute],
        false,
      );
      dispatch(
        toggleNodeAttributes({
          nodeId: node[entityPrimaryKeyProperty],
          attributes: {
            [highlightAttribute]: newVal,
          },
        }),
      );
    },
    [allowHighlighting, highlightAttribute, dispatch],
  );

  const onSelected = useCallback(
    (node: NcNode) => {
      if (!allowHighlighting) {
        connectNode(node[entityPrimaryKeyProperty]);
      } else {
        toggleHighlightAttribute(node);
      }
    },
    [allowHighlighting, connectNode, toggleHighlightAttribute],
  );

  // --- Helper predicates ---
  const isLinking = useCallback(
    (node: NcNode) => get(node, entityPrimaryKeyProperty) === connectFrom,
    [connectFrom],
  );

  const isHighlighted = useCallback(
    (node: NcNode) =>
      !isEmpty(highlightAttribute) &&
      get(node, [entityAttributesProperty, highlightAttribute!], false) ===
        true,
    [highlightAttribute],
  );

  const isDisabled = useCallback(
    (node: NcNode) => {
      if (
        !connectFrom &&
        originRestriction &&
        node.type === originRestriction
      ) {
        return true;
      }

      if (!connectFrom || connectFrom === node[entityPrimaryKeyProperty]) {
        return false;
      }

      const origin = find(nodes, [entityPrimaryKeyProperty, connectFrom]);
      const originType = get(origin, 'type');
      const thisType = get(node, 'type');

      if (destinationRestriction === 'same') {
        return thisType !== originType;
      }

      if (destinationRestriction === 'different') {
        return thisType === originType;
      }

      return false;
    },
    [connectFrom, originRestriction, destinationRestriction, nodes],
  );

  // --- Layout element creation ---
  const createLayoutEls = useCallback(() => {
    if (!layoutRef.current) return;

    layoutElsRef.current = nodes.map((_: NcNode, index: number) => {
      if (layoutElsRef.current[index]) {
        return layoutElsRef.current[index];
      }

      const nodeEl = document.createElement('div');
      nodeEl.style.position = 'absolute';
      nodeEl.style.transform = 'translate(-50%, -50%)';
      nodeEl.style.display = 'none';
      layoutRef.current!.append(nodeEl);

      return nodeEl;
    });
  }, [nodes]);

  // --- Position update loop ---
  useEffect(() => {
    const update = () => {
      layoutElsRef.current.forEach((el, index) => {
        const relativePosition = getPosition.current(index);
        if (!relativePosition || !el) return;

        const screenPosition =
          screen.current.calculateScreenCoords(relativePosition);
        el.style.left = `${screenPosition.x}px`;
        el.style.top = `${screenPosition.y}px`;
        el.style.display = 'block';
      });

      updateRAF.current = requestAnimationFrame(update);
    };

    updateRAF.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(updateRAF.current!);
    };
  }, [getPosition, screen]);

  // --- Initialize layout elements + screen manager ---
  useEffect(() => {
    createLayoutEls();
  }, [createLayoutEls]);

  useEffect(() => {
    if (!layoutRef.current) return;

    const screenRef = screen.current;
    screenRef.initialize(layoutRef.current);

    // Hack: re-measure after animation settles
    const timeout = setTimeout(() => {
      screenRef.measureScreen();
    }, 500);

    return () => {
      clearTimeout(timeout);
      screenRef.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Drag handlers ---
  const handleDragStart = useCallback(
    (uuid: string, index: number, delta: { x: number; y: number }) => {
      isDragging.current = true;

      const relativeDelta = screen.current.calculateRelativeCoords(delta);

      if (allowAutomaticLayout && simulation) {
        const { simulationEnabled, moveNode } = simulation;
        if (simulationEnabled) {
          moveNode(relativeDelta, index);
          return;
        }
      }

      const nodeType = get(nodes, [index, 'type']);
      const layoutVariable = getTwoModeLayoutVariable(
        twoMode,
        nodeType,
        layout,
      );

      void dispatch(
        updateNode({
          nodeId: uuid,
          newAttributeData: {
            [layoutVariable]: screen.current.calculateRelativeCoords({
              x: delta.x,
              y: delta.y,
            }),
          },
        }),
      );
    },
    [
      screen,
      allowAutomaticLayout,
      simulation,
      nodes,
      twoMode,
      layout,
      dispatch,
    ],
  );

  const handleDragMove = useCallback(
    (uuid: string, index: number, delta: { x: number; y: number }) => {
      const relativeDelta = screen.current.calculateRelativeCoords(delta);

      if (allowAutomaticLayout && simulation) {
        const { simulationEnabled, moveNode } = simulation;
        if (simulationEnabled) {
          moveNode(relativeDelta, index);
          return;
        }
      }

      const nodeType = get(nodes, [index, 'type']);
      const layoutVariable = getTwoModeLayoutVariable(
        twoMode,
        nodeType,
        layout,
      );

      void dispatch(
        updateNode({
          nodeId: uuid,
          newAttributeData: {
            [layoutVariable]: screen.current.calculateRelativeCoords({
              x: delta.x,
              y: delta.y,
            }),
          },
        }),
      );
    },
    [
      screen,
      allowAutomaticLayout,
      simulation,
      nodes,
      twoMode,
      layout,
      dispatch,
    ],
  );

  const handleDragEnd = useCallback(
    (uuid: string, index: number, { x, y }: { x: number; y: number }) => {
      if (allowAutomaticLayout && simulation) {
        const { simulationEnabled, releaseNode } = simulation;
        if (simulationEnabled) {
          releaseNode(index);
          return;
        }
      }

      const nodeType = get(nodes, [index, 'type']);
      const layoutVariable = getTwoModeLayoutVariable(
        twoMode,
        nodeType,
        layout,
      );

      void dispatch(
        updateNode({
          nodeId: uuid,
          newAttributeData: {
            [layoutVariable]: screen.current.calculateRelativeCoords({ x, y }),
          },
        }),
      );
    },
    [
      screen,
      allowAutomaticLayout,
      simulation,
      nodes,
      twoMode,
      layout,
      dispatch,
    ],
  );

  const handleSelected = useCallback(
    (node: NcNode) => {
      if (isDisabled(node)) return;

      if (isDragging.current) {
        isDragging.current = false;
        return;
      }
      onSelected(node);
    },
    [isDisabled, onSelected],
  );

  return (
    <div ref={boundsRef} style={{ display: 'contents' }}>
      <div className="node-layout" ref={layoutRef} />
      {nodes.map((node: NcNode, index: number) => {
        const el = layoutElsRef.current[index];
        if (!el) return null;
        return (
          <LayoutNode
            node={node}
            portal={el}
            index={index}
            key={`${node[entityPrimaryKeyProperty]}_${index}`}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            allowPositioning={allowPositioning}
            allowSelect={allowSelect}
            onSelected={handleSelected}
            selected={isHighlighted(node)}
            linking={isLinking(node)}
            inactive={isDisabled(node)}
          />
        );
      })}
    </div>
  );
};

export default NodeLayout;
