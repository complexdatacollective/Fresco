'use client';
import { setSandboxMode } from '~/actions/appSettings';
import SwitchWithOptimisticUpdate from '~/components/SwitchWithOptimisticUpdate';

const SandboxModeSwitch = ({ sandboxMode }: { sandboxMode: boolean }) => {
  return (
    <SwitchWithOptimisticUpdate
      initialValue={sandboxMode}
      name="setSandboxMode"
      action={setSandboxMode}
    />
  );
};

export default SandboxModeSwitch;
