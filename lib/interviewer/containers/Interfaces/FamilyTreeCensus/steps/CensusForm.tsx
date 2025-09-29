import { invariant } from 'es-toolkit';
import { useEffect, useState } from 'react';
import NumberInput from '~/lib/ui/components/Fields/Number';

const arrayFromRelationCount = (
  formData: Record<string, number>,
  relation: string,
) => Array.from({ length: formData[relation] ?? 0 });

class Network {
  private nodes = new Map<
    string,
    {
      label: string;
      gender: 'male' | 'female';
      readOnly?: boolean;
    }
  >();

  private edges = new Map<
    string,
    {
      source: string;
      target: string;
      relationship: string;
    }
  >();

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode({
    id = crypto.randomUUID(),
    label,
    gender,
    readOnly = false,
  }: {
    id?: string;
    label: string;
    gender: 'male' | 'female';
    readOnly?: boolean;
  }) {
    invariant(!this.nodes.has(id), `Node with ID ${id} already exists`);

    const node = {
      label,
      gender,
      readOnly,
    };
    this.nodes.set(id, node);
    return {
      id,
      ...node,
    };
  }

  addEdge({
    source,
    target,
    relationship,
  }: {
    source: string;
    target: string;
    relationship: string;
  }) {
    const edgeId = `${source}-${target}-${relationship}`;
    if (this.edges.has(edgeId)) {
      return; // Edge already exists
    }
    const edge = { source, target, relationship };
    this.edges.set(edgeId, edge);
    return {
      id: edgeId,
      ...edge,
    };
  }

  toObject() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
    };
  }
}

const generatePlaceholderNodes = (formData: {
  'brothers': number;
  'sisters': number;
  'sons': number;
  'daughters': number;
  'maternal-uncles': number;
  'maternal-aunts': number;
  'paternal-uncles': number;
  'paternal-aunts': number;
}) => {
  /**
   * Base family members (always present in the tree)
   * - Maternal grandparents (grandmother, grandfather)
   * - Paternal grandparents (grandmother, grandfather)
   * - Mother
   * - Father
   * - Ego (self)
   */
  const network = new Network();

  // Maternal grandparents
  network.addNode({
    id: 'maternal-grandmother',
    label: 'maternal grandmother',
    gender: 'female',
    readOnly: true,
  });
  network.addNode({
    id: 'maternal-grandfather',
    label: 'maternal grandfather',
    gender: 'male',
    readOnly: true,
  });

  network.addEdge({
    source: 'maternal-grandfather',
    target: 'maternal-grandmother',
    relationship: 'partner',
  });

  // Paternal grandparents
  network.addNode({
    id: 'paternal-grandmother',
    label: 'paternal grandmother',
    gender: 'female',
    readOnly: true,
  });
  network.addNode({
    id: 'paternal-grandfather',
    label: 'paternal grandfather',
    gender: 'male',
    readOnly: true,
  });

  network.addEdge({
    source: 'paternal-grandfather',
    target: 'paternal-grandmother',
    relationship: 'partner',
  });

  // Mother
  network.addNode({
    id: 'mother',
    label: 'mother',
    gender: 'female',
    readOnly: true,
  });

  network.addEdge({
    source: 'maternal-grandfather',
    target: 'mother',
    relationship: 'parent',
  });
  network.addEdge({
    source: 'maternal-grandmother',
    target: 'mother',
    relationship: 'parent',
  });

  // Father
  network.addNode({
    id: 'father',
    label: 'father',
    gender: 'male',
    readOnly: true,
  });
  network.addEdge({
    source: 'paternal-grandfather',
    target: 'father',
    relationship: 'parent',
  });
  network.addEdge({
    source: 'paternal-grandmother',
    target: 'father',
    relationship: 'parent',
  });

  network.addEdge({
    source: 'father',
    target: 'mother',
    relationship: 'partner',
  });

  // Ego (self)
  network.addNode({
    id: 'ego',
    label: 'self',
    gender: 'female', // TODO: Make dynamic based on user input
    readOnly: true,
  });

  // Add siblings, children, uncles, aunts
  arrayFromRelationCount(formData, 'brothers').forEach(() => {
    const brother = network.addNode({
      label: 'brother',
      gender: 'male',
    });

    network.addEdge({
      source: 'father',
      target: brother.id,
      relationship: 'parent',
    });
    network.addEdge({
      source: 'mother',
      target: brother.id,
      relationship: 'parent',
    });
  });

  arrayFromRelationCount(formData, 'sisters').forEach(() => {
    const sister = network.addNode({
      label: 'sister',
      gender: 'female',
    });

    network.addEdge({
      source: 'father',
      target: sister.id,
      relationship: 'parent',
    });
    network.addEdge({
      source: 'mother',
      target: sister.id,
      relationship: 'parent',
    });
  });

  // Ego's children and partner
  if (formData.sons > 0 || formData.daughters > 0) {
    const egoPartner = network.addNode({
      id: 'ego-partner',
      label: "self's partner",
      gender: 'male', // TODO: Make dynamic based on user input
      readOnly: true,
    });

    network.addEdge({
      source: 'ego',
      target: egoPartner.id,
      relationship: 'partner',
    });

    arrayFromRelationCount(formData, 'sons').forEach(() => {
      const son = network.addNode({
        label: 'son',
        gender: 'male',
        readOnly: true,
      });
      network.addEdge({
        source: 'ego',
        target: son.id,
        relationship: 'parent',
      });
      network.addEdge({
        source: 'ego-partner',
        target: son.id,
        relationship: 'parent',
      });
    });

    arrayFromRelationCount(formData, 'daughters').forEach(() => {
      const daughter = network.addNode({
        label: 'daughter',
        gender: 'female',
      });
      network.addEdge({
        source: 'ego',
        target: daughter.id,
        relationship: 'parent',
      });
      network.addEdge({
        source: 'ego-partner',
        target: daughter.id,
        relationship: 'parent',
      });
    });
  }

  arrayFromRelationCount(formData, 'paternal-uncles').forEach(() => {
    const paternalUncle = network.addNode({
      label: 'paternal uncle',
      gender: 'male',
    });

    network.addEdge({
      source: 'paternal-grandfather',
      target: paternalUncle.id,
      relationship: 'parent',
    });
    network.addEdge({
      source: 'paternal-grandmother',
      target: paternalUncle.id,
      relationship: 'parent',
    });
  });

  arrayFromRelationCount(formData, 'paternal-aunts').forEach(() => {
    const paternalAunt = network.addNode({
      label: 'paternal aunt',
      gender: 'female',
    });

    network.addEdge({
      source: 'paternal-grandfather',
      target: paternalAunt.id,
      relationship: 'parent',
    });
    network.addEdge({
      source: 'paternal-grandmother',
      target: paternalAunt.id,
      relationship: 'parent',
    });
  });

  arrayFromRelationCount(formData, 'maternal-uncles').forEach(() => {
    const maternalUncle = network.addNode({
      label: 'maternal uncle',
      gender: 'male',
    });
    network.addEdge({
      source: 'maternal-grandfather',
      target: maternalUncle.id,
      relationship: 'parent',
    });
    network.addEdge({
      source: 'maternal-grandmother',
      target: maternalUncle.id,
      relationship: 'parent',
    });
  });

  arrayFromRelationCount(formData, 'maternal-aunts').forEach(() => {
    const maternalAunt = network.addNode({
      label: 'maternal aunt',
      gender: 'female',
    });
    network.addEdge({
      source: 'maternal-grandfather',
      target: maternalAunt.id,
      relationship: 'parent',
    });
    network.addEdge({
      source: 'maternal-grandmother',
      target: maternalAunt.id,
      relationship: 'parent',
    });
  });

  return network.toObject();
};

export const CensusForm = () => {
  const [fields, setFields] = useState<
    {
      variable:
        | 'brothers'
        | 'sisters'
        | 'sons'
        | 'daughters'
        | 'maternal-uncles'
        | 'maternal-aunts'
        | 'paternal-uncles'
        | 'paternal-aunts';
      label: string;
      value: string;
      error: string | null;
    }[]
  >([
    {
      variable: 'brothers',
      label: 'How many brothers do you have?',
      value: '',
      error: null,
    },
    {
      variable: 'sisters',
      label: 'How many sisters do you have?',
      value: '',
      error: null,
    },
    {
      variable: 'sons',
      label: 'How many sons do you have?',
      value: '',
      error: null,
    },
    {
      variable: 'daughters',
      label: 'How many daughters do you have?',
      value: '',
      error: null,
    },
    {
      variable: 'maternal-uncles',
      label: 'How many brothers does your mother have?',
      value: '',
      error: null,
    },
    {
      variable: 'maternal-aunts',
      label: 'How many sisters does your mother have?',
      value: '',
      error: null,
    },
    {
      variable: 'paternal-uncles',
      label: 'How many brothers does your father have?',
      value: '',
      error: null,
    },
    {
      variable: 'paternal-aunts',
      label: 'How many sisters does your father have?',
      value: '',
      error: null,
    },
  ]);

  const handleSetFieldValue =
    (variable: string) => (value: number | string) => {
      // Convert to string for storage
      const stringValue =
        value === null || value === undefined ? '' : String(value);

      // Validate if it's a number
      if (stringValue !== '') {
        const numValue = parseInt(stringValue, 10);
        if (isNaN(numValue) || numValue < 0) {
          setFields((prevFields) =>
            prevFields.map((field) =>
              field.variable === variable
                ? {
                    ...field,
                    value: stringValue,
                    error: 'Value must be 0 or greater',
                  }
                : field,
            ),
          );
          return;
        }
      }

      setFields((prevFields) =>
        prevFields.map((field) =>
          field.variable === variable
            ? { ...field, value: stringValue, error: null }
            : field,
        ),
      );
    };

  const fieldValueMap = fields.reduce(
    (acc, field) => {
      // Convert string value to number, defaulting to 0 if empty
      acc[field.variable] =
        field.value === '' ? 0 : parseInt(field.value, 10) || 0;
      return acc;
    },
    {} as Record<
      | 'brothers'
      | 'sisters'
      | 'sons'
      | 'daughters'
      | 'maternal-uncles'
      | 'maternal-aunts'
      | 'paternal-uncles'
      | 'paternal-aunts',
      number
    >,
  );

  console.log(fieldValueMap);

  /**
   * When the values change, we need to recalculate the placeholder nodes.
   */
  useEffect(() => {
    console.log(generatePlaceholderNodes(fieldValueMap));
  }, [fields]);

  return (
    <div className="min-h-0 overflow-y-auto px-10">
      <div className="mx-auto grid max-w-5xl gap-10 *:mb-0! md:grid-cols-2">
        {fields.map(({ variable, label, error, value }) => (
          <NumberInput
            tabIndex={0}
            key={variable}
            placeholder="0"
            input={{
              name: variable,
              value: value,
              onChange: handleSetFieldValue(variable),
              onBlur: () => {
                // No-op
              },
            }}
            meta={{ error, invalid: !!error, touched: !!error }}
            label={label}
            className="mb-4"
          />
        ))}
      </div>
    </div>
  );
};
