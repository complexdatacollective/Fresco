'use client';

import { FileUp } from 'lucide-react';
import { unparse } from 'papaparse';
import { useCallback } from 'react';
import type { ParticipantWithInterviews } from '~/app/dashboard/_components/ParticipantsTable/ParticipantsTableClient';
import type { ProtocolWithInterviews } from '~/app/dashboard/_components/ProtocolsTable/ProtocolsTableClient';
import { Button } from '~/components/ui/Button';
import { useToast } from '~/components/ui/Toast';
import { useDownload } from '~/hooks/useDownload';

export function useExportParticipants(protocols: ProtocolWithInterviews[]) {
  const download = useDownload();
  const { add } = useToast();

  return useCallback(
    (participants: ParticipantWithInterviews[]) => {
      try {
        const csvData = participants.map((participant) => {
          const row: Record<string, string> = {
            id: participant.id,
            identifier: participant.identifier,
            label: participant.label ?? '',
          };

          for (const protocol of protocols) {
            const name = protocol.name.split('.')[0] ?? protocol.id;
            row[`interview_url_${name}`] =
              `${window.location.origin}/onboard/${protocol.id}/?participantId=${participant.id}`;
          }

          return row;
        });

        const csv = unparse(csvData, { header: true });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        download(url, 'participants.csv');
        URL.revokeObjectURL(url);

        add({
          title: 'Success',
          description: 'Participants exported successfully',
          type: 'success',
        });
      } catch (error) {
        add({
          title: 'Error',
          description: 'An error occurred while exporting participants',
          type: 'destructive',
        });
      }
    },
    [protocols, download, add],
  );
}

function ExportParticipants({
  participants,
  protocols,
}: {
  participants: ParticipantWithInterviews[];
  protocols: ProtocolWithInterviews[];
}) {
  const exportParticipants = useExportParticipants(protocols);

  return (
    <Button
      disabled={participants.length === 0}
      onClick={() => exportParticipants(participants)}
      icon={<FileUp />}
      data-testid="export-participants-button"
    >
      Export Participants
    </Button>
  );
}

export default ExportParticipants;
