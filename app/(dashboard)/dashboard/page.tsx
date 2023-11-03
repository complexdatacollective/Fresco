import ResetButton from './_components/ResetButton';
import AnonymousRecruitmentSwitch from '~/components/AnonymousRecruitmentSwitch/AnonymousRecruitmentSwitch';
import Link from 'next/link';
import { Button } from '~/components/ui/Button';
import AnalyticsSwitch from '~/components/AnalyticsSwitch/AnalyticsSwitch';

function Home() {
  return (
    <>
      <main className="mx-auto flex w-[80%] max-w-[1200px] flex-col gap-10 p-10">
        <h1 className="mb-2 text-3xl font-bold">Welcome</h1>
        <p>This is the main dashboard.</p>
        <Link href="/interview/new">
          <Button>Start anonymous interview</Button>
        </Link>
        <ResetButton />
        <AnonymousRecruitmentSwitch />
        <AnalyticsSwitch />
      </main>
    </>
  );
}

export default Home;
