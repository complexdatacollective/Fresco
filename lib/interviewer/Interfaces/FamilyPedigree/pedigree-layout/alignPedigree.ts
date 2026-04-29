import {
  type Hints,
  type PedigreeInput,
  type PedigreeLayout,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/types';
import { sugiyamaLayout } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/sugiyamaLayout';

export function alignPedigree(
  ped: PedigreeInput,
  _options: {
    packed?: boolean;
    width?: number;
    align?: boolean | number[];
    hints?: Hints;
  } = {},
): PedigreeLayout {
  return sugiyamaLayout(ped);
}
