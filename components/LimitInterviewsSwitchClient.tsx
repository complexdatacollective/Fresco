import { setAppSetting } from '~/actions/appSettings';
import Switch from './SwitchWithOptimisticUpdate';

const LimitInterviewsSwitchClient = ({
  limitInterviews,
}: {
  limitInterviews: boolean;
}) => {
  return (
    <Switch
      initialValue={limitInterviews}
      updateValue={async (value) => {
        await setAppSetting('limitInterviews', value);
        return value;
      }}
    />
  );
};

export default LimitInterviewsSwitchClient;
