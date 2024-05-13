import 'server-only';
import Switch from './SwitchWithOptimisticUpdate';
import { setLimitInterviews } from '~/actions/appSettings';
import { getLimitInterviewsStatus } from '~/queries/appSettings';

const LimitInterviewsSwitch = async () => {
  const limitInterviews = await getLimitInterviewsStatus();

  return (
    <Switch
      initialValue={limitInterviews}
      name="limitInterviews"
      action={setLimitInterviews}
    />
  );
};

export default LimitInterviewsSwitch;
