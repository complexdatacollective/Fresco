import type { NcNode } from '@codaco/shared-consts';
import UINode from '~/lib/ui/components/FamilyTree/FamilyTreeNode';
import { useNodeLabel } from '../Anonymisation/useNodeLabel';

const genderColors: Record<string, string> = {
  male: 'neon-coral',
  female: 'neon-coral',
};
const genderShapes: Record<string, string> = {
  male: 'square',
  female: 'circle',
};

export type PlaceholderNodeProps = {
  id: string;
  isEgo: boolean;
  networkNode?: NcNode;
  gender: string;
  label: string;
  parentIds?: string[];
  childIds?: string[];
  partnerId?: string;
  xPos?: number;
  yPos?: number;
  handleClick?: (node: PlaceholderNodeProps) => void;
};
export const FamilyTreeNode = (props: PlaceholderNodeProps) => {
  const {
    isEgo,
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
      color={genderColors[gender]}
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
    isEgo,
    gender,
    xPos = 0,
    yPos = 0,
    handleClick = () => undefined,
  } = props;

  return (
    <UINode
      key={`${xPos}-${yPos}`}
      isEgo={isEgo}
      color={genderColors[gender]}
      label={useNodeLabel(networkNode!)}
      shape={genderShapes[gender]}
      xPos={xPos}
      yPos={yPos}
      handleClick={() => handleClick(props)}
    />
  );
};
