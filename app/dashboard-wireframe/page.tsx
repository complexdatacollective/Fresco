import ActivityFeed from './_components/ActivityFeed';
import RecentProtocols from './_components/RecentProtocols';
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

            <div className="space-y-10 py-10 xl:space-y-16">
              <ActivityFeed />
              <RecentProtocols />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
