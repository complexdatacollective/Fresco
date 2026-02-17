import { Pause as PauseIcon, Play as PlayIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { type RefObject } from 'react';

type SimulationPanelProps = {
  simulationEnabled: boolean;
  onToggle: () => void;
  dragConstraints: RefObject<HTMLElement | null>;
};

export default function SimulationPanel({
  simulationEnabled,
  onToggle,
  dragConstraints,
}: SimulationPanelProps) {
  return (
    <motion.div
      className="bg-surface/80 absolute top-4 left-4 z-10 cursor-move rounded-lg shadow-lg backdrop-blur-md"
      drag
      dragConstraints={dragConstraints}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 px-4 py-2 text-sm"
      >
        <span className="flex size-6 items-center justify-center">
          {simulationEnabled ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </span>
        {simulationEnabled ? 'Pause Auto Layout' : 'Resume Auto Layout'}
      </button>
    </motion.div>
  );
}
