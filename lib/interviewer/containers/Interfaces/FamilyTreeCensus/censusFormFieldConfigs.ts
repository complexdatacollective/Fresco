export function buildAdditionalFieldsdMap({mother, father, siblings, cousins, grandchildren}) {
    aunt: {
      fieldLabel: 'Whos is the aunt related to?',
      options: [
        { label: 'Father', value: father.id },
        { label: 'Mother', value: mother.id },
      ],
      type: 'ordinal',
      variable: 'auntRelation',
      Component: RadioGroup,
      validation: {
        onSubmit: (value) =>
          value?.value ? undefined : 'Relation is required',
      },
    },
    uncle: {
      fieldLabel: 'Whos is the uncle related to?',
      options: [
        { label: 'Father', value: father.id },
        { label: 'Mother', value: mother.id },
      ],
      type: 'ordinal',
      variable: 'uncleRelation',
      Component: RadioGroup,
      validation: {
        onSubmit: (value) =>
          value?.value ? undefined : 'Relation is required',
      },
    },
    halfSister: {
      fieldLabel: 'Who is the parent of your half sister?',
      options: [
        { label: 'Father', value: father.id },
        { label: 'Mother', value: mother.id },
      ],
      type: 'ordinal',
      variable: 'halfSisterRelation',
      Component: RadioGroup,
      validation: {
        onSubmit: (value) =>
          value?.value ? undefined : 'Relation is required',
      },
    },
    halfBrother: {
      fieldLabel: 'Who is the parent of your half brother?',
      options: [
        { label: 'Father', value: father.id },
        { label: 'Mother', value: mother.id },
      ],
      type: 'ordinal',
      variable: 'halfBrotherRelation',
      Component: RadioGroup,
      validation: {
        onSubmit: (value) =>
          value?.value ? undefined : 'Relation is required',
      },
    },
    firstCousinMale: {
      fieldLabel: 'Who is the parent of your first cousin?',
      options: firstCousinOptions,
      type: 'ordinal',
      variable: 'firstCousinMaleRelation',
      Component: RadioGroup,
      validation: {
        onSubmit: (value) =>
          value?.value ? undefined : 'Relation is required',
      },
    },
    firstCousinFemale: {
      fieldLabel: 'Who is the parent of your first cousin?',
      options: firstCousinOptions,
      type: 'ordinal',
      variable: 'firstCousinFemaleRelation',
      Component: RadioGroup,
      validation: {
        onSubmit: (value) =>
          value?.value ? undefined : 'Relation is required',
      },
    },
    niece: {
      fieldLabel: 'Who is the parent of your niece?',
      options: nieceOptions,
      type: 'ordinal',
      variable: 'nieceRelation',
      Component: RadioGroup,
      validation: {
        onSubmit: (value) =>
          value?.value ? undefined : 'Relation is required',
      },
    },
    nephew: {
      fieldLabel: 'Who is the parent of your nephew?',
      options: nieceOptions,
      type: 'ordinal',
      variable: 'nephewRelation',
      Component: RadioGroup,
      validation: {
        onSubmit: (value) =>
          value?.value ? undefined : 'Relation is required',
      },
    },
    granddaughter: {
      fieldLabel: 'Who is the parent of your granddaughter?',
      options: grandchildrenOptions,
      type: 'ordinal',
      variable: 'granddaughterRelation',
      Component: RadioGroup,
      validation: {
        onSubmit: (value) =>
          value?.value ? undefined : 'Relation is required',
      },
    },
    grandson: {
      fieldLabel: 'Who is the parent of your grandson?',
      options: grandchildrenOptions,
      type: 'ordinal',
      variable: 'grandsonRelation',
      Component: RadioGroup,
      validation: {
        onSubmit: (value) =>
          value?.value ? undefined : 'Relation is required',
      },
    },
  };