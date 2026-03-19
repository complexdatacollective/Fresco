import {
  type Filter,
  type SkipLogic,
  type Stage,
} from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcEdge,
  type NcNetwork,
  type NcNode,
} from '@codaco/shared-consts';
import { v4 as uuid } from 'uuid';
import { ValueGenerator } from '~/lib/interviewer/utils/SyntheticInterview/ValueGenerator';
import { type VariableEntry } from '~/lib/interviewer/utils/SyntheticInterview/types';
import getFilter from '~/lib/network-query/filter';
import getQuery from '~/lib/network-query/query';

type NcAttributeValue =
  | string
  | boolean
  | number
  | number[]
  | (string | number | boolean)[]
  | Record<string, string | number | boolean>
  | { x: number; y: number }
  | null;

type VariableDefinition = {
  name: string;
  type: string;
  options?: { label: string; value: string | number }[];
  validation?: Record<string, unknown>;
  component?: string;
};

type Codebook = {
  node?: Record<
    string,
    {
      displayVariable?: string;
      color?: string;
      variables?: Record<string, VariableDefinition>;
    }
  >;
  edge?: Record<
    string,
    {
      color?: string;
      variables?: Record<string, VariableDefinition>;
    }
  >;
  ego?: {
    variables?: Record<string, VariableDefinition>;
  };
};

type GenerateNetworkOptions = {
  simulateDropOut?: boolean;
  respectSkipLogicAndFiltering?: boolean;
};

type GenerateNetworkResult = {
  network: NcNetwork;
  stageMetadata: Record<string, unknown> | null;
  stagesCompleted: number;
  droppedOut: boolean;
};

function toVariableEntry(
  id: string,
  variable: VariableDefinition,
): VariableEntry {
  return {
    id,
    name: variable.name,
    type: variable.type as VariableEntry['type'],
    component: variable.component as VariableEntry['component'],
    options: variable.options,
    validation: variable.validation,
  };
}

function generateValue(
  valueGen: ValueGenerator,
  entry: VariableEntry,
  index: number,
): NcAttributeValue {
  return valueGen.generateForVariable(entry, index) as NcAttributeValue;
}

function generateAttributes(
  variables: Record<string, VariableDefinition> | undefined,
  valueGen: ValueGenerator,
  index: number,
): Record<string, NcAttributeValue> {
  if (!variables) return {};
  const attrs: Record<string, NcAttributeValue> = {};
  for (const [varId, variable] of Object.entries(variables)) {
    const entry = toVariableEntry(varId, variable);
    attrs[varId] = generateValue(valueGen, entry, index);
  }
  return attrs;
}

function getStageBehaviours(
  stage: Stage,
): { minNodes?: number; maxNodes?: number } | undefined {
  const stageRecord = stage as Record<string, unknown>;
  return stageRecord.behaviours as
    | { minNodes?: number; maxNodes?: number }
    | undefined;
}

type AdditionalAttribute = { variable: string; value: boolean };

function getPromptAdditionalAttributes(
  prompt: Record<string, unknown>,
): Record<string, boolean> {
  const additional = prompt.additionalAttributes as
    | AdditionalAttribute[]
    | undefined;
  if (!additional) return {};
  return additional.reduce(
    (acc, { variable, value }) => ({ ...acc, [variable]: value }),
    {} as Record<string, boolean>,
  );
}

function createNodesForStage(
  codebook: Codebook,
  stage: Stage,
  prompt: Record<string, unknown>,
  valueGen: ValueGenerator,
  existingNodeCount: number,
  stageNodeCount: number,
): NcNode[] {
  const stageRecord = stage as Record<string, unknown>;
  const subject = stageRecord.subject as
    | { entity: string; type: string }
    | undefined;
  if (subject?.entity !== 'node') return [];

  const nodeType = subject.type;
  const nodeTypeDef = codebook.node?.[nodeType];
  if (!nodeTypeDef) return [];

  const behaviours = getStageBehaviours(stage);
  const minNodes = behaviours?.minNodes ?? 1;
  const maxNodes = behaviours?.maxNodes ?? 8;
  const remaining = maxNodes - stageNodeCount;
  if (remaining <= 0) return [];

  const count = Math.min(valueGen.randomInt(minNodes, maxNodes), remaining);
  const promptId = (prompt.id as string) ?? uuid();
  const additionalAttrs = getPromptAdditionalAttributes(prompt);
  const newNodes: NcNode[] = [];

  for (let i = 0; i < count; i++) {
    const nodeIndex = existingNodeCount + i;
    const attrs = generateAttributes(
      nodeTypeDef.variables,
      valueGen,
      nodeIndex,
    );

    Object.assign(attrs, additionalAttrs);

    newNodes.push({
      [entityPrimaryKeyProperty]: uuid(),
      type: nodeType,
      [entityAttributesProperty]: attrs,
      stageId: stageRecord.id as string,
      promptIDs: [promptId],
    } as NcNode);
  }

  return newNodes;
}

function createEdgesForPairs(
  nodes: NcNode[],
  edgeType: string,
  probability: number,
  valueGen: ValueGenerator,
  edgeVariables?: Record<string, VariableDefinition>,
): { edges: NcEdge[]; negativeIndices: [number, number][] } {
  const edges: NcEdge[] = [];
  const negativeIndices: [number, number][] = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (valueGen.randomFloat(0, 1) < probability) {
        const attrs = edgeVariables
          ? generateAttributes(edgeVariables, valueGen, edges.length)
          : {};

        edges.push({
          [entityPrimaryKeyProperty]: uuid(),
          type: edgeType,
          from: nodes[i]![entityPrimaryKeyProperty],
          to: nodes[j]![entityPrimaryKeyProperty],
          [entityAttributesProperty]: attrs,
        } as NcEdge);
      } else {
        negativeIndices.push([i, j]);
      }
    }
  }

  return { edges, negativeIndices };
}

function getNodesOfType(nodes: NcNode[], nodeType: string): NcNode[] {
  return nodes.filter((n) => n.type === nodeType);
}

function getEdgesOfType(edges: NcEdge[], edgeType: string): NcEdge[] {
  return edges.filter((e) => e.type === edgeType);
}

function getStageSubject(
  stage: Stage,
): { entity: string; type: string } | undefined {
  const stageRecord = stage as Record<string, unknown>;
  return stageRecord.subject as { entity: string; type: string } | undefined;
}

function getStagePrompts(stage: Stage): Record<string, unknown>[] {
  const stageRecord = stage as Record<string, unknown>;
  const prompts = stageRecord.prompts as Record<string, unknown>[] | undefined;
  return prompts ?? [];
}

function getStageType(stage: Stage): string {
  return (stage as Record<string, unknown>).type as string;
}

function getStageId(stage: Stage): string {
  return (stage as Record<string, unknown>).id as string;
}

function getStageForm(
  stage: Stage,
): { fields: { variable: string }[] } | undefined {
  return (stage as Record<string, unknown>).form as
    | { fields: { variable: string }[] }
    | undefined;
}

function buildCurrentNetwork(
  egoUid: string,
  egoAttributes: Record<string, unknown>,
  nodes: NcNode[],
  edges: NcEdge[],
): NcNetwork {
  return {
    ego: {
      [entityPrimaryKeyProperty]: egoUid,
      [entityAttributesProperty]: egoAttributes,
    } as NcNetwork['ego'],
    nodes,
    edges,
  };
}

function getStageFilteredNodes(
  nodes: NcNode[],
  edges: NcEdge[],
  egoUid: string,
  egoAttributes: Record<string, unknown>,
  stage: Stage,
  nodeType: string,
  respectFiltering: boolean,
): NcNode[] {
  if (!respectFiltering) return getNodesOfType(nodes, nodeType);

  const stageRecord = stage as Record<string, unknown>;
  const stageFilter = stageRecord.filter as Filter | undefined;
  if (!stageFilter) return getNodesOfType(nodes, nodeType);

  const currentNetwork = buildCurrentNetwork(
    egoUid,
    egoAttributes,
    nodes,
    edges,
  );
  const filtered = getFilter(stageFilter)(currentNetwork);
  return getNodesOfType(filtered.nodes, nodeType);
}

function getStageFilteredEdges(
  nodes: NcNode[],
  edges: NcEdge[],
  egoUid: string,
  egoAttributes: Record<string, unknown>,
  stage: Stage,
  edgeType: string,
  respectFiltering: boolean,
): NcEdge[] {
  if (!respectFiltering) return getEdgesOfType(edges, edgeType);

  const stageRecord = stage as Record<string, unknown>;
  const stageFilter = stageRecord.filter as Filter | undefined;
  if (!stageFilter) return getEdgesOfType(edges, edgeType);

  const currentNetwork = buildCurrentNetwork(
    egoUid,
    egoAttributes,
    nodes,
    edges,
  );
  const filtered = getFilter(stageFilter)(currentNetwork);
  return getEdgesOfType(filtered.edges, edgeType);
}

export function generateNetwork(
  codebook: Codebook,
  stages: Stage[],
  seed?: number,
  options: GenerateNetworkOptions = {},
): GenerateNetworkResult {
  const valueGen = new ValueGenerator(
    seed ?? Math.floor(Math.random() * 100000),
  );
  const nodes: NcNode[] = [];
  const edges: NcEdge[] = [];
  const egoAttributes: Record<string, unknown> = {};
  const stageMetadata: Record<string, unknown> = {};
  const egoUid = uuid();

  const { simulateDropOut = false, respectSkipLogicAndFiltering = false } =
    options;
  const totalStages = stages.length;
  let stagesCompleted = 0;
  let droppedOut = false;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]!;
    const stageType = getStageType(stage);
    const stageId = getStageId(stage);
    const prompts = getStagePrompts(stage);

    if (respectSkipLogicAndFiltering) {
      const stageRecord = stage as Record<string, unknown>;
      const skipLogic = stageRecord.skipLogic as SkipLogic | undefined;

      if (skipLogic) {
        const currentNetwork = buildCurrentNetwork(
          egoUid,
          egoAttributes,
          nodes,
          edges,
        );
        const result = getQuery(skipLogic.filter)(currentNetwork);
        const skipOnMatch = skipLogic.action === 'SKIP';
        const isSkipped = (skipOnMatch && result) || (!skipOnMatch && !result);

        if (isSkipped) continue;
      }
    }

    if (simulateDropOut) {
      const dropOutChance = ((i + 1) / totalStages) * 0.15;
      if (valueGen.randomFloat(0, 1) < dropOutChance) {
        droppedOut = true;
        break;
      }
    }

    stagesCompleted++;

    switch (stageType) {
      case 'NameGenerator':
      case 'NameGeneratorQuickAdd':
      case 'NameGeneratorRoster': {
        let stageNodeCount = 0;
        for (const prompt of prompts) {
          const newNodes = createNodesForStage(
            codebook,
            stage,
            prompt,
            valueGen,
            nodes.length,
            stageNodeCount,
          );
          stageNodeCount += newNodes.length;

          const form = getStageForm(stage);
          if (form) {
            const subject = getStageSubject(stage);
            if (subject?.entity === 'node') {
              const nodeTypeDef = codebook.node?.[subject.type];
              if (nodeTypeDef?.variables) {
                const formVarIds = new Set(form.fields.map((f) => f.variable));
                for (const node of newNodes) {
                  const attrs = node[entityAttributesProperty];
                  for (const varId of formVarIds) {
                    const varDef = nodeTypeDef.variables[varId];
                    if (varDef && !(varId in attrs)) {
                      const entry = toVariableEntry(varId, varDef);
                      attrs[varId] = generateValue(
                        valueGen,
                        entry,
                        nodes.length,
                      );
                    }
                  }
                }
              }
            }
          }

          nodes.push(...newNodes);
        }
        break;
      }

      case 'Sociogram': {
        const subject = getStageSubject(stage);
        if (subject?.entity !== 'node') break;

        const subjectNodes = getStageFilteredNodes(
          nodes,
          edges,
          egoUid,
          egoAttributes,
          stage,
          subject.type,
          respectSkipLogicAndFiltering,
        );

        for (const prompt of prompts) {
          const promptEdges = prompt.edges as
            | { create?: string; display?: string[] }
            | undefined;
          if (promptEdges?.create) {
            const { edges: newEdges } = createEdgesForPairs(
              subjectNodes,
              promptEdges.create,
              valueGen.randomFloat(0.3, 0.5),
              valueGen,
              codebook.edge?.[promptEdges.create]?.variables,
            );
            edges.push(...newEdges);
          }

          const layout = prompt.layout as
            | { layoutVariable?: string }
            | undefined;
          if (layout?.layoutVariable) {
            for (const node of subjectNodes) {
              node[entityAttributesProperty][layout.layoutVariable] = {
                x: valueGen.randomFloat(0.1, 0.9),
                y: valueGen.randomFloat(0.1, 0.9),
              };
            }
          }
        }
        break;
      }

      case 'DyadCensus':
      case 'OneToManyDyadCensus': {
        const subject = getStageSubject(stage);
        if (subject?.entity !== 'node') break;

        const subjectNodes = getStageFilteredNodes(
          nodes,
          edges,
          egoUid,
          egoAttributes,
          stage,
          subject.type,
          respectSkipLogicAndFiltering,
        );

        for (const prompt of prompts) {
          const createEdgeType = prompt.createEdge as string | undefined;
          if (!createEdgeType) continue;

          const probability = valueGen.randomFloat(0.4, 0.6);
          const { edges: newEdges, negativeIndices } = createEdgesForPairs(
            subjectNodes,
            createEdgeType,
            probability,
            valueGen,
            codebook.edge?.[createEdgeType]?.variables,
          );
          edges.push(...newEdges);

          if (negativeIndices.length > 0) {
            const promptId = (prompt.id as string) ?? stageId;
            stageMetadata[promptId] = { negativeIndices };
          }
        }
        break;
      }

      case 'TieStrengthCensus': {
        const subject = getStageSubject(stage);
        if (subject?.entity !== 'node') break;

        const subjectNodes = getStageFilteredNodes(
          nodes,
          edges,
          egoUid,
          egoAttributes,
          stage,
          subject.type,
          respectSkipLogicAndFiltering,
        );

        for (const prompt of prompts) {
          const createEdgeType = prompt.createEdge as string | undefined;
          const edgeVariable = prompt.edgeVariable as string | undefined;
          if (!createEdgeType) continue;

          const probability = valueGen.randomFloat(0.4, 0.6);
          const edgeTypeDef = codebook.edge?.[createEdgeType];
          const { edges: newEdges, negativeIndices } = createEdgesForPairs(
            subjectNodes,
            createEdgeType,
            probability,
            valueGen,
            edgeTypeDef?.variables,
          );

          if (edgeVariable && edgeTypeDef?.variables?.[edgeVariable]) {
            const varDef = edgeTypeDef.variables[edgeVariable];
            for (let edgeIdx = 0; edgeIdx < newEdges.length; edgeIdx++) {
              const entry = toVariableEntry(edgeVariable, varDef);
              newEdges[edgeIdx]![entityAttributesProperty][edgeVariable] =
                generateValue(valueGen, entry, edgeIdx);
            }
          }

          edges.push(...newEdges);

          if (negativeIndices.length > 0) {
            const promptId = (prompt.id as string) ?? stageId;
            stageMetadata[promptId] = { negativeIndices };
          }
        }
        break;
      }

      case 'OrdinalBin': {
        const subject = getStageSubject(stage);
        if (subject?.entity !== 'node') break;

        const subjectNodes = getStageFilteredNodes(
          nodes,
          edges,
          egoUid,
          egoAttributes,
          stage,
          subject.type,
          respectSkipLogicAndFiltering,
        );
        const nodeTypeDef = codebook.node?.[subject.type];

        for (const prompt of prompts) {
          const varId = prompt.variable as string | undefined;
          if (!varId || !nodeTypeDef?.variables?.[varId]) continue;

          const varDef = nodeTypeDef.variables[varId];
          const options = varDef.options ?? [];
          if (options.length === 0) continue;

          for (const node of subjectNodes) {
            const optionIndex = valueGen.randomInt(0, options.length - 1);
            node[entityAttributesProperty][varId] = options[optionIndex]!.value;
          }
        }
        break;
      }

      case 'CategoricalBin': {
        const subject = getStageSubject(stage);
        if (subject?.entity !== 'node') break;

        const subjectNodes = getStageFilteredNodes(
          nodes,
          edges,
          egoUid,
          egoAttributes,
          stage,
          subject.type,
          respectSkipLogicAndFiltering,
        );
        const nodeTypeDef = codebook.node?.[subject.type];

        for (const prompt of prompts) {
          const varId = prompt.variable as string | undefined;
          if (!varId || !nodeTypeDef?.variables?.[varId]) continue;

          const varDef = nodeTypeDef.variables[varId];
          const options = varDef.options ?? [];
          if (options.length === 0) continue;

          for (const node of subjectNodes) {
            const count = valueGen.randomInt(1, Math.min(2, options.length));
            const picked: (number | string)[] = [];
            const startIdx = valueGen.randomInt(0, options.length - 1);
            for (let c = 0; c < count; c++) {
              picked.push(options[(startIdx + c) % options.length]!.value);
            }
            node[entityAttributesProperty][varId] = picked;
          }
        }
        break;
      }

      case 'EgoForm': {
        const egoVars = codebook.ego?.variables;
        if (egoVars) {
          const attrs = generateAttributes(egoVars, valueGen, 0);
          Object.assign(egoAttributes, attrs);
        }
        break;
      }

      case 'AlterForm': {
        const subject = getStageSubject(stage);
        if (subject?.entity !== 'node') break;

        const subjectNodes = getStageFilteredNodes(
          nodes,
          edges,
          egoUid,
          egoAttributes,
          stage,
          subject.type,
          respectSkipLogicAndFiltering,
        );
        const form = getStageForm(stage);
        if (!form) break;

        const nodeTypeDef = codebook.node?.[subject.type];
        if (!nodeTypeDef?.variables) break;

        const formVarIds = form.fields.map((f) => f.variable);

        for (let i = 0; i < subjectNodes.length; i++) {
          const node = subjectNodes[i]!;
          for (const varId of formVarIds) {
            const varDef = nodeTypeDef.variables[varId];
            if (varDef) {
              const entry = toVariableEntry(varId, varDef);
              node[entityAttributesProperty][varId] = generateValue(
                valueGen,
                entry,
                i,
              );
            }
          }
        }
        break;
      }

      case 'AlterEdgeForm': {
        const subject = getStageSubject(stage);
        if (subject?.entity !== 'edge') break;

        const subjectEdges = getStageFilteredEdges(
          nodes,
          edges,
          egoUid,
          egoAttributes,
          stage,
          subject.type,
          respectSkipLogicAndFiltering,
        );
        const form = getStageForm(stage);
        if (!form) break;

        const edgeTypeDef = codebook.edge?.[subject.type];
        if (!edgeTypeDef?.variables) break;

        const formVarIds = form.fields.map((f) => f.variable);

        for (let i = 0; i < subjectEdges.length; i++) {
          const edge = subjectEdges[i]!;
          for (const varId of formVarIds) {
            const varDef = edgeTypeDef.variables[varId];
            if (varDef) {
              const entry = toVariableEntry(varId, varDef);
              edge[entityAttributesProperty][varId] = generateValue(
                valueGen,
                entry,
                i,
              );
            }
          }
        }
        break;
      }

      case 'FamilyTreeCensus': {
        const stageRecord = stage as Record<string, unknown>;
        const nodeCount = valueGen.randomInt(4, 10);

        const subject = getStageSubject(stage);
        const nodeType = subject?.entity === 'node' ? subject.type : undefined;
        const nodeTypeDef = nodeType ? codebook.node?.[nodeType] : undefined;

        const edgeTypeRef = stageRecord.edgeType as
          | { entity: string; type: string }
          | undefined;
        const edgeType = edgeTypeRef?.type;

        const familyNodes: NcNode[] = [];
        for (let i = 0; i < nodeCount; i++) {
          const attrs = generateAttributes(
            nodeTypeDef?.variables,
            valueGen,
            nodes.length + i,
          );

          const nodeIsEgoVar = stageRecord.nodeIsEgoVariable as
            | string
            | undefined;
          if (nodeIsEgoVar && i === 0) {
            attrs[nodeIsEgoVar] = true;
          }

          familyNodes.push({
            [entityPrimaryKeyProperty]: uuid(),
            type: nodeType ?? 'person',
            [entityAttributesProperty]: attrs,
            stageId,
          } as NcNode);
        }

        nodes.push(...familyNodes);

        if (edgeType && familyNodes.length > 1) {
          for (let i = 1; i < familyNodes.length; i++) {
            const parentIdx = valueGen.randomInt(
              0,
              Math.min(i - 1, familyNodes.length - 1),
            );
            edges.push({
              [entityPrimaryKeyProperty]: uuid(),
              type: edgeType,
              from: familyNodes[parentIdx]![entityPrimaryKeyProperty],
              to: familyNodes[i]![entityPrimaryKeyProperty],
              [entityAttributesProperty]: {},
            } as NcEdge);
          }
        }
        break;
      }

      case 'Geospatial': {
        const subject = getStageSubject(stage);
        if (subject?.entity !== 'node') break;

        const subjectNodes = getStageFilteredNodes(
          nodes,
          edges,
          egoUid,
          egoAttributes,
          stage,
          subject.type,
          respectSkipLogicAndFiltering,
        );

        for (const prompt of prompts) {
          const varId = prompt.variable as string | undefined;
          if (!varId) continue;

          for (const node of subjectNodes) {
            node[entityAttributesProperty][varId] = {
              x: valueGen.randomFloat(-180, 180),
              y: valueGen.randomFloat(-90, 90),
            };
          }
        }
        break;
      }

      case 'Information':
      case 'Anonymisation':
      case 'Narrative':
        break;

      default:
        break;
    }
  }

  return {
    network: {
      ego: {
        [entityPrimaryKeyProperty]: egoUid,
        [entityAttributesProperty]: egoAttributes,
      } as NcNetwork['ego'],
      nodes,
      edges,
    },
    stageMetadata: Object.keys(stageMetadata).length > 0 ? stageMetadata : null,
    stagesCompleted,
    droppedOut,
  };
}
