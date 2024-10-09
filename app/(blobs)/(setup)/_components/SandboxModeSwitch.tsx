'use client';
import { setAppSetting } from '~/actions/appSettings';
import SwitchWithOptimisticUpdate from '~/components/SwitchWithOptimisticUpdate';

const SandboxModeSwitch = ({ sandboxMode }: { sandboxMode: boolean }) => {
  return (
    <SwitchWithOptimisticUpdate
      initialValue={sandboxMode}
      name="sandboxMode"
      action={setAppSetting}
    />
  );
};

export default SandboxModeSwitch;
