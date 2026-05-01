import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Node from '@codaco/fresco-ui/Node';
import { useDragSource } from '@codaco/fresco-ui/dnd/dnd';
import { useClickUnlessDragged } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/useClickUnlessDragged';
import { computeAllDisplayLabels } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/utils/getDisplayLabel';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { getNodeShapeDefinition } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';
import {
    getNodeColorSelector,
    resolveNodeShape,
} from '~/lib/interviewer/selectors/session';

export function AdoptionBrackets({ children }: { children: React.ReactNode }) {
  const bracketStyle =
    'absolute top-1 bottom-1 w-1.5 border-white/80 border-y-2';

  return (
    <div className="relative" aria-label="Adopted" role="img">
      <span className={`${bracketStyle} -left-2.5 border-l-2`} />
      {children}
      <span className={`${bracketStyle} -right-2.5 border-r-2`} />
    </div>
  );
}

/**
 * Icon for the ego (self) node in the family pedigree.
 * Based on the add-a-person icon (lib/ui/assets/icons/add-a-person-single.svg).
 *
 * Variants:
 * - "platinum": For colored backgrounds - uses platinum shades
 * - "slate": For white/platinum backgrounds - uses slate blue shades
 */
export function EgoIcon({
  className,
  variant = 'slate',
}: {
  className?: string;
  variant?: 'platinum' | 'slate';
}) {
  const colors =
    variant === 'platinum'
      ? {
          primary: 'var(--color-platinum)',
          secondary: 'var(--color-platinum-dark)',
        }
      : {
          primary: 'var(--color-slate-blue)',
          secondary: 'var(--color-slate-blue-dark)',
        };

  return (
    <svg
      viewBox="0 0 139.8 167.5"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Head - upper half */}
      <path
        fill={colors.primary}
        d="M69.9,0C46.1,0,26.8,21.4,26.8,47.8c-0.1,11.6,3.8,22.9,11.1,32l64-64C94,6.1,82.6,0,69.9,0z"
      />
      {/* Head - lower half */}
      <path
        fill={colors.secondary}
        d="M37.9,79.8c7.9,9.7,19.3,15.8,32,15.8c23.8,0,43.1-21.4,43.1-47.8c0.1-11.6-3.8-22.9-11.1-32L37.9,79.8z"
      />
      {/* Neck */}
      <path
        fill={colors.secondary}
        d="M94,103.4c-4.1,0-13.6-7.5-10.9-11.3H56.6c2.7,3.8-6.8,11.3-10.9,11.3l24.2,10.8L94,103.4z"
      />
      {/* Body - left side */}
      <path
        fill={colors.primary}
        d="M100.3,105.3l-58.6,58.6C26.5,160,12.3,152.8,0,143c9.2-20.1,27.7-35.5,50.2-41.3c5.9,3.8,12.7,5.8,19.7,5.9c7-0.1,13.8-2.1,19.7-5.9C93.3,102.7,96.8,103.9,100.3,105.3z"
      />
      {/* Body - right side */}
      <path
        fill={colors.secondary}
        d="M139.8,143c-27.6,22-63.9,29.8-98.1,20.9l58.6-58.6C117.8,112.5,131.9,125.9,139.8,143z"
      />
    </svg>
  );
}

/**
 * Computes display labels for all nodes in the pedigree.
 * Named nodes use their name. Unnamed nodes get a BFS-based relationship
 * label with numbering when multiple nodes share the same role.
 */
export function computeNodeDisplayLabels(
  nodes: Map<string, NcNode>,
  edges: Map<string, NcEdge>,
  variableConfig: VariableConfig,
): Map<string, string> {
  const egoEntry = [...nodes.entries()].find(
    ([, n]) => n.attributes[variableConfig.egoVariable] === true,
  );
  if (!egoEntry) return new Map();
  const egoId = egoEntry[0];

  const computedLabels = computeAllDisplayLabels(
    egoId,
    nodes,
    edges,
    variableConfig,
  );

  const labels = new Map<string, string>();
  const roleBuckets = new Map<string, string[]>();

  for (const [nodeId, node] of nodes) {
    if (node.attributes[variableConfig.egoVariable] === true) continue;

    const storedName = node.attributes[variableConfig.nodeLabelVariable] as
      | string
      | undefined;
    if (storedName) {
      labels.set(nodeId, storedName);
      continue;
    }

    const role = computedLabels.get(nodeId) ?? 'Family Member';
    const bucket = roleBuckets.get(role) ?? [];
    bucket.push(nodeId);
    roleBuckets.set(role, bucket);
  }

  for (const [role, nodeIds] of roleBuckets) {
    if (nodeIds.length === 1) {
      labels.set(nodeIds[0]!, role);
    } else {
      nodeIds.forEach((id, i) => {
        labels.set(id, `${role} #${i + 1}`);
      });
    }
  }

  return labels;
}

type PedigreeNodeProps = {
  node: NcNode & { id: string };
  isEgo?: boolean;
  displayLabel: string;
  allowDrag: boolean;
  isAdopted?: boolean;
  selected?: boolean;
  onClick?: () => void;
};

export default function PedigreeNode({
  node,
  isEgo,
  displayLabel,
  allowDrag,
  isAdopted,
  selected,
  onClick,
  ...rest
}: PedigreeNodeProps) {
  const { id } = node;

  const nodeColor = useSelector(getNodeColorSelector);
  const shapeDef = useSelector(getNodeShapeDefinition);

  const shape = useMemo(() => {
    if (!shapeDef) return 'square';
    return resolveNodeShape(shapeDef, node.attributes);
  }, [shapeDef, node.attributes]);

  useClickUnlessDragged();

  const { dragProps } = useDragSource({
    type: 'FAMILY_TREE_NODE',
    metadata: { itemType: 'FAMILY_TREE_NODE', placeholderId: id },
    announcedName: displayLabel,
    disabled: !allowDrag,
  });

  const nodeElement = (
    <Node
      color={nodeColor}
      size="sm"
      label={isEgo ? '' : displayLabel}
      ariaLabel={displayLabel}
      shape={shape}
      selected={selected}
      {...(allowDrag ? dragProps : {})}
      {...rest}
    >
      {isEgo && (
        <EgoIcon
          className="pointer-events-none absolute top-1/2 left-1/2 size-12 -translate-1/2"
          variant="platinum"
        />
      )}
    </Node>
  );

  const wrappedNode = isAdopted ? (
    <AdoptionBrackets>{nodeElement}</AdoptionBrackets>
  ) : (
    nodeElement
  );

  return (
    <div onClick={onClick} role={onClick ? 'button' : undefined}>
      {wrappedNode}
    </div>
  );
}
