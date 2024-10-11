import Switch from './AppSettingsSwitchWithOptimisticUpdate';

const LimitInterviewsSwitchClient = ({
  limitInterviews,
}: {
  limitInterviews: boolean;
}) => {
  return (
    <Switch
      initialValue={limitInterviews}
      name="limitInterviews"
      appSettingKey="limitInterviews"
    />
  );
};

export default LimitInterviewsSwitchClient;
