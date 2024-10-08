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
      name="limitInterviews"
      action={setAppSetting}
    />
  );
};

export default LimitInterviewsSwitchClient;
