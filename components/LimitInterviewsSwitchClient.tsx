import Switch from './SwitchWithOptimisticUpdate';
import { setLimitInterviews } from '~/actions/appSettings';

const LimitInterviewsSwitch = ({
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

export default LimitInterviewsSwitch;
