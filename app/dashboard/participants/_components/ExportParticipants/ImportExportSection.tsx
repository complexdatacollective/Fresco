'use client';

import { use } from 'react';
import superjson from 'superjson';
import AddParticipantButton from '~/app/dashboard/participants/_components/AddParticipantButton';
import { GenerateParticipantURLs } from '~/app/dashboard/participants/_components/ExportParticipants/GenerateParticipantURLsButton';
import ImportCSVModal from '~/app/dashboard/participants/_components/ImportCSVModal';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
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
      <Surface className="flex flex-col gap-4 rounded" noContainer>
        <Heading level="h4" variant="all-caps" margin="none">
          Import & Add Participants
        </Heading>
        <Paragraph>
          Import participants from a CSV file or add a single participant.
        </Paragraph>
        <div className="flex flex-col gap-2">
          <ImportCSVModal />
          <AddParticipantButton existingParticipants={participants} />
        </div>
      </Surface>
      <Surface
        className="flex flex-col gap-4 overflow-visible rounded"
        noContainer
      >
        <Heading level="h4" variant="all-caps" margin="none">
          Export Participants
        </Heading>
        <Paragraph>Export participant data and participation URLs.</Paragraph>
        <div className="flex flex-col gap-2">
          <ExportParticipants participants={participants} />
          <GenerateParticipantURLs
            participants={participants}
            protocols={protocols}
          />
        </div>
      </Surface>
    </div>
  );
}
