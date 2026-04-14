// Deterministic stand-in for forceSimulation.worker. Loaded only when
// NEXT_PUBLIC_E2E_TEST=true (see useForceSimulation.ts) so e2e snapshots
// of automatic-layout sociogram stages don't capture a randomly-evolving
// d3-force layout.
//
// The two-file split relies on webpack recognising the literal
// `new Worker(new URL("./this-file", import.meta.url), {...})` pattern
// in useForceSimulation.ts to bundle this file as a worker chunk —
// extracting the URL into a const breaks that recognition and ships
// the file as a static asset instead.
//
// Lays nodes out on a grid in simulation coordinates and emits `end`
// immediately for every command, so isRunning settles on the next
// event-loop turn (the test fixture waits on
// data-simulation-running="false"). The top-right quadrant is
// excluded because the CollapsablePrompts panel renders there and
// would intercept pointer events on any node placed beneath it.

type SimNode = {
  nodeId?: string;
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
};

type SimLink = { source: number; target: number };

type InitializeMessage = {
  type: 'initialize';
  network: { nodes: SimNode[]; links: SimLink[] };
};
type StopMessage = { type: 'stop' };
type StartMessage = { type: 'start' };
type ReheatMessage = { type: 'reheat' };
type UpdateNetworkMessage = {
  type: 'update_network';
  network: { nodes: SimNode[]; links: SimLink[] };
  restart: boolean;
};
type UpdateLinksMessage = { type: 'update_links'; links: SimLink[] };
type UpdateNodeMessage = {
  type: 'update_node';
  nodeId: string;
  node: Partial<SimNode>;
};
type UpdateOptionsMessage = { type: 'update_options'; options: unknown };

type Message =
  | InitializeMessage
  | StopMessage
  | StartMessage
  | ReheatMessage
  | UpdateNetworkMessage
  | UpdateLinksMessage
  | UpdateNodeMessage
  | UpdateOptionsMessage;

// GRID_HALF stays well inside SIM_RANGE (250) so all positions
// normalize within [0, 1] in the main thread.
const GRID_HALF = 200;

// Build all valid grid cells in row-major order, skipping the top-right
// quadrant in sim coords (x>0 && y<0).
function buildValidCells(side: number): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  const step = side > 1 ? (GRID_HALF * 2) / (side - 1) : 0;
  const origin = side > 1 ? -GRID_HALF : 0;
  for (let row = 0; row < side; row++) {
    for (let col = 0; col < side; col++) {
      const x = origin + col * step;
      const y = origin + row * step;
      if (x > 0 && y < 0) continue;
      cells.push({ x, y });
    }
  }
  return cells;
}

function gridLayout(input: SimNode[]): SimNode[] {
  const n = input.length;
  if (n === 0) return [];
  let side = Math.max(1, Math.ceil(Math.sqrt((n * 4) / 3)));
  let cells = buildValidCells(side);
  while (cells.length < n) {
    side += 1;
    cells = buildValidCells(side);
  }
  return input.map((node, i) => {
    if (node.fx != null && node.fy != null) {
      return { ...node, x: node.fx, y: node.fy };
    }
    const cell = cells[i]!;
    return { ...node, x: cell.x, y: cell.y };
  });
}

let nodes: SimNode[] = [];

function emit(type: 'tick' | 'end') {
  postMessage({ type, nodes });
}

onmessage = ({ data }: { data: Message }) => {
  switch (data.type) {
    case 'initialize':
      nodes = gridLayout(data.network.nodes);
      emit('tick');
      emit('end');
      break;
    case 'update_network':
      nodes = gridLayout(data.network.nodes);
      emit('end');
      break;
    case 'update_links':
    case 'start':
    case 'reheat':
    case 'stop':
    case 'update_options':
      emit('end');
      break;
    case 'update_node': {
      nodes = nodes.map((node) => {
        if (node.nodeId !== data.nodeId) return node;
        const patched: Partial<SimNode> = { ...data.node };
        if (patched.fx === null && node.fx != null) patched.x = node.fx;
        if (patched.fy === null && node.fy != null) patched.y = node.fy;
        if (patched.fx != null) patched.x = patched.fx;
        if (patched.fy != null) patched.y = patched.fy;
        return { ...node, ...patched };
      });
      emit('end');
      break;
    }
    default:
  }
};
