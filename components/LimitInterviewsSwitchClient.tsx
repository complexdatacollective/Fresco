import Switch from './SwitchWithOptimisticUpdate';
import { setLimitInterviews } from '~/actions/appSettings';

const LimitInterviewsSwitchClient = ({
  limitInterviews,
}: {
  limitInterviews: boolean;
}) => {
  return (
    <Switch
      initialValue={limitInterviews}
      name="limitInterviews"
      action={setLimitInterviews}
    />
  );
};

export default LimitInterviewsSwitchClient;
