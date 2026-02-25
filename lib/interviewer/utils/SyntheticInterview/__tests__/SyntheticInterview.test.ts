import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { describe, expect, it } from 'vitest';
import { SyntheticInterview } from '../SyntheticInterview';

describe('SyntheticInterview', () => {
  describe('determinism', () => {
    it('produces identical protocol output for the same seed', () => {
      const a = new SyntheticInterview(42);
      const b = new SyntheticInterview(42);

      a.addStage('Sociogram');
      b.addStage('Sociogram');

      expect(a.getProtocol()).toEqual(b.getProtocol());
    });

    it('produces identical network output for the same seed', () => {
      const a = new SyntheticInterview(42);
      const b = new SyntheticInterview(42);

      const stageA = a.addStage('Sociogram', { initialNodes: 5 });
      stageA.addPrompt();

      const stageB = b.addStage('Sociogram', { initialNodes: 5 });
      stageB.addPrompt();

      expect(a.getNetwork()).toEqual(b.getNetwork());
    });

    it('produces different output for different seeds', () => {
      const a = new SyntheticInterview(1);
      const b = new SyntheticInterview(2);

      a.addStage('Sociogram', { initialNodes: 3 });
      b.addStage('Sociogram', { initialNodes: 3 });

      expect(a.getProtocol().id).not.toBe(b.getProtocol().id);

      const netA = a.getNetwork();
      const netB = b.getNetwork();
      expect(netA.nodes[0]![entityPrimaryKeyProperty]).not.toBe(
        netB.nodes[0]![entityPrimaryKeyProperty],
      );
    });
  });

  describe('auto-creation', () => {
    it('auto-creates node type when adding a stage without subject', () => {
      const si = new SyntheticInterview();
      si.addStage('Sociogram');

      const protocol = si.getProtocol();
      const nodeTypeIds = Object.keys(protocol.codebook.node);
      expect(nodeTypeIds).toHaveLength(1);
    });

    it('reuses existing node type for subsequent stages', () => {
      const si = new SyntheticInterview();
      si.addStage('Sociogram');
      si.addStage('Narrative');

      const protocol = si.getProtocol();
      const nodeTypeIds = Object.keys(protocol.codebook.node);
      expect(nodeTypeIds).toHaveLength(1);
    });

    it('auto-creates layout variable for Sociogram prompt', () => {
      const si = new SyntheticInterview();
      const stage = si.addStage('Sociogram');
      stage.addPrompt();

      const protocol = si.getProtocol();
      const nodeTypeId = Object.keys(protocol.codebook.node)[0]!;
      const nodeType = protocol.codebook.node[nodeTypeId] as Record<
        string,
        unknown
      >;
      const variables = nodeType.variables as Record<string, { type: string }>;
      const layoutVars = Object.values(variables).filter(
        (v) => v.type === 'layout',
      );
      expect(layoutVars).toHaveLength(1);
    });

    it('auto-creates edge type for Sociogram prompt with edges.create=true', () => {
      const si = new SyntheticInterview();
      const stage = si.addStage('Sociogram');
      stage.addPrompt({ edges: { create: true } });

      const protocol = si.getProtocol();
      const edgeTypeIds = Object.keys(protocol.codebook.edge);
      expect(edgeTypeIds).toHaveLength(1);
    });

    it('auto-creates boolean variable for highlight=true', () => {
      const si = new SyntheticInterview();
      const stage = si.addStage('Sociogram');
      stage.addPrompt({ highlight: { variable: true } });

      const protocol = si.getProtocol();
      const nodeTypeId = Object.keys(protocol.codebook.node)[0]!;
      const nodeType = protocol.codebook.node[nodeTypeId] as Record<
        string,
        unknown
      >;
      const variables = nodeType.variables as Record<string, { type: string }>;
      const boolVars = Object.values(variables).filter(
        (v) => v.type === 'boolean',
      );
      expect(boolVars).toHaveLength(1);
    });
  });

  describe('manual codebook', () => {
    it('creates node type with custom name and color', () => {
      const si = new SyntheticInterview();
      const handle = si.addNodeType({
        name: 'Organization',
        color: 'node-color-seq-3',
      });

      const protocol = si.getProtocol();
      const nodeType = protocol.codebook.node[handle.id] as Record<
        string,
        unknown
      >;
      expect(nodeType.name).toBe('Organization');
      expect(nodeType.color).toBe('node-color-seq-3');
    });

    it('adds variables to node type', () => {
      const si = new SyntheticInterview();
      const nt = si.addNodeType();
      const varRef = nt.addVariable({ type: 'number', name: 'Age' });

      const protocol = si.getProtocol();
      const nodeType = protocol.codebook.node[nt.id] as Record<string, unknown>;
      const variables = nodeType.variables as Record<
        string,
        { name: string; type: string }
      >;
      expect(variables[varRef.id]).toEqual(
        expect.objectContaining({ name: 'Age', type: 'number' }),
      );
    });

    it('infers variable type from component', () => {
      const si = new SyntheticInterview();
      const nt = si.addNodeType();
      const varRef = nt.addVariable({ component: 'RadioGroup' });

      const protocol = si.getProtocol();
      const nodeType = protocol.codebook.node[nt.id] as Record<string, unknown>;
      const variables = nodeType.variables as Record<
        string,
        { type: string; options: unknown[] }
      >;
      expect(variables[varRef.id]!.type).toBe('ordinal');
      expect(variables[varRef.id]!.options).toHaveLength(5);
    });

    it('auto-generates options for categorical variables', () => {
      const si = new SyntheticInterview();
      const nt = si.addNodeType();
      const varRef = nt.addVariable({ component: 'CheckboxGroup' });

      const protocol = si.getProtocol();
      const nodeType = protocol.codebook.node[nt.id] as Record<string, unknown>;
      const variables = nodeType.variables as Record<
        string,
        { type: string; options: unknown[] }
      >;
      expect(variables[varRef.id]!.type).toBe('categorical');
      expect(variables[varRef.id]!.options).toHaveLength(4);
    });
  });

  describe('NameGenerator', () => {
    it('creates form fields that auto-create variables', () => {
      const si = new SyntheticInterview();
      si.addStage('NameGenerator', {
        form: {
          fields: [{ component: 'Text' }, { component: 'Number' }],
        },
      });

      const protocol = si.getProtocol();
      const stageConfig = protocol.stages[0] as Record<string, unknown>;
      const form = stageConfig.form as {
        fields: { variable: string; component: string }[];
      };
      expect(form.fields).toHaveLength(2);
      expect(form.fields[0]!.component).toBe('Text');
      expect(form.fields[1]!.component).toBe('Number');

      // Variables should exist in codebook
      const nodeTypeId = Object.keys(protocol.codebook.node)[0]!;
      const nodeType = protocol.codebook.node[nodeTypeId] as Record<
        string,
        unknown
      >;
      const variables = nodeType.variables as Record<string, { type: string }>;
      const varTypes = Object.values(variables).map((v) => v.type);
      expect(varTypes).toContain('text');
      expect(varTypes).toContain('number');
    });

    it('supports addFormField on stage handle', () => {
      const si = new SyntheticInterview();
      const stage = si.addStage('NameGenerator');
      stage.addFormField({ component: 'RadioGroup' });

      const protocol = si.getProtocol();
      const stageConfig = protocol.stages[0] as Record<string, unknown>;
      const form = stageConfig.form as { fields: { component: string }[] };
      expect(form.fields).toHaveLength(1);
      expect(form.fields[0]!.component).toBe('RadioGroup');
    });

    it('supports prompts and panels', () => {
      const si = new SyntheticInterview();
      const stage = si.addStage('NameGenerator');
      stage.addPrompt({ text: 'Name your friends' });
      stage.addPanel({ title: 'Previous contacts' });

      const protocol = si.getProtocol();
      const stageConfig = protocol.stages[0] as Record<string, unknown>;
      const prompts = stageConfig.prompts as { text: string }[];
      const panels = stageConfig.panels as { title: string }[];
      expect(prompts).toHaveLength(1);
      expect(prompts[0]!.text).toBe('Name your friends');
      expect(panels).toHaveLength(1);
      expect(panels[0]!.title).toBe('Previous contacts');
    });

    it('generates initial nodes', () => {
      const si = new SyntheticInterview();
      si.addStage('NameGenerator', { initialNodes: 5 });

      const network = si.getNetwork();
      expect(network.nodes).toHaveLength(5);
    });
  });

  describe('Sociogram', () => {
    it('creates prompts with layout, edges, and highlight', () => {
      const si = new SyntheticInterview();
      const stage = si.addStage('Sociogram');
      stage.addPrompt({
        text: 'Place people',
        edges: { create: true },
        highlight: { variable: true },
      });

      const protocol = si.getProtocol();
      const stageConfig = protocol.stages[0] as Record<string, unknown>;
      const prompts = stageConfig.prompts as {
        text: string;
        layout: { layoutVariable: string };
        edges: { create: string; display: string[] };
        highlight: { allowHighlighting: boolean; variable: string };
      }[];
      expect(prompts).toHaveLength(1);

      const prompt = prompts[0]!;
      expect(prompt.text).toBe('Place people');
      expect(prompt.layout.layoutVariable).toBeTruthy();
      expect(prompt.edges.create).toBeTruthy();
      expect(prompt.highlight.allowHighlighting).toBe(true);
      expect(prompt.highlight.variable).toBeTruthy();
    });

    it('creates Sociogram with background options', () => {
      const si = new SyntheticInterview();
      si.addStage('Sociogram', {
        background: { concentricCircles: 4, skewedTowardCenter: true },
      });

      const protocol = si.getProtocol();
      const stageConfig = protocol.stages[0] as Record<string, unknown>;
      const bg = stageConfig.background as Record<string, unknown>;
      expect(bg.concentricCircles).toBe(4);
      expect(bg.skewedTowardCenter).toBe(true);
    });

    it('creates Sociogram with automatic layout', () => {
      const si = new SyntheticInterview();
      si.addStage('Sociogram', {
        behaviours: { automaticLayout: { enabled: true } },
      });

      const protocol = si.getProtocol();
      const stageConfig = protocol.stages[0] as Record<string, unknown>;
      const behaviours = stageConfig.behaviours as Record<string, unknown>;
      const autoLayout = behaviours.automaticLayout as Record<string, unknown>;
      expect(autoLayout.enabled).toBe(true);
    });
  });

  describe('Narrative', () => {
    it('creates presets with all options auto-created', () => {
      const si = new SyntheticInterview();
      const stage = si.addStage('Narrative');
      stage.addPreset({
        label: 'Full View',
        groupVariable: true,
        highlight: true,
      });

      const protocol = si.getProtocol();
      const stageConfig = protocol.stages[0] as Record<string, unknown>;
      const presets = stageConfig.presets as {
        label: string;
        layoutVariable: string;
        groupVariable: string;
        highlight: string[];
      }[];
      expect(presets).toHaveLength(1);

      const preset = presets[0]!;
      expect(preset.label).toBe('Full View');
      expect(preset.layoutVariable).toBeTruthy();
      expect(preset.groupVariable).toBeTruthy();
      expect(preset.highlight).toHaveLength(1);
    });

    it('creates presets with explicit edge display', () => {
      const si = new SyntheticInterview();
      const et = si.addEdgeType({ name: 'Friendship' });
      const stage = si.addStage('Narrative');
      stage.addPreset({
        edges: { display: [et.id] },
      });

      const protocol = si.getProtocol();
      const stageConfig = protocol.stages[0] as Record<string, unknown>;
      const presets = stageConfig.presets as {
        edges: { display: string[] };
      }[];
      expect(presets[0]!.edges.display).toEqual([et.id]);
    });

    it('supports behaviours (freeDraw, allowRepositioning)', () => {
      const si = new SyntheticInterview();
      si.addStage('Narrative', {
        behaviours: { freeDraw: true, allowRepositioning: true },
      });

      const protocol = si.getProtocol();
      const stageConfig = protocol.stages[0] as Record<string, unknown>;
      const behaviours = stageConfig.behaviours as Record<string, unknown>;
      expect(behaviours.freeDraw).toBe(true);
      expect(behaviours.allowRepositioning).toBe(true);
    });
  });

  describe('node attributes (deferred fill)', () => {
    it('fills all codebook variables on nodes at getNetwork time', () => {
      const si = new SyntheticInterview();
      const nt = si.addNodeType();
      nt.addVariable({ type: 'number', name: 'Age' });
      nt.addVariable({ type: 'boolean', name: 'Active' });

      si.addStage('Sociogram', {
        initialNodes: 3,
        subject: { entity: 'node', type: nt.id },
      });

      const network = si.getNetwork();
      for (const node of network.nodes) {
        const attrs = node[entityAttributesProperty];
        // Should have display variable + 2 added variables
        expect(Object.keys(attrs).length).toBeGreaterThanOrEqual(3);
      }
    });

    it('fills variables added after addStage', () => {
      const si = new SyntheticInterview();
      const nt = si.addNodeType();
      const stage = si.addStage('Sociogram', {
        initialNodes: 3,
        subject: { entity: 'node', type: nt.id },
      });

      // Add variable after stage and nodes were created
      const varRef = nt.addVariable({ type: 'number', name: 'Score' });

      // Also add a prompt that creates a layout variable
      stage.addPrompt();

      const network = si.getNetwork();
      for (const node of network.nodes) {
        const attrs = node[entityAttributesProperty];
        expect(attrs[varRef.id]).toBeDefined();
      }
    });
  });

  describe('edge generation', () => {
    it('creates edges between initial nodes', () => {
      const si = new SyntheticInterview();
      si.addEdgeType({ name: 'Friendship' });
      si.addStage('Sociogram', {
        initialNodes: 5,
        initialEdges: [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      });

      const network = si.getNetwork();
      expect(network.edges).toHaveLength(3);

      // Verify from/to reference valid node UIDs
      const nodeUids = new Set(
        network.nodes.map((n) => n[entityPrimaryKeyProperty]),
      );
      for (const edge of network.edges) {
        expect(nodeUids.has(edge.from)).toBe(true);
        expect(nodeUids.has(edge.to)).toBe(true);
      }
    });
  });

  describe('getInterviewPayload', () => {
    it('returns interview payload matching expected shape', () => {
      const si = new SyntheticInterview();
      si.addStage('Sociogram', { initialNodes: 3 });

      const payload = si.getInterviewPayload();

      expect(payload.network.nodes).toHaveLength(3);
      expect(payload.protocol.codebook).toBeDefined();
      expect(payload.protocol.name).toBe('Synthetic Protocol');
      expect(payload.startTime).toBeInstanceOf(Date);
      expect(payload.stageMetadata).toBeNull();
    });
  });

  describe('cross-stage nodes', () => {
    it('nodes from earlier stages are in the network for later stages', () => {
      const si = new SyntheticInterview();
      si.addStage('NameGenerator', { initialNodes: 3 });
      si.addStage('Sociogram', { initialNodes: 2 });

      const network = si.getNetwork();
      expect(network.nodes).toHaveLength(5);
    });
  });
});
