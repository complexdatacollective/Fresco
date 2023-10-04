import { Control } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '~/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

export const ColumnSelectField = ({
  control,
  csvColumns,
  label,
  description,
}: {
  control: Control<{
    csvFile: Record<string, string>[] | null;
    csvColumn?: string | undefined;
  }>;
  csvColumns: string[];
  label: string;
  description: string;
}) => (
  <FormField
    control={control}
    name="csvColumn"
    rules={{ required: false }}
    render={({ field, fieldState: { error } }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormDescription>{description}</FormDescription>
        <Select
          onValueChange={field.onChange}
          defaultValue=""
          value={field.value}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select a column..." />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {csvColumns.map((item) => (
              <SelectItem value={item} key={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <span className="text-sm text-destructive">{error?.message}</span>
        )}
      </FormItem>
    )}
  />
);
