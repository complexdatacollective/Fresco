import FamilyTreeLayout from '../FamilyTreeLayout';

test('insertCousins places a cousin in the correct order', () => {
  const layout = new FamilyTreeLayout(
    [
      {
        id: 'self',
        label: 'self',
        isEgo: true,
        gender: 'male',
        parentIds: ['dad', 'mom'],
      },
      {
        id: 'mom',
        label: 'mom',
        gender: 'female',
        partnerId: 'dad',
        childIds: ['self'],
        parentIds: ['mat. grandpa', 'mat. grandma'],
        isEgo: false,
      },
      {
        id: 'mat. aunt',
        label: 'mat. aunt',
        gender: 'female',
        partnerId: 'mat. aunt partner',
        childIds: ['mat. cousin'],
        parentIds: ['mat. grandpa', 'mat. grandma'],
        isEgo: false,
      },
      {
        id: 'mat. aunt partner',
        label: 'mat. aunt partner',
        gender: 'male',
        partnerId: 'mat. aunt',
        childIds: ['mat. cousin'],
        isEgo: false,
      },
      {
        id: 'mat. cousin',
        label: 'mat. cousin',
        gender: 'female',
        parentIds: ['mat. aunt', 'mat. aunt partner'],
        isEgo: false,
      },
      {
        id: 'dad',
        label: 'dad',
        gender: 'male',
        partnerId: 'mom',
        childIds: ['self'],
        parentIds: ['pat. grandpa', 'pat. grandma'],
        isEgo: false,
      },
      {
        id: 'pat. uncle',
        label: 'pat. uncle',
        gender: 'male',
        partnerId: 'pat. uncle partner',
        childIds: ['pat. cousin'],
        parentIds: ['pat. grandpa', 'pat. grandma'],
        isEgo: false,
      },
      {
        id: 'pat. uncle partner',
        label: 'pat. uncle partner',
        gender: 'female',
        partnerId: 'pat. uncle',
        childIds: ['pat. cousin'],
        isEgo: false,
      },
      {
        id: 'pat. cousin',
        label: 'pat. cousin',
        gender: 'male',
        parentIds: ['pat. uncle', 'pat. uncle partner'],
        isEgo: false,
      },
      {
        id: 'pat. grandpa',
        label: 'pat. grandpa',
        gender: 'male',
        partnerId: 'pat. grandma',
        childIds: ['dad', 'pat. uncle'],
        isEgo: false,
      },
      {
        id: 'pat. grandma',
        label: 'pat. grandma',
        gender: 'female',
        partnerId: 'pat. grandpa',
        childIds: ['dad', 'pat. uncle'],
        isEgo: false,
      },
      {
        id: 'mat. grandpa',
        label: 'mat. grandpa',
        gender: 'male',
        partnerId: 'mat. grandma',
        childIds: ['mom', 'mat. aunt'],
        isEgo: false,
      },
      {
        id: 'mat. grandma',
        label: 'mat. grandma',
        gender: 'female',
        partnerId: 'mat. grandpa',
        childIds: ['mom', 'mat. aunt'],
        isEgo: false,
      },
    ],
    { siblings: 0, partners: 0, generations: 0 },
    true,
  );
  expect(layout.fullSiblingIds('mom')).toEqual(['mat. aunt']);
  expect(layout.fullSiblingIds('dad')).toEqual(['pat. uncle']);
  expect(layout.isAuntUncle('pat. uncle')).toBeTruthy();
  expect(layout.isAuntUncle('mat. aunt')).toBeTruthy();
  expect(layout.isCousin('pat. cousin')).toBeTruthy();
  expect(layout.isCousin('mat. cousin')).toBeTruthy();
  layout.assignLayers();
  layout.orderLayerGroups();
  layout.insertCousins();
  expect(layout.layerGroups.get(1)).toEqual([
    'mat. aunt',
    'mat. aunt partner',
    'mom',
    'dad',
    'pat. uncle partner',
    'pat. uncle',
  ]);
  expect(layout.layerGroups.get(2)).toEqual([
    'mat. cousin',
    'self',
    'pat. cousin',
  ]);
});

test('couples work with empty sets', () => {
  expect(new FamilyTreeLayout([]).couples.size).toBe(0);
  const layout = new FamilyTreeLayout([
    {
      id: 'self',
      label: 'self',
      gender: 'male',
      isEgo: false,
    },
    {
      id: 'partner',
      label: 'partner',
      gender: 'female',
      isEgo: false,
    },
  ]);
  expect(layout.couples.size).toBe(0);
});

test('couples are collected without duplicates', () => {
  const layout = new FamilyTreeLayout([
    {
      id: 'self',
      gender: 'female',
      partnerId: 'partner',
      label: '',
      isEgo: false,
    },
    {
      id: 'partner',
      gender: 'male',
      partnerId: 'self',
      label: '',
      isEgo: false,
    },
  ]);
  expect(layout.couples.size).toBe(1);
  expect(layout.couples.keys().next().value).toBe('partner|self');
});

test('layers work with empty sets', () => {
  expect(new FamilyTreeLayout([]).layerGroups.size).toBe(0);
  const layout = new FamilyTreeLayout([
    {
      id: 'self',
      gender: 'male',
      label: '',
      isEgo: false,
    },
    {
      id: 'partner',
      gender: 'female',
      label: '',
      isEgo: false,
    },
  ]);
  expect(layout.layerGroups.size).toBe(1);
  expect(layout.nodeLayer('self')).toBe(0);
  expect(layout.nodeLayer('partner')).toBe(0);
});

test('layers work with a hierarchy', () => {
  const layout = new FamilyTreeLayout([
    {
      id: 'self',
      isEgo: true,
      gender: 'female',
      partnerId: 'partner',
      parentIds: ['dad', 'mom'],
      label: '',
    },
    {
      id: 'partner',
      gender: 'male',
      partnerId: 'self',
      label: '',
      isEgo: false,
    },
    {
      id: 'dad',
      gender: 'male',
      partnerId: 'mom',
      childIds: ['self', 'sister'],
      label: '',
      isEgo: false,
    },
    {
      id: 'mom',
      gender: 'female',
      partnerId: 'dad',
      childIds: ['self', 'sister'],
      label: '',
      isEgo: false,
    },
    {
      id: 'sister',
      gender: 'female',
      parentIds: ['dad', 'mom'],
      label: '',
      isEgo: false,
    },
  ]);
  expect(layout.layerGroups.size).toBe(2);
  expect(layout.nodeLayer('self')).toBe(1);
  expect(layout.nodeLayer('partner')).toBe(1);
  expect(layout.nodeLayer('sister')).toBe(1);
  expect(layout.nodeLayer('dad')).toBe(0);
  expect(layout.nodeLayer('mom')).toBe(0);
});

test('layers are ordered and assigned coordinates for default tree', () => {
  const layout = new FamilyTreeLayout([
    {
      id: 'self',
      isEgo: true,
      gender: 'female',
      partnerId: 'partner',
      parentIds: ['dad', 'mom'],
      label: '',
    },
    {
      id: 'partner',
      gender: 'male',
      partnerId: 'self',
      label: '',
      isEgo: false,
    },
    {
      id: 'mom',
      gender: 'female',
      partnerId: 'dad',
      childIds: ['self'],
      parentIds: ['mat. grandpa', 'mat. grandma'],
      label: '',
      isEgo: false,
    },
    {
      id: 'dad',
      gender: 'male',
      partnerId: 'mom',
      childIds: ['self'],
      parentIds: ['pat. grandpa', 'pat. grandma'],
      label: '',
      isEgo: false,
    },
    {
      id: 'pat. grandpa',
      gender: 'male',
      partnerId: 'pat. grandma',
      childIds: ['dad'],
      label: '',
      isEgo: false,
    },
    {
      id: 'pat. grandma',
      gender: 'female',
      partnerId: 'pat. grandpa',
      childIds: ['dad'],
      label: '',
      isEgo: false,
    },
    {
      id: 'mat. grandpa',
      gender: 'male',
      partnerId: 'mat. grandma',
      childIds: ['mom'],
      label: '',
      isEgo: false,
    },
    {
      id: 'mat. grandma',
      gender: 'female',
      partnerId: 'mat. grandpa',
      childIds: ['mom'],
      label: '',
      isEgo: false,
    },
  ]);
  expect(layout.layerGroups.size).toBe(3);
  expect(layout.layerGroups.get(0)).toEqual([
    'mat. grandma',
    'mat. grandpa',
    'pat. grandma',
    'pat. grandpa',
  ]);
  expect(layout.layerGroups.get(1)).toEqual(['mom', 'dad']);
  expect(layout.layerGroups.get(2)).toEqual(['self', 'partner']);
  const self = layout.nodeById('self');
  expect(self?.xPos).toBe(80);
  expect(self?.yPos).toBe(200);
  const partner = layout.nodeById('partner');
  expect(partner?.xPos).toBe(160);
  expect(partner?.yPos).toBe(200);
  const mom = layout.nodeById('mom');
  expect(mom?.xPos).toBe(40);
  expect(mom?.yPos).toBe(100);
  const dad = layout.nodeById('dad');
  expect(dad?.xPos).toBe(120);
  expect(dad?.yPos).toBe(100);
  const matGrandma = layout.nodeById('mat. grandma');
  expect(matGrandma?.xPos).toBe(0);
  expect(matGrandma?.yPos).toBe(0);
  const matGrandpa = layout.nodeById('mat. grandpa');
  expect(matGrandpa?.xPos).toBe(80);
  expect(matGrandpa?.yPos).toBe(0);
  const patGrandma = layout.nodeById('pat. grandma');
  expect(patGrandma?.xPos).toBe(180);
  expect(patGrandma?.yPos).toBe(0);
  const patGrandpa = layout.nodeById('pat. grandpa');
  expect(patGrandpa?.xPos).toBe(260);
  expect(patGrandpa?.yPos).toBe(0);
});

test('layers are ordered and assigned coordinates for ex partner', () => {
  const layout = new FamilyTreeLayout([
    {
      id: 'self',
      isEgo: true,
      gender: 'male',
      parentIds: ['dad', 'mom'],
      label: '',
    },
    {
      id: 'mom',
      gender: 'female',
      partnerId: 'dad',
      exPartnerId: 'mom`s ex',
      childIds: ['self'],
      parentIds: ['mat. grandpa', 'mat. grandma'],
      label: '',
      isEgo: false,
    },
    {
      id: 'dad',
      gender: 'male',
      partnerId: 'mom',
      exPartnerId: 'dad`s ex',
      childIds: ['self'],
      parentIds: ['pat. grandpa', 'pat. grandma'],
      label: '',
      isEgo: false,
    },
    {
      id: 'pat. uncle',
      gender: 'male',
      parentIds: ['pat. grandpa', 'pat. grandma'],
      label: '',
      isEgo: false,
    },
    {
      id: 'mom`s ex',
      gender: 'male',
      exPartnerId: 'mom',
      label: '',
      isEgo: false,
    },
    {
      id: 'dad`s ex',
      gender: 'female',
      exPartnerId: 'dad',
      label: '',
      isEgo: false,
    },
    {
      id: 'mat. aunt',
      gender: 'female',
      parentIds: ['mat. grandpa', 'mat. grandma'],
      label: '',
      isEgo: false,
    },
    {
      id: 'pat. grandpa',
      gender: 'male',
      partnerId: 'pat. grandma',
      childIds: ['dad', 'pat. uncle'],
      label: '',
      isEgo: false,
    },
    {
      id: 'pat. grandma',
      gender: 'female',
      partnerId: 'pat. grandpa',
      childIds: ['pat. uncle', 'dad'],
      label: '',
      isEgo: false,
    },
    {
      id: 'mat. grandpa',
      gender: 'male',
      partnerId: 'mat. grandma',
      childIds: ['mom', 'mat. aunt'],
      label: '',
      isEgo: false,
    },
    {
      id: 'mat. grandma',
      gender: 'female',
      partnerId: 'mat. grandpa',
      childIds: ['mom', 'mat. aunt'],
      label: '',
      isEgo: false,
    },
  ]);
  expect(layout.layerGroups.size).toBe(3);
  expect(layout.layerGroups.get(0)).toEqual([
    'mat. grandma',
    'mat. grandpa',
    'pat. grandma',
    'pat. grandpa',
  ]);
  expect(layout.layerGroups.get(1)).toEqual([
    'mat. aunt',
    'mom`s ex',
    'mom',
    'dad',
    'dad`s ex',
    'pat. uncle',
  ]);
  expect(layout.layerGroups.get(2)).toEqual(['self']);
  const self = layout.nodeById('self');
  expect(self?.xPos).toBe(0);
  expect(self?.yPos).toBe(200);
  const matAunt = layout.nodeById('mat. aunt');
  expect(matAunt?.xPos).toBe(0);
  expect(matAunt?.yPos).toBe(100);
  const momEx = layout.nodeById('mom`s ex');
  expect(momEx?.xPos).toBe(100);
  expect(momEx?.yPos).toBe(100);
  const mom = layout.nodeById('mom');
  expect(mom?.xPos).toBe(200);
  expect(mom?.yPos).toBe(100);
  const dad = layout.nodeById('dad');
  expect(dad?.xPos).toBe(280);
  expect(dad?.yPos).toBe(100);
  const dadEx = layout.nodeById('dad`s ex');
  expect(dadEx?.xPos).toBe(380);
  expect(dadEx?.yPos).toBe(100);
  const patUncle = layout.nodeById('pat. uncle');
  expect(patUncle?.xPos).toBe(480);
  expect(patUncle?.yPos).toBe(100);
  const matGrandma = layout.nodeById('mat. grandma');
  expect(matGrandma?.xPos).toBe(60);
  expect(matGrandma?.yPos).toBe(0);
  const matGrandpa = layout.nodeById('mat. grandpa');
  expect(matGrandpa?.xPos).toBe(140);
  expect(matGrandpa?.yPos).toBe(0);
  const patGrandma = layout.nodeById('pat. grandma');
  expect(patGrandma?.xPos).toBe(340);
  expect(patGrandma?.yPos).toBe(0);
  const patGrandpa = layout.nodeById('pat. grandpa');
  expect(patGrandpa?.xPos).toBe(420);
  expect(patGrandpa?.yPos).toBe(0);
});

test('nieces and nephews are laid out correctly', () => {
  const layout = new FamilyTreeLayout([
    {
      id: 'self',
      isEgo: true,
      gender: 'male',
      partnerId: 'partner',
      childIds: ['son'],
      parentIds: ['dad', 'mom'],
      label: '',
    },
    {
      id: 'partner',
      gender: 'female',
      partnerId: 'self',
      childIds: ['son'],
      label: '',
      isEgo: false,
    },
    {
      id: 'son',
      gender: 'male',
      parentIds: ['self', 'partner'],
      label: '',
      isEgo: false,
    },
    {
      id: 'sister',
      gender: 'female',
      parentIds: ['dad', 'mom'],
      label: '',
      isEgo: false,
    },
    {
      id: 'brother',
      gender: 'male',
      partnerId: 'brother`s partner',
      childIds: ['niece'],
      parentIds: ['dad', 'mom'],
      label: '',
      isEgo: false,
    },
    {
      id: 'brother`s partner',
      gender: 'female',
      partnerId: 'brother',
      childIds: ['niece'],
      label: '',
      isEgo: false,
    },
    {
      id: 'niece',
      gender: 'female',
      parentIds: ['brother', 'brother`s partner'],
      label: '',
      isEgo: false,
    },
    {
      id: 'mom',
      gender: 'female',
      partnerId: 'dad',
      childIds: ['self', 'sister', 'brother'],
      parentIds: ['mat. grandpa', 'mat. grandma'],
      label: '',
      isEgo: false,
    },
    {
      id: 'dad',
      gender: 'male',
      partnerId: 'mom',
      childIds: ['self', 'sister', 'brother'],
      parentIds: ['pat. grandpa', 'pat. grandma'],
      label: '',
      isEgo: false,
    },
    {
      id: 'pat. grandpa',
      gender: 'male',
      partnerId: 'pat. grandma',
      childIds: ['dad'],
      label: '',
      isEgo: false,
    },
    {
      id: 'pat. grandma',
      gender: 'female',
      partnerId: 'pat. grandpa',
      childIds: ['dad'],
      label: '',
      isEgo: false,
    },
    {
      id: 'mat. grandpa',
      gender: 'male',
      partnerId: 'mat. grandma',
      childIds: ['mom'],
      label: '',
      isEgo: false,
    },
    {
      id: 'mat. grandma',
      gender: 'female',
      partnerId: 'mat. grandpa',
      childIds: ['mom'],
      label: '',
      isEgo: false,
    },
  ]);
  expect(layout.layerGroups.get(0)).toEqual([
    'mat. grandma',
    'mat. grandpa',
    'pat. grandma',
    'pat. grandpa',
  ]);
  expect(layout.layerGroups.get(1)).toEqual(['mom', 'dad']);
  expect(layout.layerGroups.get(2)).toEqual([
    'sister',
    'partner',
    'self',
    'brother`s partner',
    'brother',
  ]);
  expect(layout.layerGroups.get(3)).toEqual(['son', 'niece']);
  let node = layout.nodeById('sister');
  expect(node?.xPos).toBe(0);
  node = layout.nodeById('partner');
  expect(node?.xPos).toBe(100);
  node = layout.nodeById('self');
  expect(node?.xPos).toBe(180);
  node = layout.nodeById('brother`s partner');
  expect(node?.xPos).toBe(280);
  node = layout.nodeById('brother');
  expect(node?.xPos).toBe(360);
  node = layout.nodeById('son');
  expect(node?.xPos).toBe(0);
  node = layout.nodeById('niece');
  expect(node?.xPos).toBe(100);
});

test('layers are ordered and assigned coordinates for complex trees', () => {
  const nodes = [
    {
      id: 'self',
      isEgo: true,
      gender: 'female',
      partnerId: 'partner',
      parentIds: ['dad', 'mom'],
      childIds: ['son1', 'daughter1', 'son2', 'daughter2'],
      label: '',
    },
    {
      id: 'partner',
      isEgo: false,
      gender: 'male',
      partnerId: 'self',
      childIds: ['son1', 'daughter1', 'son2', 'daughter2'],
      label: '',
    },
    {
      id: 'pat. uncle',
      isEgo: false,
      gender: 'male',
      partnerId: 'pat. uncle partner',
      parentIds: ['pat. grandpa', 'pat. grandma'],
      childIds: ['pat. uncle cousin'],
      label: '',
    },
    {
      id: 'pat. uncle partner',
      isEgo: false,
      gender: 'female',
      partnerId: 'pat. uncle',
      childIds: ['pat. uncle cousin'],
      label: '',
    },
    {
      id: 'dad',
      isEgo: false,
      gender: 'male',
      partnerId: 'mom',
      exPartnerId: 'dad`s ex',
      childIds: ['self', 'sister', 'brother1', 'brother2', 'half brother'],
      parentIds: ['pat. grandpa', 'pat. grandma'],
      label: '',
    },
    {
      id: 'mom',
      isEgo: false,
      gender: 'female',
      partnerId: 'dad',
      exPartnerId: 'mom`s ex',
      childIds: ['self', 'sister', 'brother1', 'brother2', 'half sister'],
      parentIds: ['mat. grandpa', 'mat. grandma'],
      label: '',
    },
    {
      id: 'dad`s ex',
      isEgo: false,
      gender: 'female',
      exPartnerId: 'dad',
      childIds: ['half brother'],
      label: '',
    },
    {
      id: 'mom`s ex',
      isEgo: false,
      gender: 'male',
      exPartnerId: 'mom',
      childIds: ['half sister'],
      label: '',
    },
    {
      id: 'sister',
      isEgo: false,
      gender: 'female',
      parentIds: ['mom', 'dad'],
      label: '',
    },
    {
      id: 'brother1',
      isEgo: false,
      gender: 'male',
      parentIds: ['mom', 'dad'],
      label: '',
    },
    {
      id: 'brother2',
      isEgo: false,
      gender: 'male',
      parentIds: ['mom', 'dad'],
      label: '',
    },
    {
      id: 'half sister',
      isEgo: false,
      gender: 'female',
      parentIds: ['mom', 'mom`s ex'],
      label: '',
    },
    {
      id: 'half brother',
      isEgo: false,
      gender: 'male',
      parentIds: ['dad', 'dad`s ex'],
      label: '',
    },
    {
      id: 'mat. aunt',
      isEgo: false,
      gender: 'female',
      parentIds: ['mat. grandpa', 'mat. grandma'],
      label: '',
    },
    {
      id: 'mat. aunt2',
      isEgo: false,
      gender: 'female',
      parentIds: ['mat. grandpa', 'mat. grandma'],
      label: '',
    },
    {
      id: 'pat. grandpa',
      isEgo: false,
      gender: 'male',
      partnerId: 'pat. grandma',
      childIds: ['dad', 'pat. uncle'],
      label: '',
    },
    {
      id: 'pat. grandma',
      isEgo: false,
      gender: 'female',
      partnerId: 'pat. grandpa',
      childIds: ['pat. uncle', 'dad'],
      label: '',
    },
    {
      id: 'mat. grandpa',
      isEgo: false,
      gender: 'male',
      partnerId: 'mat. grandma',
      childIds: ['mom', 'mat. aunt', 'mat. aunt2'],
      label: '',
    },
    {
      id: 'mat. grandma',
      isEgo: false,
      gender: 'female',
      partnerId: 'mat. grandpa',
      childIds: ['mom', 'mat. aunt', 'mat. aunt2'],
      label: '',
    },
    {
      id: 'son1',
      isEgo: false,
      gender: 'male',
      partnerId: 'son1 partner',
      childIds: ['granddaughter'],
      parentIds: ['self', 'partner'],
      label: '',
    },
    {
      id: 'son1 partner',
      isEgo: false,
      gender: 'female',
      partnerId: 'son1',
      childIds: ['granddaughter'],
      label: '',
    },
    {
      id: 'daughter1',
      isEgo: false,
      gender: 'female',
      parentIds: ['self', 'partner'],
      label: '',
    },
    {
      id: 'daughter2',
      isEgo: false,
      gender: 'female',
      parentIds: ['self', 'partner'],
      label: '',
    },
    {
      id: 'son2',
      isEgo: false,
      gender: 'male',
      parentIds: ['self', 'partner'],
      label: '',
    },
    {
      id: 'granddaughter',
      isEgo: false,
      gender: 'female',
      parentIds: ['son1', 'son1 partner'],
      label: '',
    },
    {
      id: 'pat. uncle cousin',
      isEgo: false,
      gender: 'female',
      parentIds: ['pat. uncle', 'pat. uncle partner'],
      label: '',
    },
  ];
  const initialLayout = new FamilyTreeLayout(nodes, {
    siblings: 150,
    partners: 120,
    generations: 180,
  });
  // ensure that the algorithm is idempotent
  const layout = new FamilyTreeLayout(initialLayout.nodes, {
    siblings: 150,
    partners: 120,
    generations: 180,
  });
  expect(layout.layerGroups.size).toBe(5);
  expect(layout.layerGroups.get(0)).toEqual([
    'mat. grandma',
    'mat. grandpa',
    'pat. grandma',
    'pat. grandpa',
  ]);
  expect(layout.layerGroups.get(1)).toEqual([
    'mat. aunt',
    'mat. aunt2',
    'mom`s ex',
    'mom',
    'dad',
    'dad`s ex',
    'pat. uncle partner',
    'pat. uncle',
  ]);
  expect(layout.layerGroups.get(2)).toEqual([
    'half sister',
    'sister',
    'brother1',
    'brother2',
    'self',
    'partner',
    'half brother',
    'pat. uncle cousin',
  ]);
  expect(layout.layerGroups.get(3)).toEqual([
    'daughter1',
    'daughter2',
    'son2',
    'son1 partner',
    'son1',
  ]);
  expect(layout.layerGroups.get(4)).toEqual(['granddaughter']);
  const granddaughter = layout.nodeById('granddaughter');
  expect(granddaughter?.xPos).toBe(0);
  expect(granddaughter?.yPos).toBe(720);
  const son1partner = layout.nodeById('son1 partner');
  expect(son1partner?.xPos).toBe(450);
  expect(son1partner?.yPos).toBe(540);
  const son1 = layout.nodeById('son1');
  expect(son1?.xPos).toBe(570);
  expect(son1?.yPos).toBe(540);
  const daughter1 = layout.nodeById('daughter1');
  expect(daughter1?.xPos).toBe(0);
  expect(daughter1?.yPos).toBe(540);
  const daughter2 = layout.nodeById('daughter2');
  expect(daughter2?.xPos).toBe(150);
  expect(daughter2?.yPos).toBe(540);
  const son2 = layout.nodeById('son2');
  expect(son2?.xPos).toBe(300);
  expect(son2?.yPos).toBe(540);
  const halfSister = layout.nodeById('half sister');
  expect(halfSister?.xPos).toBe(0);
  expect(halfSister?.yPos).toBe(360);
  const sister = layout.nodeById('sister');
  expect(sister?.xPos).toBe(150);
  expect(sister?.yPos).toBe(360);
  const brother1 = layout.nodeById('brother1');
  expect(brother1?.xPos).toBe(300);
  expect(brother1?.yPos).toBe(360);
  const brother2 = layout.nodeById('brother2');
  expect(brother2?.xPos).toBe(450);
  expect(brother2?.yPos).toBe(360);
  const self = layout.nodeById('self');
  expect(self?.xPos).toBe(600);
  expect(self?.yPos).toBe(360);
  const partner = layout.nodeById('partner');
  expect(partner?.xPos).toBe(720);
  expect(partner?.yPos).toBe(360);
  const halfBrother = layout.nodeById('half brother');
  expect(halfBrother?.xPos).toBe(870);
  expect(halfBrother?.yPos).toBe(360);
  const matAunt = layout.nodeById('mat. aunt');
  expect(matAunt?.xPos).toBe(0);
  expect(matAunt?.yPos).toBe(180);
  const matAunt2 = layout.nodeById('mat. aunt2');
  expect(matAunt2?.xPos).toBe(150);
  expect(matAunt2?.yPos).toBe(180);
  const momEx = layout.nodeById('mom`s ex');
  expect(momEx?.xPos).toBe(300);
  expect(momEx?.yPos).toBe(180);
  const mom = layout.nodeById('mom');
  expect(mom?.xPos).toBe(420);
  expect(mom?.yPos).toBe(180);
  const dad = layout.nodeById('dad');
  expect(dad?.xPos).toBe(540);
  expect(dad?.yPos).toBe(180);
  const dadEx = layout.nodeById('dad`s ex');
  expect(dadEx?.xPos).toBe(660);
  expect(dadEx?.yPos).toBe(180);
  const patUncle = layout.nodeById('pat. uncle');
  expect(patUncle?.xPos).toBe(1080);
  expect(patUncle?.yPos).toBe(180);
  const matGrandma = layout.nodeById('mat. grandma');
  expect(matGrandma?.xPos).toBe(130);
  expect(matGrandma?.yPos).toBe(0);
  const matGrandpa = layout.nodeById('mat. grandpa');
  expect(matGrandpa?.xPos).toBe(250);
  expect(matGrandpa?.yPos).toBe(0);
  const patGrandma = layout.nodeById('pat. grandma');
  expect(patGrandma?.xPos).toBe(750);
  expect(patGrandma?.yPos).toBe(0);
  const patGrandpa = layout.nodeById('pat. grandpa');
  expect(patGrandpa?.xPos).toBe(870);
  expect(patGrandpa?.yPos).toBe(0);
});

test('maternal uncle layout', () => {
  const layout = new FamilyTreeLayout([
    {
      id: 'self',
      isEgo: true,
      gender: 'female',
      partnerId: 'partner',
      parentIds: ['dad', 'mom'],
      label: '',
    },
    {
      id: 'partner',
      gender: 'male',
      partnerId: 'self',
      label: '',
      isEgo: false,
    },
    {
      id: 'dad',
      gender: 'male',
      partnerId: 'mom',
      childIds: ['self'],
      parentIds: ['pat. grandpa', 'pat. grandma'],
      label: '',
      isEgo: false,
    },
    {
      id: 'mom',
      gender: 'female',
      partnerId: 'dad',
      childIds: ['self'],
      parentIds: ['mat. grandpa', 'mat. grandma'],
      label: '',
      isEgo: false,
    },
    {
      id: 'mat. uncle',
      gender: 'male',
      parentIds: ['mat. grandpa', 'mat. grandma'],
      label: '',
      isEgo: false,
    },
    {
      id: 'pat. grandpa',
      gender: 'male',
      partnerId: 'pat. grandma',
      childIds: ['dad'],
      label: '',
      isEgo: false,
    },
    {
      id: 'pat. grandma',
      gender: 'female',
      partnerId: 'pat. grandpa',
      childIds: ['dad'],
      label: '',
      isEgo: false,
    },
    {
      id: 'mat. grandpa',
      gender: 'male',
      partnerId: 'mat. grandma',
      childIds: ['mom', 'mat. uncle'],
      label: '',
      isEgo: false,
    },
    {
      id: 'mat. grandma',
      gender: 'female',
      partnerId: 'mat. grandpa',
      childIds: ['mom', 'mat. uncle'],
      label: '',
      isEgo: false,
    },
  ]);
  const self = layout.nodeById('self');
  expect(self?.xPos).toBe(0);
  const partner = layout.nodeById('partner');
  expect(partner?.xPos).toBe(80);
  const matAunt = layout.nodeById('mat. uncle');
  expect(matAunt?.xPos).toBe(0);
  const mom = layout.nodeById('mom');
  expect(mom?.xPos).toBe(100);
  const dad = layout.nodeById('dad');
  expect(dad?.xPos).toBe(180);
  const matGrandma = layout.nodeById('mat. grandma');
  expect(matGrandma?.xPos).toBe(10);
  const matGrandpa = layout.nodeById('mat. grandpa');
  expect(matGrandpa?.xPos).toBe(90);
  const patGrandma = layout.nodeById('pat. grandma');
  expect(patGrandma?.xPos).toBe(190);
  const patGrandpa = layout.nodeById('pat. grandpa');
  expect(patGrandpa?.xPos).toBe(270);
});
