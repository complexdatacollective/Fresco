import UINode from '~/lib/ui/components/FamilyTree/FamilyTreeNode';

const genderColors: Record<string, string> = {
  male: 'primary-color-seq-1',
  female: 'primary-color-seq-2',
};
const genderShapes: Record<string, string> = {
  male: 'circle',
  female: 'triangle',
};

export type PlaceholderNodeProps = {
  id?: string;
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
    id = crypto.randomUUID(),
    gender,
    label,
    xPos = 0,
    yPos = 0,
    handleClick = () => undefined,
  } = props;

  return (
    <UINode
      key={`${xPos}-${yPos}`}
      color={genderColors[gender]}
      label={label}
      shape={genderShapes[gender]}
      xPos={xPos}
      yPos={yPos}
      handleClick={() => handleClick(props)}
    />
  );
};
