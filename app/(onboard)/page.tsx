import getSetupMetadata from '~/utils/getSetupMetadata';
import OnboardWizard from './_components/OnboardWizard';
import { OnboardTabs } from './_components/OnboardTabs';
import { userFormClasses } from './_shared';

async function Home() {
  const { configured } = await getSetupMetadata();
  
  return (
    <div className={userFormClasses}>
      { configured ? (
        <OnboardTabs />
      ) : (
        <OnboardWizard />        
     )}
    </div>
  );
}

export default Home;
