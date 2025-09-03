import type { NcNode } from '@codaco/shared-consts';
import { motion } from 'motion/react';
import { useSelector } from 'react-redux';
import { getPedigreeStageMetadata } from '~/lib/interviewer/selectors/session';
import UINode from '~/lib/ui/components/FamilyTree/FamilyTreeNode';
import { useNodeLabel } from '../Anonymisation/useNodeLabel';

const genderShapes: Record<string, string> = {
  male: 'square',
  female: 'circle',
};

type RelationKey =
  | 'placeholder'
  | 'direct'
  | 'twoDegRemoved'
  | 'cousins'
  | 'unrelated';

const relationColors: Record<RelationKey, string> = {
  placeholder: 'platinum',
  direct: 'neon-coral',
  twoDegRemoved: 'darker-neon-coral',
  cousins: 'even-darker-neon-coral',
  unrelated: 'darkest-neon-coral',
};

export type PlaceholderNodeProps = {
  id: string;
  isEgo: boolean | undefined;
  networkNode?: NcNode;
  gender: string;
  label: string;
  parentIds?: string[];
  childIds?: string[];
  partnerId?: string;
  exPartnerId?: string;
  xPos?: number;
  yPos?: number;
  yOffset?: number;
  unDeletable?: boolean;
  handleClick?: (node: PlaceholderNodeProps) => void;
};
export const FamilyTreeNode = (props: PlaceholderNodeProps) => {
  const {
    isEgo = false,
    gender,
    label,
    xPos = 0,
    yPos = 0,
    handleClick = () => undefined,
  } = props;

  return (
    <UINode
      key={`${xPos}-${yPos}`}
      isEgo={isEgo}
      color={isEgo ? 'neon-coral' : 'platinum'}
      label={label}
      shape={genderShapes[gender]}
      xPos={xPos}
      yPos={yPos}
      handleClick={() => handleClick(props)}
    />
  );
};

export const FamilyTreeNodeNetworkBacked = (props: PlaceholderNodeProps) => {
  const {
    networkNode,
    isEgo = false,
    label = '',
    gender,
    xPos = 0,
    yPos = 0,
    yOffset = 0,
    handleClick = () => undefined,
  } = props;

  const placeholderNodes = useSelector(getPedigreeStageMetadata);
  const ego = placeholderNodes?.find((n) => n.isEgo);

  function classifyRelation(node: Node, ego: Node): RelationKey | null {
    const sharedParents = node.parentIds.filter((pid) =>
      ego.parentIds.includes(pid),
    );
    const GENERATION_GAP = 180;

    if (!node.networkNode) {
      return 'placeholder';
    }

    if (node.parentIds.length === 0 && node.yPos !== yOffset) {
      return 'unrelated';
    }

    if (
      ego.parentIds.includes(node.id) ||
      ego.childIds.includes(node.id) ||
      node.parentIds.includes(ego.id) ||
      node.childIds.includes(ego.id) ||
      (node.yPos - yOffset === ego.yPos && sharedParents.length === 2) ||
      node.id === ego.id
    ) {
      return 'direct';
    }

    if (
      (node.yPos - yOffset === ego.yPos && sharedParents.length === 1) ||
      (node.yPos - yOffset === ego.yPos - GENERATION_GAP &&
        !ego.parentIds.includes(node.id)) ||
      (node.yPos - yOffset === ego.yPos + GENERATION_GAP &&
        !ego.childIds.includes(node.id)) ||
      node.yPos - yOffset === ego.yPos + 2 * GENERATION_GAP ||
      node.yPos === yOffset
    ) {
      return 'twoDegRemoved';
    }

    if (node.yPos - yOffset === ego.yPos && sharedParents.length === 0) {
      return 'cousins';
    }

    return null;
  }

  const color = classifyRelation(props, ego)
    ? relationColors[classifyRelation(props, ego)!]
    : 'platinum';

  return (
    <UINode
      key={`${xPos}-${yPos}`}
      isEgo={isEgo}
      color={color}
      label={useNodeLabel(networkNode!)}
      shape={genderShapes[gender]}
      xPos={xPos}
      yPos={yPos}
      handleClick={() => handleClick(props)}
    />
  );
};

FamilyTreeNode.displayName = 'FamilyTreeNode';

export const MotionFamilyTreeNode = motion.create(FamilyTreeNode);
