import ActionPanelButton from './_components/ActionPanelButton';
import ActionPanelSwitch from './_components/ActionPanelSwitch';
import SectionHeading from './_components/SectionHeading';
import Stats from './_components/Stats';

export default function Page() {
  return (
    <div>
      <div className="lg:pl-72">
        <div className="py-4">
          <div className="px-4 sm:px-6 lg:px-8">
            <SectionHeading title="Dashboard" />
            <Stats />

            <ActionPanelSwitch />
            <ActionPanelButton
              title="Start anonymous interview"
              description="You can start anonymous interview session directly"
              color="emerald"
              btnText="Start"
            />
            <ActionPanelButton
              title="Reset all app data"
              description="This action will delete all the data you provided during the onboarding step"
              color="red"
              btnText="Reset"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
