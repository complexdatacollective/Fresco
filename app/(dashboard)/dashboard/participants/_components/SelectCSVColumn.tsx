'use client';

import { type Dispatch, type SetStateAction } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

interface SelectCSVColumnProps {
  csvColumns: string[];
  setSelectedColumn: Dispatch<SetStateAction<string>>;
}

function SelectCSVColumn({
  csvColumns,
  setSelectedColumn,
}: SelectCSVColumnProps) {
  return (
    <Select required onValueChange={setSelectedColumn}>
      <SelectTrigger>
        <SelectValue placeholder="Select a column" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>File Columns</SelectLabel>
          {csvColumns.map((column, index) => (
            <SelectItem key={index} value={column}>
              {column}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default SelectCSVColumn;
