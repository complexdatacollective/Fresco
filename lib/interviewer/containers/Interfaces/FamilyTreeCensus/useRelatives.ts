import { useMemo } from 'react';

export type RelativeOption = { label: string; value: string };

const motherKey = 'mother';
const fatherKey = 'father';
const maternalMotherKey = 'maternal-grandmother';
const maternalFatherKey = 'maternal-grandfather';
const paternalMotherKey = 'paternal-grandmother';
const paternalFatherKey = 'paternal-grandfather';
const egoKey = 'ego';

type RelativesResult = {
  mother;
  father;
  maternalSiblings;
  paternalSiblings;
  egoSiblings;
  egoChildren;
  grandchildrenOptions: RelativeOption[];
  nieceOptions: RelativeOption[];
  firstCousinOptions: RelativeOption[];
  getParents: (subjectId: string) => {
    mother;
    father;
  };
};

export function useRelatives(nodesMap, edgesMap): RelativesResult {
  return useMemo(() => {
    const ego = nodesMap.get(egoKey);

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

    const mother = nodesMap.get(motherKey);
    const father = nodesMap.get(fatherKey);

    function getSiblingsByParent(
      parentKeys: (string | null)[],
      edgesMap: Map<string, Edge>,
      nodesMap: Map<string, PlaceholderNodeProps>,
      subjectKey?: string, // optional
    ): Map<string, PlaceholderNodeProps> {
      const siblings = new Map<string, PlaceholderNodeProps>();

      parentKeys.forEach((parentKey) => {
        if (!parentKey) return;

        for (const [, edge] of edgesMap.entries()) {
          if (edge.relationship === 'parent' && edge.source === parentKey) {
            const childId = edge.target;

            // only skip if subjectKey is provided AND matches
            if (subjectKey && childId === subjectKey) continue;

            const childNode = nodesMap.get(childId);
            if (childNode) siblings.set(childId, childNode);
          }
        }
      });

      return siblings;
    }

    // Ego’s siblings
    const egoSiblings = getSiblingsByParent(
      [motherKey, fatherKey],
      edgesMap,
      nodesMap,
      egoKey,
    );
    // Maternal aunts/uncles
    const maternalSiblings = getSiblingsByParent(
      [maternalMotherKey, maternalFatherKey],
      edgesMap,
      nodesMap,
      motherKey,
    );
    // Paternal aunts/uncles
    const paternalSiblings = getSiblingsByParent(
      [paternalMotherKey, paternalFatherKey],
      edgesMap,
      nodesMap,
      fatherKey,
    );

    // Ego’s children
    const egoChildren = getSiblingsByParent([egoKey], edgesMap, nodesMap);

    // Options
    const grandchildrenOptions: RelativeOption[] = [];
    let daughterCount = 0;
    let sonCount = 0;

    egoChildren.forEach((child, key) => {
      if (child.sex === 'female') {
        daughterCount++;
        grandchildrenOptions.push({
          label: `Daughter #${daughterCount}`,
          value: key,
        });
      } else {
        sonCount++;
        grandchildrenOptions.push({
          label: `Son #${sonCount}`,
          value: key,
        });
      }
    });

    const nieceOptions: RelativeOption[] = [];
    let sisterCount = 0;
    let brotherCount = 0;
    egoSiblings.forEach((sibling, key) => {
      if (sibling.sex === 'female') {
        sisterCount++;
        nieceOptions.push({ label: `Sister #${sisterCount}`, value: key });
      } else {
        brotherCount++;
        nieceOptions.push({ label: `Brother #${brotherCount}`, value: key });
      }
    });

    const firstCousinOptions: RelativeOption[] = [];
    let maternalAuntCount = 0;
    let maternalUncleCount = 0;
    let paternalAuntCount = 0;
    let paternalUncleCount = 0;

    maternalSiblings.forEach((sibling, key) => {
      if (sibling.sex === 'female') {
        maternalAuntCount++;
        firstCousinOptions.push({
          label: `Maternal Aunt #${maternalAuntCount}`,
          value: key,
        });
      } else {
        maternalUncleCount++;
        firstCousinOptions.push({
          label: `Maternal Uncle #${maternalUncleCount}`,
          value: key,
        });
      }
    });

    paternalSiblings.forEach((sibling, key) => {
      if (sibling.sex === 'female') {
        paternalAuntCount++;
        firstCousinOptions.push({
          label: `Paternal Aunt #${paternalAuntCount}`,
          value: key,
        });
      } else {
        paternalUncleCount++;
        firstCousinOptions.push({
          label: `Paternal Uncle #${paternalUncleCount}`,
          value: key,
        });
      }
    });

    // Helper for other relations
    function getParents(subjectId: string) {
      let mother: PlaceholderNodeProps | null = null;
      let father: PlaceholderNodeProps | null = null;

      // Iterate over edges and find parent -> subject relationships
      edgesMap.forEach((edge, key) => {
        if (edge.relationship === 'parent' && edge.target === subjectId) {
          const parent = nodesMap.get(edge.source);
          if (!parent) return;

          if (parent.sex === 'female') {
            mother = parent;
          } else if (parent.sex === 'male') {
            father = parent;
          }
        }
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
  }, [nodesMap, edgesMap]);
}
