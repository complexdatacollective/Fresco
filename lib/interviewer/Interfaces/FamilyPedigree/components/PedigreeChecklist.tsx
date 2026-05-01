'use client';

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionValue,
} from 'motion/react';
import { type RefObject, useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { MotionSurface } from '@codaco/fresco-ui/layout/Surface';
import Heading from '@codaco/fresco-ui/typography/Heading';
import { Button } from '@codaco/fresco-ui/Button';
import CloseButton from '@codaco/fresco-ui/CloseButton';
import Checkbox from '@codaco/fresco-ui/form/fields/Checkbox';
import { useFamilyPedigreeStore } from '~/lib/interviewer/Interfaces/FamilyPedigree/FamilyPedigreeProvider';
import { getRelationshipTypeVariable } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/edgeUtils';
import {
  getEgoVariable,
  getNodeLabelVariable,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  required: boolean;
};

export default function PedigreeChecklist({
  dragConstraints,
  onFinalize,
}: {
  dragConstraints: RefObject<HTMLElement | null>;
  onFinalize: () => void;
}) {
  const nodes = useFamilyPedigreeStore((s) => s.network.nodes);
  const edges = useFamilyPedigreeStore((s) => s.network.edges);
  const nodeLabelVariable = useSelector(getNodeLabelVariable);
  const egoVariable = useSelector(getEgoVariable);
  const relationshipTypeVariable = useSelector(getRelationshipTypeVariable);

  const [dismissed, setDismissed] = useState(false);
  const [manuallyChecked, setManuallyChecked] = useState<Set<string>>(
    new Set(),
  );

  const toggleManualCheck = useCallback((id: string) => {
    setManuallyChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const egoId = useMemo(() => {
    for (const [id, node] of nodes) {
      if (node.attributes[egoVariable] === true) return id;
    }
    return null;
  }, [nodes, egoVariable]);

  const egoParentIds = useMemo(() => {
    if (!egoId) return [];
    const parents: string[] = [];
    for (const edge of edges.values()) {
      const relType = edge.attributes[relationshipTypeVariable] as
        | string
        | undefined;
      if (edge.to === egoId && relType !== 'partner' && relType !== 'social') {
        parents.push(edge.from);
      }
    }
    return parents;
  }, [egoId, edges, relationshipTypeVariable]);

  const hasPartner = useMemo(() => {
    if (!egoId) return false;
    for (const edge of edges.values()) {
      if (
        edge.attributes[relationshipTypeVariable] === 'partner' &&
        (edge.from === egoId || edge.to === egoId)
      ) {
        return true;
      }
    }
    return false;
  }, [egoId, edges, relationshipTypeVariable]);

  const hasSiblings = useMemo(() => {
    if (!egoId || egoParentIds.length === 0) return false;
    for (const edge of edges.values()) {
      const relType = edge.attributes[relationshipTypeVariable] as
        | string
        | undefined;
      if (
        relType !== 'partner' &&
        relType !== 'social' &&
        egoParentIds.includes(edge.from) &&
        edge.to !== egoId
      ) {
        return true;
      }
    }
    return false;
  }, [egoId, egoParentIds, edges, relationshipTypeVariable]);

  const hasParentSiblings = useMemo(() => {
    if (!egoId || egoParentIds.length === 0) return false;
    for (const parentId of egoParentIds) {
      const grandparentIds: string[] = [];
      for (const edge of edges.values()) {
        const relType = edge.attributes[relationshipTypeVariable] as
          | string
          | undefined;
        if (
          edge.to === parentId &&
          relType !== 'partner' &&
          relType !== 'social'
        ) {
          grandparentIds.push(edge.from);
        }
      }
      for (const gpId of grandparentIds) {
        for (const edge of edges.values()) {
          const relType = edge.attributes[relationshipTypeVariable] as
            | string
            | undefined;
          if (
            edge.from === gpId &&
            relType !== 'partner' &&
            relType !== 'social' &&
            edge.to !== parentId
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, [egoId, egoParentIds, edges, relationshipTypeVariable]);

  const hasChildren = useMemo(() => {
    if (!egoId) return false;
    for (const edge of edges.values()) {
      if (
        edge.from === egoId &&
        edge.attributes[relationshipTypeVariable] !== 'partner'
      ) {
        return true;
      }
    }
    return false;
  }, [egoId, edges, relationshipTypeVariable]);

  const items = useMemo<ChecklistItem[]>(() => {
    if (!egoId) return [];

    const list: ChecklistItem[] = [];

    for (const parentId of egoParentIds) {
      const parentNode = nodes.get(parentId);
      const rawName = parentNode?.attributes[nodeLabelVariable];
      const nameKnown = typeof rawName === 'string' && rawName.length > 0;

      if (!nameKnown) continue;

      const edgeToEgo = [...edges.values()].find(
        (e) => e.from === parentId && e.to === egoId,
      );
      const edgeToEgoRelType = edgeToEgo?.attributes[
        relationshipTypeVariable
      ] as string | undefined;
      if (edgeToEgoRelType === 'donor' || edgeToEgoRelType === 'surrogate') {
        continue;
      }

      const parentName = rawName;
      const grandparentCount = [...edges.values()].filter((e) => {
        const rt = e.attributes[relationshipTypeVariable] as string | undefined;
        return e.to === parentId && rt !== 'partner' && rt !== 'social';
      }).length;
      const done =
        grandparentCount >= 2 ||
        manuallyChecked.has(`grandparents-${parentId}`);

      const remaining = Math.max(0, 2 - grandparentCount);
      list.push({
        id: `grandparents-${parentId}`,
        label: done
          ? `Add parents for ${parentName}`
          : remaining === 1
            ? `Add 1 more parent for ${parentName}`
            : `Add parents for ${parentName}`,
        done,
        required: true,
      });
    }

    list.push({
      id: 'parent-siblings',
      label: "Add parent's siblings",
      done: hasParentSiblings || manuallyChecked.has('parent-siblings'),
      required: false,
    });

    list.push({
      id: 'siblings',
      label: 'Add siblings',
      done: hasSiblings || manuallyChecked.has('siblings'),
      required: false,
    });

    list.push({
      id: 'partner',
      label: 'Add partners',
      done: hasPartner || manuallyChecked.has('partner'),
      required: false,
    });

    list.push({
      id: 'children',
      label: 'Add children',
      done: hasChildren || manuallyChecked.has('children'),
      required: false,
    });

    return list;
  }, [
    egoId,
    egoParentIds,
    nodes,
    edges,
    nodeLabelVariable,
    hasParentSiblings,
    hasSiblings,
    hasPartner,
    hasChildren,
    manuallyChecked,
    relationshipTypeVariable,
  ]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.required !== b.required) return a.required ? -1 : 1;
        return 0;
      }),
    [items],
  );

  const allDone = sortedItems.every((i) => i.done);

  const overflowY = useMotionValue('auto');

  if (items.length === 0) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <MotionSurface
          key="pedigree-checklist"
          className="bg-surface/80 absolute bottom-4 left-4 z-20 w-72 cursor-move overflow-hidden border-b-2 shadow-2xl backdrop-blur-md"
          layout
          drag
          dragConstraints={dragConstraints}
          elevation="none"
          noContainer
          spacing="sm"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Heading level="h4" margin="none">
                Pedigree Checklist
              </Heading>
            </div>
            <CloseButton size="sm" onClick={() => setDismissed(true)} />
          </div>
          <motion.div className="mt-4 max-h-64" style={{ overflowY }}>
            <LayoutGroup>
              <ul className="flex flex-col gap-3">
                {sortedItems.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    transition={{
                      layout: {
                        type: 'spring',
                        damping: 20,
                        stiffness: 300,
                      },
                    }}
                    onLayoutAnimationStart={() => overflowY.set('hidden')}
                    onLayoutAnimationComplete={() => overflowY.set('auto')}
                    role="button"
                    tabIndex={0}
                    className="flex cursor-pointer items-center gap-4"
                    onClick={() => toggleManualCheck(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleManualCheck(item.id);
                      }
                    }}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        value={item.done}
                        onChange={() => toggleManualCheck(item.id)}
                        tabIndex={-1}
                        aria-hidden
                      />
                    </div>
                    <span
                      className={
                        item.done ? 'text-current/50 line-through' : ''
                      }
                    >
                      {item.label}
                      {item.required && !item.done && (
                        <span className="text-destructive ml-auto">
                          &nbsp;*
                        </span>
                      )}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </LayoutGroup>
          </motion.div>
          {allDone && (
            <Button
              color="primary"
              className="mt-2 w-full"
              onClick={onFinalize}
            >
              Finalize family pedigree
            </Button>
          )}
        </MotionSurface>
      )}
    </AnimatePresence>
  );
}
