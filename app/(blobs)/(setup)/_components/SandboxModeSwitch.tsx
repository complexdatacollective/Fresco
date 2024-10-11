'use client';
import SwitchWithOptimisticUpdate from '~/components/AppSettingsSwitchWithOptimisticUpdate';

const SandboxModeSwitch = ({ sandboxMode }: { sandboxMode: boolean }) => {
  return (
    <SwitchWithOptimisticUpdate
      initialValue={sandboxMode}
      name="sandboxMode"
      appSettingKey="sandboxMode"
    />
  );
};

export default SandboxModeSwitch;
