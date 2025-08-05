import { forwardRef } from 'react';
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
  parents?: PlaceholderNodeProps[];
  children?: PlaceholderNodeProps[];
  xPos?: number;
  yPos?: number;
  handleClick?: (id: string) => void;
};
export const FamilyTreeNode = forwardRef<HTMLDivElement, PlaceholderNodeProps>(
  (props, ref) => {
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
        ref={ref}
        key={`${xPos}-${yPos}`}
        color={genderColors[gender]}
        label={label}
        shape={genderShapes[gender]}
        xPos={xPos}
        yPos={yPos}
        handleClick={() => handleClick(id)}
      />
    );
  },
);
