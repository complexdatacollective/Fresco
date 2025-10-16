import { useMemo } from 'react';
import { type Edge, type Node } from './store';

export type RelativeOption = { label: string; value: string };

const motherKey = 'mother';
const fatherKey = 'father';
const maternalMotherKey = 'maternal-grandmother';
const maternalFatherKey = 'maternal-grandfather';
const paternalMotherKey = 'paternal-grandmother';
const paternalFatherKey = 'paternal-grandfather';
const egoKey = 'ego';

type RelativesResult = {
  grandchildrenOptions: RelativeOption[];
  nieceOptions: RelativeOption[];
  firstCousinOptions: RelativeOption[];
};

export const useRelatives = (
  nodesMap: Map<string, Node>,
  edgesMap: Map<string, Edge>,
): RelativesResult => {
  return useMemo(() => {
    const ego = nodesMap.get(egoKey);

    if (!ego) {
      return {
        grandchildrenOptions: [],
        nieceOptions: [],
        firstCousinOptions: [],
      };
    }

    const getSiblingsByParent = (
      parentKeys: (string | null)[],
      edgesMap: Map<string, Edge>,
      nodesMap: Map<string, Node>,
      subjectKey?: string, // optional
    ): Map<string, Node> => {
      const siblings = new Map<string, Node>();

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
    };

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

    return {
      grandchildrenOptions,
      nieceOptions,
      firstCousinOptions,
    };
  }, [nodesMap, edgesMap]);
};
