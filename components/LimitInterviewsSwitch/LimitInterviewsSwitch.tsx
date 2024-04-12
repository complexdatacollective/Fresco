import 'server-only';
import { api } from '~/trpc/server';
import Switch from './Switch';

export const dynamic = 'force-dynamic';

const LimitInterviewsSwitch = async () => {
  const limitInterviews =
    await api.appSettings.getLimitInterviewsStatus.query();

  return <Switch limitInterviews={limitInterviews} />;
};

export default LimitInterviewsSwitch;
