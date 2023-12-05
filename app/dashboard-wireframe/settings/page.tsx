import ActionPanelButton from '../_components/ActionPanelButton';
import ActionPanelSwitch from '../_components/ActionPanelSwitch';
import SectionHeading from '../_components/SectionHeading';

const Page = () => {
  return (
    <div className="lg:pl-72">
      <div className="py-4">
        <div className="px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Settings" />

          <ActionPanelSwitch />

          <ActionPanelButton
            title="Reset all app data"
            description="This action will delete all the data you provided during the onboarding step"
            color="red"
            btnText="Reset"
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
