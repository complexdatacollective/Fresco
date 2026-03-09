'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import {
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { type ParentEdgeType } from '~/lib/pedigree-layout/types';
import NameInput from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/NameInput';

export type AddPersonMode = 'parent' | 'child' | 'partner' | 'sibling';

type AddPersonFormProps = {
  mode: AddPersonMode;
  anchorNodeId: string;
  nodes: Map<string, NodeData>;
  edges: Map<string, StoreEdge>;
  onSubmit: (data: {
    name: string;
    mode: AddPersonMode;
    edgeType?: ParentEdgeType;
    partnerId?: string;
    current?: boolean;
  }) => void;
  onCancel: () => void;
};

const PARENT_EDGE_TYPE_LABELS: Record<ParentEdgeType, string> = {
  'social-parent': 'Social parent',
  'bio-parent': 'Biological parent',
  'donor': 'Donor',
  'surrogate': 'Surrogate',
  'co-parent': 'Co-parent',
};

export default function AddPersonForm({
  mode,
  anchorNodeId,
  nodes,
  edges,
  onSubmit,
  onCancel,
}: AddPersonFormProps) {
  const [name, setName] = useState('');
  const [edgeType, setEdgeType] = useState<ParentEdgeType>('social-parent');
  const [partnerId, setPartnerId] = useState<string | undefined>();
  const [current, setCurrent] = useState(true);

  const partners =
    mode === 'child'
      ? [...edges.values()]
          .filter(
            (edge) =>
              edge.type === 'partner' &&
              (edge.source === anchorNodeId || edge.target === anchorNodeId),
          )
          .map((edge) => {
            const otherNodeId =
              edge.source === anchorNodeId ? edge.target : edge.source;
            return { id: otherNodeId, node: nodes.get(otherNodeId) };
          })
          .filter(
            (p): p is { id: string; node: NodeData } => p.node !== undefined,
          )
      : [];

  const handleSubmit = () => {
    onSubmit({
      name,
      mode,
      edgeType: mode === 'parent' ? edgeType : undefined,
      partnerId: mode === 'child' ? partnerId : undefined,
      current: mode === 'partner' ? current : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-lg font-semibold capitalize">Add {mode}</h3>

      {mode === 'parent' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Parent type</legend>
          {(
            Object.entries(PARENT_EDGE_TYPE_LABELS) as [
              ParentEdgeType,
              string,
            ][]
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="edgeType"
                value={value}
                checked={edgeType === value}
                onChange={() => setEdgeType(value)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      )}

      {mode === 'child' && partners.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">
            With which partner?
          </legend>
          {partners.map(({ id, node }) => (
            <label key={id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="partnerId"
                value={id}
                checked={partnerId === id}
                onChange={() => setPartnerId(id)}
              />
              {node.label || 'Unknown'}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="partnerId"
              value=""
              checked={partnerId === undefined}
              onChange={() => setPartnerId(undefined)}
            />
            No partner (solo)
          </label>
        </fieldset>
      )}

      {mode === 'partner' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">
            Current or ex partner?
          </legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="current"
              value="current"
              checked={current}
              onChange={() => setCurrent(true)}
            />
            Current
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="current"
              value="ex"
              checked={!current}
              onChange={() => setCurrent(false)}
            />
            Ex
          </label>
        </fieldset>
      )}

      <NameInput value={name} onChange={setName} />

      <div className="flex gap-2">
        <Button onClick={handleSubmit} color="primary">
          Add
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
