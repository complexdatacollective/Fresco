import { type Stage } from '@codaco/protocol-validation';
import type {
  EntityAttributesProperty,
  EntityPrimaryKey,
  NcEdge,
  NcNode,
  VariableValue,
} from '@codaco/shared-consts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useToast } from '~/components/ui/use-toast';
import {
  type FamilyTreeCensusStageMetadata,
  updateNode as updateNetworkNode,
} from '~/lib/interviewer/ducks/modules/session';
import { getStageMetadata } from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { useFamilyTreeStore } from '../FamilyTreeProvider';
import type { Relationship } from '../store';
import AddFamilyMemberForm from './AddFamilyMemberForm';
import { CensusForm } from './CensusForm';
import EdgeRenderer from './EdgeRenderer';
import FamilyTreeNode, { type FamilyTreeNodeType } from './FamilyTreeNode';
import FamilyTreeNodeForm from './FamilyTreeNodeForm';

const isFamilyTreeStageMetadata = (
  stageMetadata: unknown,
): stageMetadata is FamilyTreeCensusStageMetadata => {
  return typeof stageMetadata === 'object' && stageMetadata != null;
};

export const FamilyTreeShells = (props: {
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>;
  diseaseVariable: string | null;
  stepIndex: number;
  networkNodes: NcNode[];
  networkEdges: NcEdge[];
}) => {
  const { stage, diseaseVariable, stepIndex, networkNodes, networkEdges } =
    props;
  const nodesMap = useFamilyTreeStore((state) => state.network.nodes);
  const addShellNode = useFamilyTreeStore((state) => state.addNode);
  const addShellEdge = useFamilyTreeStore((state) => state.addEdge);
  const runLayout = useFamilyTreeStore((state) => state.runLayout);
  const updateShellNode = useFamilyTreeStore((state) => state.updateNode);
  const getShellIdByNetworkId = useFamilyTreeStore(
    (state) => state.getShellIdByNetworkId,
  );
  const clearNetwork = useFamilyTreeStore((state) => state.clearNetwork);
  const existingNodes = networkNodes.length > 0;
  const nodes: FamilyTreeNodeType[] = Array.from(
    nodesMap.entries().map(([id, node]) => ({ id, ...node })),
  );
  const [selectedNode, setSelectedNode] = useState<FamilyTreeNodeType | void>(
    undefined,
  );
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const stageMetadata = useSelector(getStageMetadata);
  const [hydratedOnce, setHydratedOnce] = useState(false);

  const shouldHydrate = useMemo(() => {
    const haveReduxNodes = networkNodes.length > 0;
    const haveReduxEdges = networkEdges.length > 0;

    return haveReduxNodes && haveReduxEdges;
  }, [networkNodes.length, networkEdges.length]);

  useEffect(() => {
    setHydratedOnce(false);
  }, [stage.id]);

  const metadataByNetworkId = useMemo(() => {
    const map = new Map<
      string,
      {
        label: string;
        sex: 'male' | 'female';
        isEgo: boolean;
        readOnly: boolean;
      }
    >();

    if (isFamilyTreeStageMetadata(stageMetadata)) {
      const metaNodes = stageMetadata?.nodes ?? [];
      for (const node of metaNodes) {
        if (!node.interviewNetworkId) continue;
        map.set(node.interviewNetworkId, {
          label: node.label,
          sex: node.sex,
          isEgo: node.isEgo,
          readOnly: node.readOnly,
        });
      }
    }

    return map;
  }, [stageMetadata]);

  useEffect(() => {
    if (!shouldHydrate || hydratedOnce) return;

    clearNetwork();

    for (const netNode of networkNodes) {
      const id = netNode._uid;
      const metadataNode = metadataByNetworkId.get(id);
      const label = metadataNode?.label ?? '';
      const sex = metadataNode?.sex ?? 'female';
      const isEgo = metadataNode?.isEgo;
      const readOnly = metadataNode?.readOnly ?? false;
      const attributes = netNode.attributes ?? {};
      const diseaseVars =
        stage.diseaseNominationStep?.map((d) => d.variable) ?? [];
      const diseases = new Map<string, boolean>();
      const fields: Record<string, VariableValue> = {};

      for (const [key, value] of Object.entries(attributes)) {
        if (diseaseVars.includes(key)) {
          if (value === true || value === false || value === null) {
            diseases.set(key, value === true);
          }
        } else {
          fields[key] = value;
        }
      }

      addShellNode({
        id,
        label,
        sex,
        isEgo,
        readOnly,
        interviewNetworkId: id,
        name: (fields.name as string) ?? label,
        fields,
        diseases,
      });
    }

    for (const edge of networkEdges) {
      const relationship = (edge.attributes.relationship ??
        'parent') as Relationship;
      const id = `${edge.from}-${edge.to}-${relationship}`;
      addShellEdge({
        id,
        source: edge.from,
        target: edge.to,
        relationship,
      });
    }

    runLayout();
    setHydratedOnce(true);
  }, [
    shouldHydrate,
    networkNodes,
    networkEdges,
    metadataByNetworkId,
    addShellNode,
    addShellEdge,
    runLayout,
    clearNetwork,
    stage.diseaseNominationStep,
    hydratedOnce,
  ]);

  const updateNode = useCallback(
    async (payload: {
      nodeId: NcNode[EntityPrimaryKey];
      newAttributeData: NcNode[EntityAttributesProperty];
      diseaseValue: boolean;
    }) => {
      if (!diseaseVariable) return;

      try {
        const resultAction = await dispatch(updateNetworkNode(payload));

        // confirm network response before updating ui
        if (updateNetworkNode.fulfilled.match(resultAction)) {
          const shellId = getShellIdByNetworkId(payload.nodeId);
          if (shellId) {
            // merge new disease flag into existing map
            const currentShell = nodesMap.get(shellId);
            const mergedDiseases = new Map(currentShell?.diseases ?? []);
            mergedDiseases.set(diseaseVariable, payload.diseaseValue);

            // update shell node with merged map
            updateShellNode(shellId, { diseases: mergedDiseases });
          }
        } else {
          toast({
            title: 'Error',
            description:
              'There was an issue updating the node. Please try again.',
            variant: 'destructive',
          });
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error updating node:', err);
      }
    },
    [
      diseaseVariable,
      dispatch,
      getShellIdByNetworkId,
      nodesMap,
      updateShellNode,
      toast,
    ],
  );

  return (
    <>
      {stepIndex === 0 && <AddFamilyMemberForm />}
      {stepIndex === 1 && (
        <FamilyTreeNodeForm
          nodeType={stage.subject.type}
          selectedNode={selectedNode}
          form={stage.nameGenerationStep.form}
          onClose={() => {
            setSelectedNode(undefined);
          }}
        />
      )}
      <div className="census-node-canvas relative h-full w-full overflow-x-auto">
        <div className="relative h-full w-full">
          <EdgeRenderer />
          {nodes.map((node) => (
            <FamilyTreeNode
              key={node.id}
              placeholderId={node.id}
              name={node.name}
              label={node.label}
              isEgo={node.isEgo}
              allowDrag={node.readOnly !== true && stepIndex < 2}
              interviewNetworkId={node.interviewNetworkId}
              shape={node.sex === 'female' ? 'circle' : 'square'}
              x={node.x ?? 0}
              y={node.y ?? 0}
              selected={
                node.interviewNetworkId != null &&
                typeof diseaseVariable === 'string' &&
                node.diseases?.get(diseaseVariable)
              }
              handleClick={() => {
                if (stepIndex === 0) {
                  return;
                } else if (stepIndex === 1) {
                  setSelectedNode(node);
                } else if (
                  node.interviewNetworkId &&
                  diseaseVariable &&
                  !node.isEgo
                ) {
                  const diseaseValue = !node.diseases?.get(diseaseVariable);
                  const diseaseData: Record<string, VariableValue> = {
                    [diseaseVariable]: diseaseValue,
                  };
                  void updateNode({
                    nodeId: node.interviewNetworkId,
                    newAttributeData: diseaseData,
                    diseaseValue: diseaseValue,
                  });
                }
              }}
            />
          ))}
        </div>
      </div>
      <CensusForm stage={stage} showForm={!existingNodes} />
    </>
  );
};
