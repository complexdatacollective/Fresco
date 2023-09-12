import { OnboardTabs } from './_components/OnboardTabs';
import { userFormClasses } from './_shared';

function Home() {
  return (
    <div className={userFormClasses}>
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">Welcome to Fresco</h1>
        <p>This is where we might have some info about the project.</p>
      </div>
      <OnboardTabs />
    </div>
  );
}

export default Home;
