import Paragraph from '~/components/ui/typography/Paragraph';
import SettingsSection from '~/components/layout/SettingsSection';
import ImportCSVModal from '../ImportCSVModal';
import ExportParticipants, {
  ExportParticipantsFallback,
} from './ExportParticipants';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import { Suspense } from 'react';
import { getParticipants } from '~/queries/participants';

export default function ImportExportSection() {
  const participantsPromise = getParticipants();
  return (
    <ResponsiveContainer>
      <SettingsSection
        heading="Import/Export Participants in Bulk"
        controlArea={
          <div className="flex w-72 flex-col items-center justify-end gap-4">
            <ImportCSVModal />
            <Suspense fallback={<ExportParticipantsFallback />}>
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
