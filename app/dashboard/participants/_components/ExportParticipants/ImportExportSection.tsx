'use client';

import { use } from 'react';
import superjson from 'superjson';
import AddParticipantButton from '~/app/dashboard/participants/_components/AddParticipantButton';
import { GenerateParticipantURLs } from '~/app/dashboard/participants/_components/ExportParticipants/GenerateParticipantURLsButton';
import ImportCSVModal from '~/app/dashboard/participants/_components/ImportCSVModal';
import SettingsCard from '~/components/settings/SettingsCard';
import Paragraph from '~/components/typography/Paragraph';
import type {
  GetParticipantsQuery,
  GetParticipantsReturnType,
} from '~/queries/participants';
import type {
  GetProtocolsQuery,
  GetProtocolsReturnType,
} from '~/queries/protocols';
import ExportParticipants from './ExportParticipants';

export default function ImportExportSection({
  participantsPromise,
  protocolsPromise,
}: {
  participantsPromise: GetParticipantsReturnType;
  protocolsPromise: GetProtocolsReturnType;
}) {
  const rawParticipants = use(participantsPromise);
  const rawProtocols = use(protocolsPromise);
  const participants = superjson.parse<GetParticipantsQuery>(rawParticipants);
  const protocols = superjson.parse<GetProtocolsQuery>(rawProtocols);

  return (
    <div className="tablet-landscape:grid-cols-2 mx-auto grid w-full max-w-6xl grid-cols-1 gap-4">
      <SettingsCard
        title="Import & Add Participants"
        controlArea={
          <div className="tablet-landscape:w-72 flex w-full flex-col items-center justify-end gap-4">
            <ImportCSVModal />
            <AddParticipantButton existingParticipants={participants} />
          </div>
        }
        className="overflow-visible"
      >
        <Paragraph>
          Import participants from a CSV file or add a single participant.
        </Paragraph>
      </SettingsCard>
      <SettingsCard
        title="Export Participants"
        controlArea={
          <div className="tablet-landscape:w-72 flex w-full flex-col items-center justify-end gap-4">
            <ExportParticipants participants={participants} />
            <GenerateParticipantURLs
              participants={participants}
              protocols={protocols}
            />
          </div>
        }
        className="overflow-visible"
      >
        <Paragraph>Export participant data and participation URLs.</Paragraph>
      </SettingsCard>
    </div>
  );
}
