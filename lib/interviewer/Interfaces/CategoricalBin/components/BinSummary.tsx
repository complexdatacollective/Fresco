import { type NcNode } from '@codaco/shared-consts';
import { useNodeLabel } from '../../Anonymisation/useNodeLabel';

type BinSummaryProps = {
  nodes: NcNode[];
};

const BinSummary = ({ nodes }: BinSummaryProps) => {
  const firstNode = nodes[0];
  const label = useNodeLabel(firstNode!);
  const count = nodes.length - 1;

  return (
    <p className="text-sm opacity-80">
      {label}
      {count > 0 ? ` and ${count} other${count > 1 ? 's' : ''}` : ''}
    </p>
  );
};

export default BinSummary;
