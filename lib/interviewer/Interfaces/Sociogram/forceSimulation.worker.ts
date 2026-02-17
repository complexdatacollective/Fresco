/* eslint-disable no-console */
import * as d3 from 'd3';

const DEFAULT_OPTIONS = {
  alphaDecay: 1 - Math.pow(0.001, 1 / 300),
  velocityDecay: 0.1,
  charge: -30,
  linkDistance: 30,
  center: 0.1,
} as const;

type ForceSimulationOptions = typeof DEFAULT_OPTIONS;

type SimNode = d3.SimulationNodeDatum & { nodeId?: string };

let simulation: d3.Simulation<SimNode, undefined>;
let links: d3.SimulationLinkDatum<SimNode>[];
let options = { ...DEFAULT_OPTIONS };

const cloneLinks = (ls: d3.SimulationLinkDatum<SimNode>[]) =>
  ls.map((link) => ({ ...link }));

const updateOptions = (newOptions: Partial<ForceSimulationOptions>) => {
  Object.entries(newOptions).forEach(([option, value]) => {
    switch (option) {
      case 'alphaDecay':
        simulation.alphaDecay(value);
        break;
      case 'velocityDecay':
        simulation.velocityDecay(value);
        break;
      case 'charge':
        simulation.force('charge', d3.forceManyBody().strength(value));
        break;
      case 'center':
        simulation.force('x', d3.forceX().strength(value));
        simulation.force('y', d3.forceY().strength(value));
        break;
      case 'linkDistance':
        simulation.force(
          'links',
          d3.forceLink(cloneLinks(links)).distance(value),
        );
        break;
      default:
    }
  });

  options = { ...options, ...newOptions };
  simulation.alpha(0.3).restart();
};

type InitializeMessage = {
  type: 'initialize';
  network: {
    nodes: SimNode[];
    links: d3.SimulationLinkDatum<SimNode>[];
  };
  options?: ForceSimulationOptions;
};

type UpdateOptionsMessage = {
  type: 'update_options';
  options: ForceSimulationOptions;
};

type StopMessage = { type: 'stop' };
type StartMessage = { type: 'start' };
type ReheatMessage = { type: 'reheat' };

type UpdateNetworkMessage = {
  type: 'update_network';
  network: {
    nodes: SimNode[];
    links: d3.SimulationLinkDatum<SimNode>[];
  };
  restart: boolean;
};

type UpdateNodeMessage = {
  type: 'update_node';
  nodeId: string;
  node: Partial<SimNode>;
};

type Message =
  | InitializeMessage
  | UpdateOptionsMessage
  | StopMessage
  | StartMessage
  | ReheatMessage
  | UpdateNetworkMessage
  | UpdateNodeMessage;

onmessage = ({ data }: { data: Message }) => {
  switch (data.type) {
    case 'initialize': {
      const { network } = data;
      links = network.links;

      console.debug('worker:initialize', network.nodes.length, 'nodes');

      const initialOptions = {
        ...DEFAULT_OPTIONS,
        ...data.options,
      };

      simulation = d3.forceSimulation(network.nodes);
      updateOptions(initialOptions);

      simulation.alpha(0).stop();

      simulation.on('tick', () => {
        postMessage({
          type: 'tick',
          nodes: simulation.nodes(),
        });
      });

      simulation.on('end', () => {
        console.debug('worker:end');
        postMessage({
          type: 'end',
          nodes: simulation.nodes(),
        });
      });
      break;
    }
    case 'update_options': {
      updateOptions(data.options);
      break;
    }
    case 'stop': {
      if (!simulation) return;
      console.debug('worker:stop');
      simulation.stop();
      postMessage({ type: 'end', nodes: simulation.nodes() });
      break;
    }
    case 'start': {
      if (!simulation) return;
      console.debug('worker:start');
      simulation.alpha(1).restart();
      break;
    }
    case 'reheat': {
      if (!simulation) return;
      console.debug('worker:reheat');
      simulation.alpha(0.3).restart();
      break;
    }
    case 'update_network': {
      if (!simulation) return;

      const { network } = data;
      links = network.links;

      simulation.nodes(network.nodes);
      simulation.force(
        'links',
        d3.forceLink(cloneLinks(links)).distance(options.linkDistance),
      );

      if (data.restart) {
        simulation.alpha(0.3).restart();
      }
      break;
    }
    case 'update_node': {
      if (!simulation) return;

      const nodes = simulation.nodes().map((node) => {
        if (node.nodeId !== data.nodeId) return node;
        return { ...node, ...data.node };
      });

      simulation.nodes(nodes);
      simulation.force(
        'links',
        d3.forceLink(cloneLinks(links)).distance(options.linkDistance),
      );

      simulation.alpha(0.3).restart();
      break;
    }
    default:
  }
};
