import { api } from '~/trpc/server';
import Switch from './Switch';
import 'server-only';

const AnalyticsSwitch = async () => {
  const appSettings = await api.appSettings.get.query();

  return <Switch allowAnalytics={!!appSettings?.allowAnalytics} />;
};

export default AnalyticsSwitch;
