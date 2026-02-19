import { type Stage } from '@codaco/protocol-validation';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNetwork,
  type VariableValue,
} from '@codaco/shared-consts';
import {
  COMPONENT_TO_VARIABLE_TYPE,
  DEFAULT_CATEGORICAL_OPTIONS,
  DEFAULT_ORDINAL_OPTIONS,
  EDGE_COLORS,
  NODE_COLORS,
} from './constants';
import { createMockStore } from './createMockStore';
import {
  type AddEdgeTypeInput,
  type AddNodeTypeInput,
  type AddPresetInput,
  type AddPromptInput,
  type AddStageInput,
  type AddVariableInput,
  type ComponentType,
  type EdgeEntry,
  type EdgeTypeEntry,
  type FormFieldInput,
  type GetSessionInput,
  type NameGeneratorPromptEntry,
  type NodeEntry,
  type NodeTypeEntry,
  type PresetEntry,
  type SociogramPromptEntry,
  type StageEntry,
  type StageType,
  type VariableEntry,
  type VariableType,
} from './types';
import { ValueGenerator } from './ValueGenerator';

export type VariableRef = {
  id: string;
};

export type NodeTypeHandle = {
  id: string;
  addVariable: (opts?: AddVariableInput) => VariableRef;
};

export type EdgeTypeHandle = {
  id: string;
};

type StageHandleBase = {
  id: string;
  stageEntry: StageEntry;
};

type NameGeneratorHandle = StageHandleBase & {
  addFormField: (opts: {
    component: ComponentType;
    variable?: string;
    prompt?: string;
  }) => void;
  addPrompt: (opts?: AddPromptInput) => void;
  addPanel: (opts?: { title?: string; dataSource?: string }) => void;
};

type SociogramHandle = StageHandleBase & {
  addPrompt: (opts?: AddPromptInput) => void;
};

type NarrativeHandle = StageHandleBase & {
  addPreset: (opts?: AddPresetInput) => void;
};

type StageHandleMap = {
  NameGenerator: NameGeneratorHandle;
  Sociogram: SociogramHandle;
  Narrative: NarrativeHandle;
};

export class SyntheticInterview {
  private seed: number;
  private idCounter = 0;
  private valueGen: ValueGenerator;
  private nodeTypes = new Map<string, NodeTypeEntry>();
  private edgeTypes = new Map<string, EdgeTypeEntry>();
  private stages: StageEntry[] = [];
  private nodes: NodeEntry[] = [];
  private edges: EdgeEntry[] = [];
  private assets: Record<string, unknown>[] = [];
  private nodeTypeCounter = 0;
  private edgeTypeCounter = 0;

  constructor(seed = 42) {
    this.seed = seed;
    this.valueGen = new ValueGenerator(seed);
  }

  private nextId(prefix: string): string {
    this.idCounter++;
    return `${prefix}-${this.seed}-${this.idCounter}`;
  }

  // --- Manual codebook API ---

  addNodeType(opts?: AddNodeTypeInput): NodeTypeHandle {
    const id = this.nextId('node-type');
    const colorIndex = this.nodeTypeCounter % NODE_COLORS.length;
    this.nodeTypeCounter++;

    const entry: NodeTypeEntry = {
      id,
      name: opts?.name ?? `Person ${this.nodeTypeCounter}`,
      color: opts?.color ?? NODE_COLORS[colorIndex]!,
      displayVariable: '', // will be set after creating display variable
      variables: new Map(),
    };

    // Auto-create display variable
    if (opts?.displayVariable) {
      entry.displayVariable = opts.displayVariable;
    } else {
      const displayVarId = this.nextId('var');
      entry.variables.set(displayVarId, {
        id: displayVarId,
        name: 'Name',
        type: 'text',
      });
      entry.displayVariable = displayVarId;
    }

    this.nodeTypes.set(id, entry);

    const handle: NodeTypeHandle = {
      id,
      addVariable: (varOpts?: AddVariableInput) =>
        this.addVariableToNodeType(id, varOpts),
    };

    return handle;
  }

  addEdgeType(opts?: AddEdgeTypeInput): EdgeTypeHandle {
    const id = this.nextId('edge-type');
    const colorIndex = this.edgeTypeCounter % EDGE_COLORS.length;
    this.edgeTypeCounter++;

    const entry: EdgeTypeEntry = {
      id,
      name: opts?.name ?? `Edge ${this.edgeTypeCounter}`,
      color: opts?.color ?? EDGE_COLORS[colorIndex]!,
      variables: new Map(),
    };

    this.edgeTypes.set(id, entry);

    return { id };
  }

  addVariableToNodeType(
    nodeTypeId: string,
    opts?: AddVariableInput,
  ): VariableRef {
    const nodeType = this.nodeTypes.get(nodeTypeId);
    if (!nodeType) {
      throw new Error(`Node type "${nodeTypeId}" not found`);
    }

    const varId = this.nextId('var');
    const type = this.resolveVariableType(opts);
    const options = this.resolveOptions(type, opts?.options);

    const entry: VariableEntry = {
      id: varId,
      name: opts?.name ?? this.defaultVariableName(type),
      type,
      component: opts?.component,
      options,
      validation: opts?.validation,
    };

    nodeType.variables.set(varId, entry);
    return { id: varId };
  }

  // --- Stage API ---

  addStage<T extends StageType>(
    type: T,
    opts?: AddStageInput,
  ): StageHandleMap[T] {
    const stageId = this.nextId('stage');

    // Resolve subject: auto-create node type if needed
    let subject = opts?.subject;
    if (!subject) {
      let nodeTypeId: string;
      if (this.nodeTypes.size > 0) {
        nodeTypeId = this.nodeTypes.keys().next().value!;
      } else {
        nodeTypeId = this.addNodeType().id;
      }
      subject = { entity: 'node', type: nodeTypeId };
    }

    const entry: StageEntry = {
      id: stageId,
      type,
      label: opts?.label ?? type,
      subject,
      prompts: [],
      presets: [],
      panels: [],
      background: opts?.background,
      behaviours: opts?.behaviours,
      initialNodes: opts?.initialNodes ?? 0,
      initialEdges: opts?.initialEdges ?? [],
    };

    // Handle form fields for NameGenerator
    if (opts?.form) {
      const fields = opts.form.fields.map((f) =>
        this.resolveFormField(f, subject.type),
      );
      entry.form = {
        title: opts.form.title ?? 'Add a person',
        fields,
      };
    }

    // Generate initial nodes
    if (entry.initialNodes > 0) {
      for (let i = 0; i < entry.initialNodes; i++) {
        this.nodes.push({
          uid: this.nextId('node'),
          type: subject.type,
          stageId,
          promptIDs: [],
          explicitAttributes: {},
        });
      }
    }

    // Generate initial edges
    if (entry.initialEdges.length > 0) {
      const stageNodes = this.nodes.filter((n) => n.stageId === stageId);
      for (const [fromIdx, toIdx] of entry.initialEdges) {
        const fromNode = stageNodes[fromIdx];
        const toNode = stageNodes[toIdx];
        if (fromNode && toNode) {
          // Use first edge type or create one
          let edgeTypeId: string;
          if (this.edgeTypes.size > 0) {
            edgeTypeId = this.edgeTypes.keys().next().value!;
          } else {
            edgeTypeId = this.addEdgeType().id;
          }
          this.edges.push({
            uid: this.nextId('edge'),
            type: edgeTypeId,
            from: fromNode.uid,
            to: toNode.uid,
            attributes: {},
          });
        }
      }
    }

    this.stages.push(entry);

    return this.createStageHandle(type, entry);
  }

  private createStageHandle<T extends StageType>(
    type: T,
    entry: StageEntry,
  ): StageHandleMap[T] {
    const base: StageHandleBase = {
      id: entry.id,
      stageEntry: entry,
    };

    switch (type) {
      case 'NameGenerator':
        return {
          ...base,
          addFormField: (opts: {
            component: ComponentType;
            variable?: string;
            prompt?: string;
          }) => {
            const field = this.resolveFormField(
              {
                component: opts.component,
                variable: opts.variable,
                prompt: opts.prompt,
              },
              entry.subject!.type,
            );
            entry.form ??= { title: 'Add a person', fields: [] };
            entry.form.fields.push(field);
          },
          addPrompt: (opts?: AddPromptInput) => {
            entry.prompts.push(this.resolvePrompt(opts, entry));
          },
          addPanel: (opts?: { title?: string; dataSource?: string }) => {
            entry.panels.push({
              id: this.nextId('panel'),
              title: opts?.title ?? 'Panel',
              dataSource: opts?.dataSource ?? 'existing',
            });
          },
        } as StageHandleMap[T];

      case 'Sociogram':
        return {
          ...base,
          addPrompt: (opts?: AddPromptInput) => {
            entry.prompts.push(this.resolveSociogramPrompt(opts, entry));
          },
        } as StageHandleMap[T];

      case 'Narrative':
        return {
          ...base,
          addPreset: (opts?: AddPresetInput) => {
            entry.presets.push(this.resolveNarrativePreset(opts, entry));
          },
        } as StageHandleMap[T];

      default:
        return base as StageHandleMap[T];
    }
  }

  // --- Resolution helpers ---

  private resolveVariableType(opts?: AddVariableInput): VariableType {
    if (opts?.type) return opts.type;
    if (opts?.component) return COMPONENT_TO_VARIABLE_TYPE[opts.component];
    return 'text';
  }

  private resolveOptions(
    type: VariableType,
    providedOptions?: AddVariableInput['options'],
  ) {
    if (providedOptions) return providedOptions;
    if (type === 'ordinal') return [...DEFAULT_ORDINAL_OPTIONS];
    if (type === 'categorical') return [...DEFAULT_CATEGORICAL_OPTIONS];
    return undefined;
  }

  private defaultVariableName(type: VariableType): string {
    const names: Record<string, string> = {
      text: 'Text Value',
      number: 'Number Value',
      scalar: 'Scale Value',
      boolean: 'Boolean Value',
      ordinal: 'Likert Value',
      categorical: 'Category',
      datetime: 'Date',
      layout: 'Layout',
      location: 'Location',
    };
    return names[type] ?? 'Value';
  }

  private resolveFormField(input: FormFieldInput, nodeTypeId: string) {
    let variableId = input.variable;
    if (!variableId) {
      // Auto-create variable from component type
      const ref = this.addVariableToNodeType(nodeTypeId, {
        component: input.component,
        name: input.prompt,
      });
      variableId = ref.id;
    }
    return {
      variable: variableId,
      component: input.component,
    };
  }

  private resolvePrompt(
    opts: AddPromptInput | undefined,
    entry: StageEntry,
  ): NameGeneratorPromptEntry {
    return {
      id: this.nextId('prompt'),
      text: opts?.text ?? this.valueGen.generatePromptText(entry.type),
    };
  }

  private resolveSociogramPrompt(
    opts: AddPromptInput | undefined,
    entry: StageEntry,
  ): SociogramPromptEntry {
    const promptId = this.nextId('prompt');
    const nodeTypeId = entry.subject!.type;

    // Resolve layout variable
    let layoutVariable: string | undefined;
    if (opts?.layout?.layoutVariable) {
      layoutVariable = opts.layout.layoutVariable;
    } else {
      const ref = this.addVariableToNodeType(nodeTypeId, {
        type: 'layout',
        name: 'Sociogram Layout',
      });
      layoutVariable = ref.id;
    }

    // Resolve edges
    let edges: SociogramPromptEntry['edges'];
    if (opts?.edges) {
      let createEdgeType: string | undefined;
      if (opts.edges.create === true) {
        const handle = this.addEdgeType();
        createEdgeType = handle.id;
      } else if (typeof opts.edges.create === 'string') {
        createEdgeType = opts.edges.create;
      }
      edges = {
        create: createEdgeType,
        display: opts.edges.display ?? (createEdgeType ? [createEdgeType] : []),
      };
    }

    // Resolve highlight
    let highlight: SociogramPromptEntry['highlight'];
    if (opts?.highlight) {
      let variable: string;
      if (opts.highlight.variable === true) {
        const ref = this.addVariableToNodeType(nodeTypeId, {
          type: 'boolean',
          name: 'Highlighted',
        });
        variable = ref.id;
      } else if (typeof opts.highlight.variable === 'string') {
        variable = opts.highlight.variable;
      } else {
        const ref = this.addVariableToNodeType(nodeTypeId, {
          type: 'boolean',
          name: 'Highlighted',
        });
        variable = ref.id;
      }
      highlight = {
        allowHighlighting: true,
        variable,
      };
    }

    return {
      id: promptId,
      text: opts?.text ?? this.valueGen.generatePromptText('Sociogram'),
      layout: { layoutVariable },
      edges,
      highlight,
    };
  }

  private resolveNarrativePreset(
    opts: AddPresetInput | undefined,
    entry: StageEntry,
  ): PresetEntry {
    const presetId = this.nextId('preset');
    const nodeTypeId = entry.subject!.type;

    // Resolve layout variable
    let layoutVariable: string;
    if (opts?.layoutVariable) {
      layoutVariable = opts.layoutVariable;
    } else {
      const ref = this.addVariableToNodeType(nodeTypeId, {
        type: 'layout',
        name: 'Narrative Layout',
      });
      layoutVariable = ref.id;
    }

    // Resolve group variable
    let groupVariable: string | undefined;
    if (opts?.groupVariable === true) {
      const ref = this.addVariableToNodeType(nodeTypeId, {
        type: 'categorical',
        name: 'Group',
      });
      groupVariable = ref.id;
    } else if (typeof opts?.groupVariable === 'string') {
      groupVariable = opts.groupVariable;
    }

    // Resolve highlight
    let highlight: string[] | undefined;
    if (opts?.highlight === true) {
      const ref = this.addVariableToNodeType(nodeTypeId, {
        type: 'boolean',
        name: 'Highlighted',
      });
      highlight = [ref.id];
    } else if (Array.isArray(opts?.highlight)) {
      highlight = opts.highlight;
    }

    // Resolve edges
    let edges: PresetEntry['edges'];
    if (opts?.edges?.display) {
      edges = { display: opts.edges.display };
    }

    return {
      id: presetId,
      label: opts?.label ?? this.valueGen.generatePresetLabel(),
      layoutVariable,
      edges,
      groupVariable,
      highlight,
    };
  }

  // --- Output methods ---

  getProtocol() {
    const codebook = this.buildCodebook();
    const stages = this.stages.map((s) => this.buildStageConfig(s));

    return {
      id: `protocol-${this.seed}`,
      schemaVersion: 8,
      codebook,
      // Stage configs are built dynamically and satisfy the Stage schema
      // at runtime, but TypeScript can't verify this statically.
      stages: stages as Stage[],
      assets: this.assets as unknown[],
    };
  }

  getNetwork(): NcNetwork {
    const valueGen = new ValueGenerator(this.seed);

    const ncNodes = this.nodes.map((nodeEntry, index) => {
      const nodeType = this.nodeTypes.get(nodeEntry.type);
      const attributes: Record<string, VariableValue> = {};

      if (nodeType) {
        for (const [varId, variable] of nodeType.variables) {
          if (varId in nodeEntry.explicitAttributes) {
            attributes[varId] = nodeEntry.explicitAttributes[
              varId
            ] as VariableValue;
          } else {
            attributes[varId] = valueGen.generateForVariable(
              variable,
              index,
            ) as VariableValue;
          }
        }
      }

      return {
        [entityPrimaryKeyProperty]: nodeEntry.uid,
        type: nodeEntry.type,
        stageId: nodeEntry.stageId,
        promptIDs: nodeEntry.promptIDs,
        [entityAttributesProperty]: attributes,
      };
    });

    const ncEdges = this.edges.map((edgeEntry) => ({
      [entityPrimaryKeyProperty]: edgeEntry.uid,
      type: edgeEntry.type,
      from: edgeEntry.from,
      to: edgeEntry.to,
      [entityAttributesProperty]: edgeEntry.attributes as Record<
        string,
        VariableValue
      >,
    }));

    return {
      ego: {
        [entityPrimaryKeyProperty]: `ego-${this.seed}`,
        [entityAttributesProperty]: {},
      },
      nodes: ncNodes,
      edges: ncEdges,
    };
  }

  getSession(opts?: GetSessionInput) {
    return {
      id: `session-${this.seed}`,
      currentStep: opts?.currentStep ?? 0,
      promptIndex: opts?.promptIndex ?? 0,
      startTime: new Date(2025, 0, 1).toISOString(),
      finishTime: null,
      exportTime: null,
      lastUpdated: new Date(2025, 0, 1).toISOString(),
      network: this.getNetwork(),
    };
  }

  getStore(opts?: GetSessionInput) {
    return createMockStore(this.getProtocol(), this.getSession(opts));
  }

  // --- Internal builders ---

  private buildCodebook() {
    const node: Record<string, unknown> = {};
    for (const [id, entry] of this.nodeTypes) {
      const variables: Record<string, unknown> = {};
      for (const [varId, varEntry] of entry.variables) {
        const variable: Record<string, unknown> = {
          name: varEntry.name,
          type: varEntry.type,
        };
        if (varEntry.component) variable.component = varEntry.component;
        if (varEntry.options) variable.options = varEntry.options;
        if (varEntry.validation) variable.validation = varEntry.validation;
        variables[varId] = variable;
      }
      node[id] = {
        name: entry.name,
        color: entry.color,
        displayVariable: entry.displayVariable,
        variables,
      };
    }

    const edge: Record<string, unknown> = {};
    for (const [id, entry] of this.edgeTypes) {
      edge[id] = {
        name: entry.name,
        color: entry.color,
      };
    }

    return { node, edge };
  }

  private buildStageConfig(stage: StageEntry): unknown {
    const config: Record<string, unknown> = {
      id: stage.id,
      type: stage.type,
      label: stage.label,
    };

    if (stage.subject) {
      config.subject = stage.subject;
    }

    if (stage.form) {
      config.form = stage.form;
    }

    if (stage.prompts.length > 0) {
      config.prompts = stage.prompts;
    }

    if (stage.presets.length > 0) {
      config.presets = stage.presets;
    }

    if (stage.panels.length > 0) {
      config.panels = stage.panels;
    }

    if (stage.background) {
      config.background = stage.background;
    }

    if (stage.behaviours) {
      config.behaviours = stage.behaviours;
    }

    return config;
  }

  // --- Node/edge manipulation after creation ---

  /**
   * Set explicit attribute values on a node by its index in the nodes array.
   * These values override the generated values at `getNetwork()` time.
   */
  setNodeAttribute(
    nodeIndex: number,
    variableId: string,
    value: unknown,
  ): void {
    const node = this.nodes[nodeIndex];
    if (!node) {
      throw new Error(
        `Node index ${nodeIndex} out of range (${this.nodes.length} nodes)`,
      );
    }
    node.explicitAttributes[variableId] = value;
  }

  /**
   * Add edges between existing nodes by their indices.
   * If no edge type exists, one will be created.
   */
  addEdges(pairs: [number, number][], edgeTypeId?: string): void {
    const resolvedEdgeTypeId =
      edgeTypeId ??
      (this.edgeTypes.size > 0
        ? this.edgeTypes.keys().next().value!
        : this.addEdgeType().id);

    for (const [fromIdx, toIdx] of pairs) {
      const fromNode = this.nodes[fromIdx];
      const toNode = this.nodes[toIdx];
      if (fromNode && toNode) {
        this.edges.push({
          uid: this.nextId('edge'),
          type: resolvedEdgeTypeId,
          from: fromNode.uid,
          to: toNode.uid,
          attributes: {},
        });
      }
    }
  }

  /**
   * Add an asset to the protocol output.
   */
  addAsset(asset: Record<string, unknown>): void {
    this.assets.push(asset);
  }

  // --- Accessors for internal state (useful for tests) ---

  getNodeTypeIds(): string[] {
    return [...this.nodeTypes.keys()];
  }

  getEdgeTypeIds(): string[] {
    return [...this.edgeTypes.keys()];
  }

  getVariableIds(nodeTypeId: string): string[] {
    const nodeType = this.nodeTypes.get(nodeTypeId);
    if (!nodeType) return [];
    return [...nodeType.variables.keys()];
  }

  getNodeEntries(): NodeEntry[] {
    return this.nodes;
  }

  getEdgeEntries(): EdgeEntry[] {
    return this.edges;
  }
}
