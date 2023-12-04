import Stats from './_components/Stats';

export default function Page() {
  return (
    <div>
      <div className="lg:pl-72">
        <div className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            Dashboard page
            <Stats />
          </div>
        </div>
      </div>
    </div>
  );
}
