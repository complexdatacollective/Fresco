import { describe, expect, it } from 'vitest';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { egoCellTransform } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/transforms/egoCellTransform';

const variableConfig: VariableConfig = {
  nodeType: 'person',
  edgeType: 'family',
  nodeLabelVariable: 'name',
  egoVariable: 'isEgo',
  relationshipTypeVariable: 'relationship',
  isActiveVariable: 'isActive',
  isGestationalCarrierVariable: 'isGC',
};

describe('egoCellTransform', () => {
  it('transforms nuclear family (2 bio parents, current partners)', () => {
    const values = {
      'egg-parent': {
        'is-donor': false,
        'name': 'Linda',
        'gestationalCarrier': true,
      },
      'sperm-parent': {
        'is-donor': false,
        'name': 'Robert',
      },
      'hasOtherParents': false,
      'partnership-egg-parent-sperm-parent': 'current',
    };

    const { batch } = egoCellTransform(
      values as Record<string, unknown>,
      variableConfig,
    );

    // 3 nodes: ego + 2 parents
    expect(batch.nodes).toHaveLength(3);
    expect(batch.nodes[0]).toMatchObject({ tempId: 'ego' });
    expect(batch.nodes[1]).toMatchObject({
      tempId: 'egg-parent',
      data: {
        attributes: { name: 'Linda', isEgo: false },
      },
    });
    expect(batch.nodes[2]).toMatchObject({
      tempId: 'sperm-parent',
      data: {
        attributes: { name: 'Robert', isEgo: false },
      },
    });

    // 3 edges: 2 parent→ego + 1 partner
    expect(batch.edges).toHaveLength(3);

    // Egg parent edge: biological + GC
    expect(batch.edges[0]).toMatchObject({
      source: 'egg-parent',
      target: 'ego',
      data: {
        attributes: {
          [variableConfig.relationshipTypeVariable]: 'biological',
          [variableConfig.isActiveVariable]: true,
          [variableConfig.isGestationalCarrierVariable]: true,
        },
      },
    });

    // Sperm parent edge: biological, no GC
    expect(batch.edges[1]).toMatchObject({
      source: 'sperm-parent',
      target: 'ego',
      data: {
        attributes: {
          [variableConfig.relationshipTypeVariable]: 'biological',
          [variableConfig.isActiveVariable]: true,
        },
      },
    });
    expect(
      batch.edges[1]?.data.attributes[
        variableConfig.isGestationalCarrierVariable
      ],
    ).toBeUndefined();

    // Partnership: current
    expect(batch.edges[2]).toMatchObject({
      source: 'egg-parent',
      target: 'sperm-parent',
      data: {
        attributes: {
          [variableConfig.relationshipTypeVariable]: 'partner',
          [variableConfig.isActiveVariable]: true,
        },
      },
    });
  });

  it('transforms same-sex mothers with sperm donor + social parent', () => {
    const values = {
      'egg-parent': {
        'is-donor': false,
        'name': 'Linda',
        'gestationalCarrier': true,
      },
      'sperm-parent': {
        'is-donor': true,
        'name': '',
      },
      'hasOtherParents': true,
      'otherParentCount': 1,
      'additional-parent': [{ role: 'raised-me', name: 'Patricia' }],
      'partnership-egg-parent-sperm-parent': 'none',
      'partnership-egg-parent-additional-parent-0': 'current',
      'partnership-sperm-parent-additional-parent-0': 'none',
    };

    const { batch } = egoCellTransform(
      values as Record<string, unknown>,
      variableConfig,
    );

    // 4 nodes: ego + egg + donor + Patricia
    expect(batch.nodes).toHaveLength(4);
    expect(batch.nodes[3]).toMatchObject({
      tempId: 'additional-parent-0',
      data: { attributes: { name: 'Patricia' } },
    });

    // Sperm parent is donor
    const donorEdge = batch.edges.find((e) => e.source === 'sperm-parent');
    expect(donorEdge?.data.attributes).toMatchObject({
      [variableConfig.relationshipTypeVariable]: 'donor',
      [variableConfig.isActiveVariable]: true,
    });

    // Additional parent is social
    const socialEdge = batch.edges.find(
      (e) => e.source === 'additional-parent-0',
    );
    expect(socialEdge?.data.attributes).toMatchObject({
      [variableConfig.relationshipTypeVariable]: 'social',
      [variableConfig.isActiveVariable]: true,
    });

    // Only 1 partnership (Linda + Patricia current), others are 'none'
    const partnerships = batch.edges.filter(
      (e) =>
        e.data.attributes[variableConfig.relationshipTypeVariable] ===
        'partner',
    );
    expect(partnerships).toHaveLength(1);
    expect(partnerships[0]).toMatchObject({
      source: 'egg-parent',
      target: 'additional-parent-0',
      data: {
        attributes: { [variableConfig.isActiveVariable]: true },
      },
    });

    // Donor node has empty name
    expect(batch.nodes[2]).toMatchObject({
      tempId: 'sperm-parent',
      data: { attributes: { name: '' } },
    });
  });

  it('transforms single parent with two donors + gestational carrier', () => {
    const values = {
      'egg-parent': {
        'is-donor': true,
        'name': '',
        'gestationalCarrier': false,
      },
      'sperm-parent': {
        'is-donor': true,
        'name': '',
      },
      'gestational-carrier': {
        'is-donor': false,
        'name': 'Mum',
      },
      'hasOtherParents': false,
      'partnership-egg-parent-sperm-parent': 'none',
      'partnership-egg-parent-gestational-carrier': 'none',
      'partnership-sperm-parent-gestational-carrier': 'none',
    };

    const { batch } = egoCellTransform(
      values as Record<string, unknown>,
      variableConfig,
    );

    // 4 nodes: ego + egg donor + sperm donor + GC
    expect(batch.nodes).toHaveLength(4);

    // Egg parent: donor edge, NO GC flag (she didn't carry)
    const eggEdge = batch.edges.find((e) => e.source === 'egg-parent');
    expect(eggEdge?.data.attributes).toMatchObject({
      [variableConfig.relationshipTypeVariable]: 'donor',
    });
    expect(
      eggEdge?.data.attributes[variableConfig.isGestationalCarrierVariable],
    ).toBeUndefined();

    // Sperm parent: donor edge
    const spermEdge = batch.edges.find((e) => e.source === 'sperm-parent');
    expect(spermEdge?.data.attributes).toMatchObject({
      [variableConfig.relationshipTypeVariable]: 'donor',
    });

    // Gestational carrier: biological (not surrogate) + GC flag
    const gcEdge = batch.edges.find((e) => e.source === 'gestational-carrier');
    expect(gcEdge?.data.attributes).toMatchObject({
      [variableConfig.relationshipTypeVariable]: 'biological',
      [variableConfig.isGestationalCarrierVariable]: true,
    });

    // GC node has name 'Mum'
    const gcNode = batch.nodes.find((n) => n.tempId === 'gestational-carrier');
    expect(gcNode?.data.attributes).toMatchObject({ name: 'Mum' });

    // No partnerships
    const partnerships = batch.edges.filter(
      (e) =>
        e.data.attributes[variableConfig.relationshipTypeVariable] ===
        'partner',
    );
    expect(partnerships).toHaveLength(0);
  });

  it('transforms blended family with ex + current partnerships', () => {
    const values = {
      'egg-parent': {
        'is-donor': false,
        'name': 'Susan',
        'gestationalCarrier': true,
      },
      'sperm-parent': {
        'is-donor': false,
        'name': 'Robert',
      },
      'hasOtherParents': true,
      'otherParentCount': 1,
      'additional-parent': [{ role: 'step-parent', name: 'Karen' }],
      'partnership-egg-parent-sperm-parent': 'ex',
      'partnership-egg-parent-additional-parent-0': 'none',
      'partnership-sperm-parent-additional-parent-0': 'current',
    };

    const { batch } = egoCellTransform(
      values as Record<string, unknown>,
      variableConfig,
    );

    const partnerships = batch.edges.filter(
      (e) =>
        e.data.attributes[variableConfig.relationshipTypeVariable] ===
        'partner',
    );
    expect(partnerships).toHaveLength(2);

    // Susan + Robert = ex (isActive: false)
    expect(partnerships[0]).toMatchObject({
      source: 'egg-parent',
      target: 'sperm-parent',
      data: {
        attributes: { [variableConfig.isActiveVariable]: false },
      },
    });

    // Robert + Karen = current (isActive: true)
    expect(partnerships[1]).toMatchObject({
      source: 'sperm-parent',
      target: 'additional-parent-0',
      data: {
        attributes: { [variableConfig.isActiveVariable]: true },
      },
    });
  });

  it('produces adoptive edges when adoptive parents are present', () => {
    const values = {
      'egg-parent': {
        'is-donor': false,
        'name': '',
        'gestationalCarrier': true,
      },
      'sperm-parent': {
        'is-donor': false,
        'name': '',
      },
      'hasOtherParents': true,
      'otherParentCount': 2,
      'additional-parent': [
        { role: 'adoptive-parent', name: 'James' },
        {
          role: 'adoptive-parent',
          name: 'Barbara',
        },
      ],
      'partnership-egg-parent-sperm-parent': 'none',
      'partnership-egg-parent-additional-parent-0': 'none',
      'partnership-egg-parent-additional-parent-1': 'none',
      'partnership-sperm-parent-additional-parent-0': 'none',
      'partnership-sperm-parent-additional-parent-1': 'none',
      'partnership-additional-parent-0-additional-parent-1': 'current',
    };

    const result = egoCellTransform(
      values as Record<string, unknown>,
      variableConfig,
    );

    const adoptiveEdges = result.batch.edges.filter(
      (e) =>
        e.data.attributes[variableConfig.relationshipTypeVariable] ===
        'adoptive',
    );
    expect(adoptiveEdges).toHaveLength(2);
    expect(adoptiveEdges[0]).toMatchObject({
      source: 'additional-parent-0',
      target: 'ego',
      data: {
        attributes: {
          [variableConfig.relationshipTypeVariable]: 'adoptive',
          [variableConfig.isActiveVariable]: true,
        },
      },
    });
    expect(adoptiveEdges[1]).toMatchObject({
      source: 'additional-parent-1',
      target: 'ego',
      data: {
        attributes: {
          [variableConfig.relationshipTypeVariable]: 'adoptive',
          [variableConfig.isActiveVariable]: true,
        },
      },
    });
  });

  it('does not produce adoptive edges when no adoptive parents', () => {
    const values = {
      'egg-parent': {
        'is-donor': false,
        'name': 'Linda',
        'gestationalCarrier': true,
      },
      'sperm-parent': {
        'is-donor': false,
        'name': 'Robert',
      },
      'hasOtherParents': false,
      'partnership-egg-parent-sperm-parent': 'current',
    };

    const result = egoCellTransform(
      values as Record<string, unknown>,
      variableConfig,
    );

    const adoptiveEdges = result.batch.edges.filter(
      (e) =>
        e.data.attributes[variableConfig.relationshipTypeVariable] ===
        'adoptive',
    );
    expect(adoptiveEdges).toHaveLength(0);
  });

  it('uses existing ego ID and does not create ego node', () => {
    const values = {
      'egg-parent': {
        'is-donor': false,
        'name': 'Linda',
        'gestationalCarrier': true,
      },
      'sperm-parent': {
        'is-donor': false,
        'name': 'Robert',
      },
      'hasOtherParents': false,
      'partnership-egg-parent-sperm-parent': 'current',
    };

    const { batch } = egoCellTransform(
      values as Record<string, unknown>,
      variableConfig,
      'existing-ego-123',
    );

    const egoNode = batch.nodes.find((n) => n.tempId === 'ego');
    expect(egoNode).toBeUndefined();

    const parentEdges = batch.edges.filter(
      (e) => e.target === 'existing-ego-123',
    );
    expect(parentEdges).toHaveLength(2);
  });

  it('creates partner node and children with partner', () => {
    const values = {
      'egg-parent': {
        'is-donor': false,
        'name': 'Linda',
        'gestationalCarrier': true,
      },
      'sperm-parent': {
        'is-donor': false,
        'name': 'Robert',
      },
      'hasOtherParents': false,
      'partnership-egg-parent-sperm-parent': 'current',
      'hasPartner': true,
      'partner': {
        name: 'Sophia',
      },
      'childrenWithPartnerCount': 2,
      'childWithPartner': [{ name: 'Olivia' }, { name: 'Liam' }],
    };

    const { batch } = egoCellTransform(
      values as Record<string, unknown>,
      variableConfig,
    );

    // ego + 2 parents + partner + 2 children = 6 nodes
    expect(batch.nodes).toHaveLength(6);

    const partnerNode = batch.nodes.find((n) => n.tempId === 'partner');
    expect(partnerNode?.data.attributes).toMatchObject({ name: 'Sophia' });

    // Partner edge: ego <-> partner
    const partnerEdge = batch.edges.find(
      (e) =>
        e.data.attributes[variableConfig.relationshipTypeVariable] ===
          'partner' && e.target === 'partner',
    );
    expect(partnerEdge).toBeDefined();

    // Children: 2 child nodes, each with edges from ego + partner
    const child0 = batch.nodes.find((n) => n.tempId === 'child-0');
    const child1 = batch.nodes.find((n) => n.tempId === 'child-1');
    expect(child0?.data.attributes).toMatchObject({ name: 'Olivia' });
    expect(child1?.data.attributes).toMatchObject({ name: 'Liam' });

    const child0Edges = batch.edges.filter((e) => e.target === 'child-0');
    expect(child0Edges).toHaveLength(2);
    expect(child0Edges.map((e) => e.source).sort()).toEqual(
      ['ego', 'partner'].sort(),
    );

    const child1Edges = batch.edges.filter((e) => e.target === 'child-1');
    expect(child1Edges).toHaveLength(2);
  });

  it('skips partner and children when hasPartner is false', () => {
    const values = {
      'egg-parent': {
        'is-donor': false,
        'name': 'Linda',
        'gestationalCarrier': true,
      },
      'sperm-parent': {
        'is-donor': false,
        'name': 'Robert',
      },
      'hasOtherParents': false,
      'partnership-egg-parent-sperm-parent': 'current',
      'hasPartner': false,
    };

    const { batch } = egoCellTransform(
      values as Record<string, unknown>,
      variableConfig,
    );

    // ego + 2 parents only
    expect(batch.nodes).toHaveLength(3);
    expect(batch.nodes.find((n) => n.tempId === 'partner')).toBeUndefined();
  });
});
