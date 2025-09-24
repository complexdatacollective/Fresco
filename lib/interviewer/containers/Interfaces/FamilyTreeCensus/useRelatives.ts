import { useMemo } from 'react';
import type { PlaceholderNodeProps } from './FamilyTreeNode';

export type RelativeOption = { label: string; value: string };

type RelativesResult = {
  mother: PlaceholderNodeProps | null;
  father: PlaceholderNodeProps | null;
  maternalSiblings: PlaceholderNodeProps[];
  paternalSiblings: PlaceholderNodeProps[];
  egoSiblings: PlaceholderNodeProps[];
  egoChildren: PlaceholderNodeProps[];
  grandchildrenOptions: RelativeOption[];
  nieceOptions: RelativeOption[];
  firstCousinOptions: RelativeOption[];
  getParents: (subjectId: string) => {
    mother: PlaceholderNodeProps | null;
    father: PlaceholderNodeProps | null;
  };
};

export function useRelatives(
  egoId: string,
  nodes: PlaceholderNodeProps[],
): RelativesResult {
  return useMemo(() => {
    const ego = nodes.find((n) => n.id === egoId) ?? null;

    if (!ego) {
      return {
        mother: null,
        father: null,
        maternalSiblings: [],
        paternalSiblings: [],
        egoSiblings: [],
        egoChildren: [],
        grandchildrenOptions: [],
        nieceOptions: [],
        firstCousinOptions: [],
        getParents: () => ({ mother: null, father: null }),
      };
    }

    // Parents
    const mother =
      nodes.find(
        (n) =>
          ego.parentIds?.includes(n.id) && n.gender.toLowerCase() === 'female',
      ) ?? null;
    const father =
      nodes.find(
        (n) =>
          ego.parentIds?.includes(n.id) && n.gender.toLowerCase() === 'male',
      ) ?? null;

    // Ego’s siblings
    const egoSiblings = nodes.filter(
      (n) =>
        n.id !== ego.id &&
        n.parentIds?.some((pid) => ego.parentIds?.includes(pid)),
    );

    // Mother’s siblings (maternal aunts/uncles)
    const maternalSiblings = mother
      ? nodes.filter(
          (n) =>
            n.id !== mother.id &&
            n.parentIds?.some((pid) => mother.parentIds?.includes(pid)),
        )
      : [];

    // Father’s siblings (paternal aunts/uncles)
    const paternalSiblings = father
      ? nodes.filter(
          (n) =>
            n.id !== father.id &&
            n.parentIds?.some((pid) => father.parentIds?.includes(pid)),
        )
      : [];

    // Ego’s children
    const egoChildren = nodes.filter((n) => n.parentIds?.includes(ego.id));

    // Derived options
    const grandchildrenOptions: RelativeOption[] = [];
    let daughterCount = 0;
    let sonCount = 0;
    egoChildren.forEach((child) => {
      if (child.gender.toLowerCase() === 'female') {
        daughterCount++;
        grandchildrenOptions.push({
          label: `Daughter #${daughterCount}`,
          value: child.id,
        });
      } else {
        sonCount++;
        grandchildrenOptions.push({
          label: `Son #${sonCount}`,
          value: child.id,
        });
      }
    });

    const nieceOptions: RelativeOption[] = [];
    let sisterCount = 0;
    let brotherCount = 0;
    egoSiblings.forEach((sib) => {
      if (sib.gender.toLowerCase() === 'female') {
        sisterCount++;
        nieceOptions.push({ label: `Sister #${sisterCount}`, value: sib.id });
      } else {
        brotherCount++;
        nieceOptions.push({ label: `Brother #${brotherCount}`, value: sib.id });
      }
    });

    const firstCousinOptions: RelativeOption[] = [];
    let maternalAuntCount = 0;
    let maternalUncleCount = 0;
    let paternalAuntCount = 0;
    let paternalUncleCount = 0;

    maternalSiblings.forEach((sib) => {
      if (sib.gender.toLowerCase() === 'female') {
        maternalAuntCount++;
        firstCousinOptions.push({
          label: `Maternal Aunt #${maternalAuntCount}`,
          value: sib.id,
        });
      } else {
        maternalUncleCount++;
        firstCousinOptions.push({
          label: `Maternal Uncle #${maternalUncleCount}`,
          value: sib.id,
        });
      }
    });

    paternalSiblings.forEach((sib) => {
      if (sib.gender.toLowerCase() === 'female') {
        paternalAuntCount++;
        firstCousinOptions.push({
          label: `Paternal Aunt #${paternalAuntCount}`,
          value: sib.id,
        });
      } else {
        paternalUncleCount++;
        firstCousinOptions.push({
          label: `Paternal Uncle #${paternalUncleCount}`,
          value: sib.id,
        });
      }
    });

    // Helper for arbitrary subject
    function getParents(subjectId: string) {
      const subject = nodes.find((n) => n.id === subjectId);
      if (!subject) return { mother: null, father: null };

      let mother: PlaceholderNodeProps | null = null;
      let father: PlaceholderNodeProps | null = null;

      (subject.parentIds ?? []).forEach((pid) => {
        const parent = nodes.find((n) => n.id === pid);
        if (!parent) return;
        if (parent.gender.toLowerCase() === 'female') mother = parent;
        else if (parent.gender.toLowerCase() === 'male') father = parent;
      });

      return { mother, father };
    }

    return {
      mother,
      father,
      maternalSiblings,
      paternalSiblings,
      egoSiblings,
      egoChildren,
      grandchildrenOptions,
      nieceOptions,
      firstCousinOptions,
      getParents,
    };
  }, [egoId, nodes]);
}
