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
          </div>
        </div>
      </div>
    </div>
  );
}
