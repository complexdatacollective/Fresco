import React from 'react';
import { useFieldArray, type FieldArrayItem } from '../hooks/useFieldArray';

type FieldArrayProps = {
  name: string;
  children: (props: {
    fields: FieldArrayItem[];
    append: (value: any) => void;
    remove: (index: number) => void;
    move: (from: number, to: number) => void;
    insert: (index: number, value: any) => void;
    swap: (indexA: number, indexB: number) => void;
  }) => React.ReactNode;
};

export function FieldArray({ name, children }: FieldArrayProps) {
  const fieldArrayProps = useFieldArray(name);

  return <>{children(fieldArrayProps)}</>;
}
