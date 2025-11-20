import { isEmpty } from 'es-toolkit/compat';
import { X as ClearIcon, Search as SearchIcon } from 'lucide-react';
import { type ComponentProps, useCallback } from 'react';
import { getCSSVariableAsString } from '~/lib/ui/utils/CSSVariables';
import { useFieldContext } from '~/lib/form/utils/formContexts';
import Text from './Text';

type SearchProps = ComponentProps<typeof Text>;

const Search = (props: SearchProps) => {
  const fieldContext = useFieldContext();
  const color = getCSSVariableAsString('--nc-input-text');

  const hasValue = !isEmpty(fieldContext.state.value as string);

  // Call the change handler with an empty string
  const handleClear = useCallback(() => {
    fieldContext.handleChange('');
  }, [fieldContext]);

  const adornmentLeft = color && <SearchIcon style={{ color }} />;

  const adornmentRight = color && hasValue && (
    <ClearIcon
      style={{
        color,
        cursor: 'pointer',
      }}
      onClick={handleClear}
    />
  );

  return (
    <Text
      adornmentLeft={adornmentLeft}
      adornmentRight={adornmentRight}
      {...props}
      type="search"
    />
  );
};

export default Search;
