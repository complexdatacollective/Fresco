'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { ICsvParticipant } from './ImportCSVModal';

interface SelectCSVColumnProps {
  setCsvParticipants: React.Dispatch<React.SetStateAction<ICsvParticipant[]>>;
  csvColumns: string[];
  parsedData: any[];
}

function SelectCSVColumn({
  csvColumns,
  setCsvParticipants,
  parsedData,
}: SelectCSVColumnProps) {
  const handleSelectChange = (val: string) => {
    const participants = parsedData.map((item: any) => ({
      identifier: item[val],
    }));

    setCsvParticipants([...participants]);
  };

  return (
    <Select onValueChange={handleSelectChange}>
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
