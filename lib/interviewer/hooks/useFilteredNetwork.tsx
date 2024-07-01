import customFilter from '~/lib/network-query/filter';
import type { FilterDefinition, NcNetwork } from '~/schemas/network-canvas';

export default function useFilteredNodes({
  filter,
  network,
}: {
  filter?: FilterDefinition;
  network: NcNetwork;
}) {
  if (!filter) {
    return network;
  }

  const filterFunction = customFilter(filter);

  return filterFunction(network);
}
