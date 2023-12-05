import { ParticipantsTable } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/ParticipantsTable';
import SectionHeading from '../_components/SectionHeading';
import { api } from '~/trpc/server';

export const dynamic = 'force-dynamic';

const Page = async () => {
  const participants = await api.participant.get.all.query();

  return (
    <div className="lg:pl-72">
      <div className="py-4">
        <div className="px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Participants Management View" />
          <ParticipantsTable initialData={participants} />
        </div>
      </div>
    </div>
  );
};

export default Page;
