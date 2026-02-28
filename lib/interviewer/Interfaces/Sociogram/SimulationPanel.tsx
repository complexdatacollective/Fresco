import { Pause as PauseIcon, Play as PlayIcon } from 'lucide-react';
import Button from '~/components/ui/Button';

type SimulationPanelProps = {
  simulationEnabled: boolean;
  onToggle: () => void;
};

export default function SimulationPanel({
  simulationEnabled,
  onToggle,
}: SimulationPanelProps) {
  return (
    <Button
      color="dynamic"
      onClick={onToggle}
      className="flex items-center gap-2 px-4 py-2 text-sm"
      icon={simulationEnabled ? <PauseIcon /> : <PlayIcon />}
    >
      {simulationEnabled ? 'Pause Auto Layout' : 'Resume Auto Layout'}
    </Button>
  );
}
