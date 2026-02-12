import { Suspense } from 'react';
import SettingsCard from '~/components/settings/SettingsCard';
import Paragraph from '~/components/typography/Paragraph';
import { ButtonSkeleton } from '~/components/ui/Button';
import { getParticipants } from '~/queries/participants';
import ImportCSVModal from '../ImportCSVModal';
import ExportParticipants from './ExportParticipants';

export default function ImportExportSection() {
  const participantsPromise = getParticipants();
  return (
    <SettingsCard
      title="Import/Export Participants in Bulk"
      controlArea={
        <div className="tablet:w-72 flex w-full flex-col items-center justify-end gap-4">
          <ImportCSVModal />
          <Suspense fallback={<ButtonSkeleton className="w-full" />}>
            <ExportParticipants participantsPromise={participantsPromise} />
          </Suspense>
        </div>
      }
      className="mx-auto overflow-visible"
    >
      <Paragraph>
        Import or export participants in bulk using the options to the right.
        Refer to our documentation for information about the formats used.
      </Paragraph>
    </SettingsCard>
  );
}
