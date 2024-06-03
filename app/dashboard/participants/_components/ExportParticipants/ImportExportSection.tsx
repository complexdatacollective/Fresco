import { Suspense } from 'react';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import SettingsSection from '~/components/layout/SettingsSection';
import { ButtonSkeleton } from '~/components/ui/Button';
import Paragraph from '~/components/ui/typography/Paragraph';
import { getParticipants } from '~/queries/participants';
import ImportCSVModal from '../ImportCSVModal';
import ExportParticipants from './ExportParticipants';

export default function ImportExportSection() {
  const participantsPromise = getParticipants();
  return (
    <ResponsiveContainer>
      <SettingsSection
        heading="Import/Export Participants in Bulk"
        controlArea={
          <div className="flex w-72 flex-col items-center justify-end gap-4">
            <ImportCSVModal />
            <Suspense fallback={<ButtonSkeleton className="w-full" />}>
              <ExportParticipants participantsPromise={participantsPromise} />
            </Suspense>
          </div>
        }
      >
        <Paragraph>
          Import or export participants in bulk using the options to the right.
          Refer to our documentation for information about the formats used.
        </Paragraph>
      </SettingsSection>
    </ResponsiveContainer>
  );
}
