import ResponsiveContainer from '~/components/ResponsiveContainer';
import SettingsSection from '~/components/layout/SettingsSection';
import Paragraph from '~/components/ui/typography/Paragraph';
import type { GetParticipantsReturnType } from '~/queries/participants';
import ImportCSVModal from '../ImportCSVModal';
import ExportParticipants from './ExportParticipants';

export default function ImportExportSection({
  participantsPromise,
}: {
  participantsPromise: GetParticipantsReturnType;
}) {
  return (
    <ResponsiveContainer>
      <SettingsSection
        heading="Import/Export Participants in Bulk"
        controlArea={
          <div className="flex w-72 flex-col items-center justify-end gap-4">
            <ImportCSVModal />
            <ExportParticipants participantsPromise={participantsPromise} />
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
