import ResponsiveContainer from '~/components/ResponsiveContainer';
import Section from '~/components/layout/Section';
import { getParticipants } from '~/queries/participants';
import { getProtocols } from '~/queries/protocols';
import { ParticipantsTableClient } from '../_components/ParticipantsTable/ParticipantsTableClient';
import ImportExportSection from './_components/ExportParticipants/ImportExportSection';

export default function ParticipantPage() {
  const participantsPromise = getParticipants();
  const protocolsPromise = getProtocols();

  return (
    <>
      <ImportExportSection participantsPromise={participantsPromise} />
      <ResponsiveContainer maxWidth="6xl">
        <Section>
          <ParticipantsTableClient
            participantsPromise={participantsPromise}
            protocolsPromise={protocolsPromise}
          />
        </Section>
      </ResponsiveContainer>
    </>
  );
}
