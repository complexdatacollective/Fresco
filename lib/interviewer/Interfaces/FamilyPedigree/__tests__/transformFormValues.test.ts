import { describe, expect, it } from 'vitest';
import { transformFormValues } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/transformFormValues';

describe('transformFormValues', () => {
  it('transforms a nuclear family scenario', () => {
    const formValues = {
      'egg-parent': {
        'is-donor': false,
        'name-known': true,
        'name': 'Linda',
        'gestationalCarrier': true,
        'raised-by': true,
        'sex-at-birth': 'female',
        'gender_identity': 'woman',
      },
      'sperm-parent': {
        'is-donor': false,
        'name-known': true,
        'name': 'Robert',
        'raised-by': true,
        'sex-at-birth': 'male',
        'gender_identity': 'man',
      },
      'hasOtherParents': false,
      'partnership-egg-parent-sperm-parent': 'current',
      'siblingCount': 2,
      'hasPartner': true,
      'noChildrenWithPartner': 1,
      'noChildrenWithOther': 0,
      'sibling': [
        {
          'name-known': true,
          'name': 'David',
          'sex-at-birth': 'male',
          'gender_identity': 'man',
        },
        {
          'name-known': true,
          'name': 'Emily',
          'sex-at-birth': 'female',
          'gender_identity': 'woman',
        },
      ],
      'partner': {
        'name': 'Sophia',
        'sex-at-birth': 'female',
        'gender_identity': 'woman',
      },
      'childWithPartner': [
        {
          'name': 'Olivia',
          'sex-at-birth': 'female',
          'gender_identity': 'woman',
        },
      ],
    };

    const result = transformFormValues(formValues as Record<string, unknown>);

    // Parents: egg-parent (biological) + sperm-parent (biological)
    expect(result.parents).toHaveLength(2);
    expect(result.parents[0]).toMatchObject({
      name: 'Linda',
      biologicalSex: 'female',
      nameKnown: true,
      edgeType: 'biological',
    });
    expect(result.parents[1]).toMatchObject({
      name: 'Robert',
      biologicalSex: 'male',
      nameKnown: true,
      edgeType: 'biological',
    });

    // Custom attributes (gender_identity) should pass through
    expect(result.parents[0]?.attributes).toMatchObject({
      gender_identity: 'woman',
    });

    // Gestational carrier is the egg parent (index 0)
    expect(result.gestationalCarrierParentIndex).toBe(0);

    // Partnership: current partners
    expect(result.parentPartnerships).toHaveLength(1);
    expect(result.parentPartnerships[0]).toEqual({
      parentIndices: [0, 1],
      isActive: true,
    });

    // Siblings
    expect(result.siblings).toHaveLength(2);
    expect(result.siblings[0]?.name).toBe('David');
    expect(result.siblings[1]?.name).toBe('Emily');

    // Partner
    expect(result.partner).toMatchObject({
      hasPartner: true,
      name: 'Sophia',
      biologicalSex: 'female',
    });

    // Children with partner
    expect(result.childrenWithPartner).toHaveLength(1);
    expect(result.childrenWithPartner[0]?.name).toBe('Olivia');

    // No bio parents in separate array (all in parents)
    expect(result.bioParents).toHaveLength(0);
  });

  it('transforms a same-sex mothers with sperm donor scenario', () => {
    const formValues = {
      'egg-parent': {
        'is-donor': false,
        'name-known': true,
        'name': 'Linda',
        'gestationalCarrier': true,
        'raised-by': true,
        'sex-at-birth': 'female',
      },
      'sperm-parent': {
        'is-donor': true,
        'name-known': false,
        'raised-by': false,
        'sex-at-birth': 'male',
      },
      'hasOtherParents': true,
      'otherParentCount': 1,
      'additional-parent': [
        {
          'role': 'raised-me',
          'name': 'Patricia',
          'sex-at-birth': 'female',
        },
      ],
      'partnership-egg-parent-sperm-parent': 'none',
      'partnership-egg-parent-additional-parent-0': 'current',
      'partnership-sperm-parent-additional-parent-0': 'none',
      'siblingCount': 0,
      'hasPartner': false,
      'noChildrenWithOther': 0,
    };

    const result = transformFormValues(formValues as Record<string, unknown>);

    // Parents: egg-parent (biological), sperm-parent (donor), additional (social)
    expect(result.parents).toHaveLength(3);
    expect(result.parents[0]).toMatchObject({
      name: 'Linda',
      edgeType: 'biological',
    });
    expect(result.parents[1]).toMatchObject({
      name: '',
      edgeType: 'donor',
      nameKnown: false,
    });
    expect(result.parents[2]).toMatchObject({
      name: 'Patricia',
      edgeType: 'social',
    });

    // Partnership: Linda + Patricia are current partners
    expect(result.parentPartnerships).toHaveLength(1);
    expect(result.parentPartnerships[0]).toEqual({
      parentIndices: [0, 2],
      isActive: true,
    });
  });

  it('transforms a single parent with two donors scenario', () => {
    const formValues = {
      'egg-parent': {
        'is-donor': true,
        'name-known': false,
        'gestationalCarrier': false,
        'raised-by': false,
        'sex-at-birth': 'female',
      },
      'sperm-parent': {
        'is-donor': true,
        'name-known': false,
        'raised-by': false,
        'sex-at-birth': 'male',
      },
      'gestational-carrier': {
        'is-donor': false,
        'name-known': true,
        'name': 'Mum',
        'raised-by': true,
        'sex-at-birth': 'female',
      },
      'hasOtherParents': false,
      'partnership-egg-parent-sperm-parent': 'none',
      'partnership-egg-parent-gestational-carrier': 'none',
      'partnership-sperm-parent-gestational-carrier': 'none',
      'siblingCount': 0,
      'hasPartner': false,
      'noChildrenWithOther': 0,
    };

    const result = transformFormValues(formValues as Record<string, unknown>);

    // Parents: egg-donor, sperm-donor, gestational carrier (biological, not surrogate)
    expect(result.parents).toHaveLength(3);
    expect(result.parents[0]).toMatchObject({
      edgeType: 'donor',
      nameKnown: false,
    });
    expect(result.parents[1]).toMatchObject({
      edgeType: 'donor',
      nameKnown: false,
    });
    expect(result.parents[2]).toMatchObject({
      name: 'Mum',
      edgeType: 'biological',
      nameKnown: true,
    });

    // Gestational carrier is index 2
    expect(result.gestationalCarrierParentIndex).toBe(2);

    // No partnerships
    expect(result.parentPartnerships).toHaveLength(0);
  });

  it('transforms a blended family with ex-partners', () => {
    const formValues = {
      'egg-parent': {
        'is-donor': false,
        'name-known': true,
        'name': 'Susan',
        'gestationalCarrier': true,
        'raised-by': true,
        'sex-at-birth': 'female',
      },
      'sperm-parent': {
        'is-donor': false,
        'name-known': true,
        'name': 'Robert',
        'raised-by': true,
        'sex-at-birth': 'male',
      },
      'hasOtherParents': true,
      'otherParentCount': 1,
      'additional-parent': [
        {
          'role': 'step-parent',
          'name': 'Karen',
          'sex-at-birth': 'female',
        },
      ],
      'partnership-egg-parent-sperm-parent': 'ex',
      'partnership-egg-parent-additional-parent-0': 'none',
      'partnership-sperm-parent-additional-parent-0': 'current',
      'siblingCount': 0,
      'hasPartner': false,
      'noChildrenWithOther': 0,
    };

    const result = transformFormValues(formValues as Record<string, unknown>);

    // Partnerships: Susan+Robert=ex, Robert+Karen=current
    expect(result.parentPartnerships).toHaveLength(2);
    expect(result.parentPartnerships[0]).toEqual({
      parentIndices: [0, 1],
      isActive: false,
    });
    expect(result.parentPartnerships[1]).toEqual({
      parentIndices: [1, 2],
      isActive: true,
    });
  });

  it('transforms with partner and other children', () => {
    const formValues = {
      'egg-parent': {
        'is-donor': false,
        'name-known': true,
        'name': 'Linda',
        'gestationalCarrier': true,
        'raised-by': true,
        'sex-at-birth': 'female',
      },
      'sperm-parent': {
        'is-donor': false,
        'name-known': true,
        'name': 'Robert',
        'raised-by': true,
        'sex-at-birth': 'male',
      },
      'hasOtherParents': false,
      'partnership-egg-parent-sperm-parent': 'current',
      'siblingCount': 0,
      'hasPartner': true,
      'noChildrenWithPartner': 2,
      'noChildrenWithOther': 1,
      'partner': {
        'name': 'Jennifer',
        'sex-at-birth': 'female',
      },
      'childWithPartner': [
        { 'name': 'Daniel', 'sex-at-birth': 'male' },
        { 'name': 'Emma', 'sex-at-birth': 'female' },
      ],
      'otherChild': [{ 'name': 'Noah', 'sex-at-birth': 'male' }],
    };

    const result = transformFormValues(formValues as Record<string, unknown>);

    expect(result.partner).toMatchObject({
      hasPartner: true,
      name: 'Jennifer',
    });
    expect(result.childrenWithPartner).toHaveLength(2);
    expect(result.childrenWithPartner[0]?.name).toBe('Daniel');
    expect(result.childrenWithPartner[1]?.name).toBe('Emma');
    expect(result.otherChildren).toHaveLength(1);
    expect(result.otherChildren[0]?.name).toBe('Noah');
  });
});
